import os
from rest_framework import generics, permissions, filters, status, views
from rest_framework.response import Response
from .models import Artist, FavouriteArtist, ArtistVerificationRequest
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from . import serializers
from django.db.models import Sum, Q, Count
from apps.core.permissions import AdminPermission, ArtistPermission
from django.db import transaction
from django.core.files.storage import default_storage
from django.db.models.functions import Coalesce
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from ..core.choices import RejectionReason
from ..core.notification import send_system_notification, send_system_event
from apps.core.choices import BlockReason
from apps.releases.models import Release
from django.contrib.auth import get_user_model
from apps.releases.serializers import ListenerReleaseSerializer
from ..core.validators import check_file_security
from rest_framework.exceptions import ValidationError

User = get_user_model()
# ==========================================================================================
# -------------------------------- Chức năng cho Listener --------------------------------
# ==========================================================================================
# Lấy danh sách nghệ sĩ
class ArtistListView(generics.ListAPIView):
    serializer_class = serializers.ListenerArtistSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['stage_name']

    def get_queryset(self):
        return Artist.objects.filter(
            is_active=True, 
            is_blocked=False,
            is_verify=True,
            tracks__is_active=True,
            tracks__is_blocked=False,
            tracks__release__is_published=True
        ).distinct()

# Lấy chi tiết nghệ sĩ
class ArtistDetailView(generics.RetrieveAPIView):
    serializer_class = serializers.ListenerArtistDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'short_id'

    def get_queryset(self):
        return Artist.objects.filter(
            is_active=True, 
            is_blocked=False,
            is_verify=True,
            tracks__is_active=True,
            tracks__is_blocked=False,
            tracks__release__is_published=True
        ).distinct()
    
# 1. API: Fans Also Like (Gợi ý Nghệ sĩ)
class RelatedArtistListView(generics.ListAPIView):
    serializer_class = serializers.ShortArtistSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        short_id = self.kwargs.get('short_id')
        current_artist = generics.get_object_or_404(Artist, short_id=short_id)
        
        # BƯỚC 1: Tìm những User đã thả tim nhạc của Artist này
        users_who_liked = current_artist.tracks.filter(liked_by__isnull=False) \
            .values_list('liked_by', flat=True).distinct()[:200]
        
        qs_list = []
        if users_who_liked:
            # BƯỚC 2: Tìm các Artist khác mà nhóm User này cũng thích
            queryset = Artist.objects.filter(
                tracks__liked_by__in=users_who_liked,
                is_active=True,
                is_blocked=False
            ).exclude(id=current_artist.id) \
             .annotate(overlap_score=Count('id')) \
             .order_by('-overlap_score')[:6]
            
            qs_list = list(queryset)

        if len(qs_list) < 6:
            needed = 6 - len(qs_list)
            exclude_ids = [current_artist.id] + [a.id for a in qs_list]
            
            fallback = Artist.objects.filter(
                is_active=True, 
                is_blocked=False
            ).exclude(id__in=exclude_ids)\
             .order_by('-id')[:needed] # Dùng -id hoặc -created_at vừa nhanh vừa an toàn
            
            qs_list.extend(list(fallback))

        return qs_list
    
# lấy trang discography
class ArtistDiscographyListView(generics.ListAPIView):
    serializer_class = ListenerReleaseSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        artist_short_id = self.kwargs.get('short_id')
        filter_type = self.request.query_params.get('type')
        
        queryset = Release.objects.filter(
            artist__short_id=artist_short_id,
            is_active=True,
            is_published=True
        ).order_by('-created_at')

        if filter_type:
            # Nếu truyền 'single', mình lọc cả 'single' và 'ep' cho giống Spotify
            if filter_type == 'single':
                queryset = queryset.filter(Q(release_type='single') | Q(release_type='ep'))
            else:
                queryset = queryset.filter(release_type=filter_type)
                
        return queryset
    
# lấy danh sách nghệ sĩ trending
class TrendingArtistListView(generics.ListAPIView):
    serializer_class = serializers.ListenerArtistSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class=None

    @method_decorator(cache_page(60 * 15)) 
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get_queryset(self):
        # Nếu model Artist có OneToOneField với User, nhớ thêm .select_related('user')
        return Artist.objects.filter(
                is_active=True,
                is_blocked=False, 
                is_verify=True,
                user__is_active=True,
                # Bỏ bớt filter trùng lặp không cần thiết ở bảng tracks để giảm tải JOIN
            ).distinct()\
             .annotate(total_listens=Coalesce(Sum('tracks__listens', 
                filter=Q(
                    tracks__is_active=True, 
                    tracks__is_blocked=False, 
                    tracks__release__is_published=True
                )
            ), 0))\
            .order_by('-total_listens')[:10]
    
# like và bỏ like nghệ sĩ
class FavouriteArtistToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, short_id):
        user=request.user
        artist = get_object_or_404(Artist, 
            short_id=short_id, 
            is_active=True, 
            is_blocked=False, 
            is_verify=True,
            user__is_active=True
        )
        favourite_artist = FavouriteArtist.objects.filter(
            user=user, 
            artist=artist
        )
        if favourite_artist.exists():
            favourite_artist.delete()
            return Response({"detail": "Artist removed from favourite list."}, status=status.HTTP_204_NO_CONTENT)
        else:
            FavouriteArtist.objects.create(user=user, artist=artist)
            return Response({"detail": "Artist added to favourite list."}, status=status.HTTP_201_CREATED)
        
# Lấy danh sách nghệ sĩ yêu thích của user
class MyFavouriteArtistListView(generics.ListAPIView):
    serializer_class = serializers.FavouriteArtistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FavouriteArtist.objects.filter(
            user=self.request.user, 
            artist__is_active=True, 
            artist__is_blocked=False, 
            artist__is_verify=True,
            artist__user__is_active=True,
        ).select_related('artist').order_by('created_at')

# dky làm nghệ sĩ
class ApplyArtistView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    @transaction.atomic
    def post(self, request):
        stage_name = request.data.get('stage_name')
        social_link = request.data.get('social_link')
        contact_phone = request.data.get('contact_phone')
        identity_document = request.FILES.get('identity_document')
        image = request.FILES.get('image')

        user = request.user

        if not all([stage_name, social_link, contact_phone, identity_document, image]):
            return Response({
                "detail": "Vui lòng cung cấp đầy đủ Nghệ danh, SĐT, Link MXH và Hình ảnh!"
            }, status=status.HTTP_400_BAD_REQUEST)
        # validate data
        try:
            # Avatar tối đa 5MB
            check_file_security(
                image, 
                5, 
                ['.png', '.jpg', '.jpeg', '.webp']
            )
            # Giấy tờ (CCCD) tối đa 5MB, cho phép thêm PDF
            check_file_security(
                identity_document, 
                5, 
                ['.png', '.jpg', '.jpeg', '.pdf']
            )
        except ValidationError as e:
            return Response({"detail": str(e.detail[0])}, status=status.HTTP_400_BAD_REQUEST)

        # Chặn nếu user đang có đơn pending hoặc đã duyệt
        if ArtistVerificationRequest.objects.filter(user=user, status__in=['pending', 'approved']).exists():
            return Response({
                "detail": "Bạn đã gửi yêu cầu hoặc đã là nghệ sĩ rồi!"
            }, status=status.HTTP_400_BAD_REQUEST)

        # 1. Tạo Artist chờ (Django TỰ ĐỘNG upload file image lên R2)
        artist = Artist.objects.create(
            user=user, 
            stage_name=stage_name, 
            image=image,
            is_active=False
        )
        
        # 2. Tạo Đơn kèm Bằng chứng (Django TỰ ĐỘNG upload CCCD lên R2)
        ArtistVerificationRequest.objects.create(
            user=request.user,
            artist=artist, 
            status='pending',
            identity_document=identity_document,
            social_link=social_link,
            contact_phone=contact_phone
        )
        # gửi thông báo admin
        admins = User.objects.filter(is_staff=True, is_active=True)
        for admin in admins:
            send_system_notification(
                user=admin,
                title="New Release Submission",
                message=f"User '{user.stage_name}' has apply to be an artist on our platform.",
                use_app=True,
                metadata={
                    'type': 'artist',
                    'status': 'pending'
                }
            )

        return Response({
            "detail": "Đã nộp hồ sơ! Vui lòng chờ Admin xác minh danh tính."
        }, status=status.HTTP_201_CREATED)
    
# ==========================================================================================
# -------------------------------- Chức năng cho Artist quản lý profile nghệ sĩ --------------------------------
# ==========================================================================================
class StudioArtistProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = serializers.ArtistProfileUpdateSerializer
    permission_classes = [ArtistPermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser] 

    def get_object(self):
        return self.request.user.artist_profile

# ==========================================================================================
# -------------------------------- Chức năng cho Admin --------------------------------
# ==========================================================================================
# lấy danh sách nghệ sĩ để quản lý
class AdminArtistListView(generics.ListAPIView):
    serializer_class = serializers.AdminArtistSerializer
    permission_classes = [AdminPermission]
    filter_backends = [filters.SearchFilter]
    search_fields = ['stage_name', 'user__email']
    
    def get_queryset(self):
        qs = Artist.objects.annotate(followers_count=Count('favourite_by'))
        status_filter = self.request.query_params.get('status', 'active')

        if status_filter == 'active':
            qs = qs.filter(
                is_active=True,
                is_verify=True,
                is_blocked=False,
            )
        elif status_filter == 'blocked':
            qs = qs.filter(
                is_blocked=True,
                is_active=True,
                is_verify=True,
            )
        return qs.order_by('-followers_count')
    
# xem chi tiết 1 Artist dành cho Admin
class AdminArtistDetailView(generics.RetrieveAPIView):
    permission_classes = [AdminPermission]
    queryset = Artist.objects.all()
    serializer_class = serializers.AdminArtistDetailSerializer
    lookup_field = 'short_id'
# xử lý block nghệ sĩ
class AdminBlockArtistActionView(views.APIView):
    permission_classes = [AdminPermission]

    def patch(self, request, short_id):
        artist = get_object_or_404(Artist, short_id=short_id)
        
        # Lấy data từ FE gửi lên
        action = request.data.get('action') # 'block' hoặc 'unblock'
        block_reason = request.data.get('block_reason') # Số ID của BlockReason
        block_note = request.data.get('block_note', '').strip() or None

        if action == 'block':
            if not block_reason or int(block_reason) not in BlockReason.values:
                return Response({"detail": "Vui lòng cung cấp lý do chặn hợp lệ!"}, status=status.HTTP_400_BAD_REQUEST)
            note = request.data.get('note', '').strip()

            # Cập nhật trạng thái
            artist.is_blocked = True
            artist.block_reason = int(block_reason)
            artist.block_note = block_note
            artist.save()

            # Gửi thông báo cho User sở hữu Artist Profile
            if artist.user:
                reason_text = dict(BlockReason.choices).get(int(block_reason), "A serious violation of our terms.")
                note_text = f" Ghi chú: {note}." if note else ""
                send_system_notification(
                    user=artist.user,
                    title="Your artist profile is locked.",
                    message=f"Your artist profile '{artist.stage_name}' has been locked. Reason: {reason_text}. {note_text}",
                    use_app=True,
                    use_email=True,
                )
                send_system_event('ARTIST_BLOCKED', {
                    'short_id': short_id, 
                    'type': 'artist'
                })
            
            # gửi tbao cho user nào thích artist này
            favorite_records = artist.favourite_by.select_related('user').all()
            
            for record in favorite_records:
                send_system_notification(
                    user=record.user,
                    title="Artist Blocked",
                    message=f"An artist: '{artist.stage_name}' you followed has now been removed from the platform.",
                    use_app=True,
                    metadata={
                        'type': 'artist'
                    }
                )
                
            return Response({"detail": "Đã khóa kênh Nghệ sĩ thành công!"}, status=status.HTTP_200_OK)

        elif action == 'unblock':
            # 1. Mở khóa và xóa lý do
            artist.is_blocked = False
            artist.block_reason = None
            artist.block_note = None
            artist.save()

            # 2. Gửi thông báo tin vui
            if artist.user:
                send_system_notification(
                    user=artist.user,
                    title="Your artist profile is unlocked.",
                    message=f"Your artist profile '{artist.stage_name}' has been restored.",
                    use_app=True,
                    metadata={
                        'type': 'artist',
                        'action': 'restored'
                    }
                )
            
            # gửi tbao cho user nào thích artist này
            favorite_records = artist.favourite_by.select_related('user').all()
            
            for record in favorite_records:
                send_system_notification(
                    user=record.user,
                    title="Artist Unblocked",
                    message=f"An artist: '{artist.stage_name}' you followed has now been restored to the platform.",
                    use_app=True,
                    metadata={
                        'short_id': short_id, 
                        'type': 'artist'
                    }
                )
            
            return Response({"detail": "Đã mở khóa Nghệ sĩ!"}, status=status.HTTP_200_OK)

        return Response({"detail": "Hành động không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

# ========================================================================================================================== 
# -------------------------------------- quản lý duyệt nghệ sĩ mới -------------------------------------- 
# ========================================================================================================================== 
class AdminPendingVerificationListView(generics.ListAPIView):
    # Lấy danh sách đang chờ
    queryset = ArtistVerificationRequest.objects.filter(status='pending').select_related('user', 'artist').order_by('-created_at')
    serializer_class = serializers.AdminVerificationRequestSerializer
    permission_classes = [permissions.IsAdminUser]

class AdminVerificationActionView(APIView):
    permission_classes = [permissions.IsAdminUser]

    @transaction.atomic
    def patch(self, request, pk):
        verification_req = get_object_or_404(ArtistVerificationRequest, pk=pk)
        action = request.data.get('action')

        if verification_req.status != 'pending':
            return Response({
                "detail": "Đơn này đã được xử lý rồi!"
            }, status=status.HTTP_400_BAD_REQUEST)

        if action == 'approve':
            # Cập nhật đơn thành Approved
            verification_req.status = 'approved'
            verification_req.save()
            
            artist = verification_req.artist
            if artist:
                artist.is_active = True
                artist.is_verify = True
                artist.save()

                user = artist.user
                if user:
                    user.type = 'artist'
                    user.save()
                    send_system_notification(
                        user=user,
                        title="🎉🎉🎉 Your application to be an artist has been approved!",
                        message=f"Congratulations! Now you have permission to upload your own music under your stage name: '{artist.stage_name}'.",
                        use_app=True,
                        metadata={
                            'type': 'verification', 
                            'status': 'approved'
                        }
                    )
            
            return Response({
                "detail": "Đã duyệt!"
            }, status=status.HTTP_200_OK)

        elif action == 'reject':
            reason_id = request.data.get('reject_reason')
            # 1. Chuyển trạng thái đơn thành Rejected
            if not reason_id or int(reason_id) not in RejectionReason.values:
                return Response({"detail": "Lý do từ chối không hợp lệ!"}, status=status.HTTP_400_BAD_REQUEST)
            note = request.data.get('reject_note', '').strip() or None

            verification_req.status = 'rejected'
            verification_req.reject_reason = int(reason_id)
            if hasattr(verification_req, 'reject_note'):
                verification_req.reject_note = note

            verification_req.save()
            # 2. Dọn rác
            artist = verification_req.artist
            if artist:
                user = artist.user
                # 🔥 GỬI THÔNG BÁO TỪ CHỐI (Kèm lý do)
                if user:
                    reason_text = dict(RejectionReason.choices).get(int(reason_id), "Other")
                    note_text = f" Ghi chú: {note}." if note else ""
                    send_system_notification(
                        user=user,
                        title="Your application to be an artist has been rejected",
                        message=f"Unfortunately, your application was not approved. Reason: {reason_text}. {note_text} ! Please check your information and reapply.",
                        use_app=True,
                        metadata={
                            'type': 'verification', 
                            'status': 'rejected'
                        }
                    )

                folder_path = f"artists/{artist.slug}/"
                try:
                    dirs, files = default_storage.listdir(folder_path)
                    for file in files:
                        file_to_delete = f"{folder_path}{file}"
                        default_storage.delete(file_to_delete)
                    print(f"Đã xóa thư mục {folder_path}")

                except Exception as e:
                    print(f"Không thể xóa thư mục: {e}")
                # Xóa Artist (nhờ có on_delete=SET_NULL, đơn verification_req VẪN TỒN TẠI)
                artist.delete() 
            
            return Response({
                "detail": "Đã từ chối đơn, xóa Artist nháp và giữ lại lịch sử Rejected!"
            }, status=status.HTTP_200_OK)

        return Response({
            "detail": "Hành động không hợp lệ."
        }, status=status.HTTP_400_BAD_REQUEST)