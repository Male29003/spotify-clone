import re, io, os 
import datetime
import zipfile
import requests
from pydub import AudioSegment
from django.db import transaction
from django.db.models import Sum, F
from cryptography.fernet import Fernet
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.files.base import ContentFile
from django.shortcuts import get_object_or_404
from django.db.models.functions import Coalesce
from django.http import Http404, StreamingHttpResponse
from apps.core.permissions import AdminPermission, ArtistPermission
from rest_framework import generics, permissions, filters, status, views
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from ..core.notification import send_system_notification, send_system_event

from . import serializers
from ..music.models import Track
from apps.core.choices import BlockReason
from .models import Release, FavouriteRelease
from django.contrib.auth import get_user_model
from ..core.choices import ReleaseRejectReason
from apps.artists.models import FavouriteArtist
from ..core.permissions import PremiumUserPermission
from ..artists.models import Artist, generate_short_id
from ..analytics.models import StreamHistory, DownloadHistory
from apps.artists.serializers import GetArtistForFeaturedInfoSerializer
from rest_framework.exceptions import ValidationError
from ..core.validators import check_file_security

User = get_user_model()

# ==========================================================================================
# -------------------------------- Chức năng cho Listener --------------------------------
# ==========================================================================================
# Xem danh sách release
class ReleaseListView(generics.ListAPIView):
    serializer_class = serializers.ListenerReleaseSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'artist__stage_name']

    def get_queryset(self):
        qs = Release.objects.filter(
            is_published=True,
            is_active=True,
            is_blocked=False,
            artist__is_active=True,
            artist__is_blocked=False,
        ).select_related('artist')

        type_filter = self.request.query_params.get('type', 'all')
        if type_filter and type_filter.lower() != 'all':
            qs = qs.filter(release_type__iexact=type_filter)

        return qs.order_by('-release_date')

# Xem chi tiết release
class ReleaseDetailView(generics.RetrieveAPIView):
    serializer_class = serializers.ListenerReleaseDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'short_id'

    def get_queryset(self):
        return Release.objects.filter(
            is_published=True,
            is_active=True,
            is_blocked=False,
            artist__is_active=True,
            artist__is_blocked=False,
        )
# 2. API: You May Also Like (Gợi ý Release)
class RelatedReleaseListView(generics.ListAPIView):
    serializer_class = serializers.ShortReleaseSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        short_id = self.kwargs.get('short_id')
        current_release = generics.get_object_or_404(Release, short_id=short_id)
        
        # Gợi ý Release dựa trên: Cùng Nghệ sĩ -> Nếu hết thì lấy Release của Nghệ sĩ tương đồng
        queryset = Release.objects.filter(
            artist=current_release.artist,
            is_active=True,
            is_published=True,
            is_blocked=False
        ).exclude(id=current_release.id).order_by('-created_at')[:6]

        if queryset.count() < 6:
            needed = 6 - queryset.count()
            fallback = Release.objects.filter(
                is_active=True, is_published=True, is_blocked=False, artist__is_active=True
            ).exclude(id=current_release.id).exclude(id__in=queryset.values_list('id', flat=True)).order_by('?')[:needed]
            queryset = list(queryset) + list(fallback)

        return queryset

# Lấy tredning release
class TrendingReleaseListView(generics.ListAPIView):
    serializer_class = serializers.ListenerReleaseSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Release.objects.filter(
            is_published=True,
            is_blocked=False,
            is_active=True,
            artist__is_active=True,
            artist__is_blocked=False,
        ).select_related('artist')\
        .annotate(total_listens=Coalesce(Sum('tracks__listens'), 0))\
        .order_by('-total_listens')[:10]

# Favourite release hadling function
class FavouriteReleaseToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, short_id):
        release = get_object_or_404(Release, short_id=short_id)
        user = request.user
        favourite_release = FavouriteRelease.objects.filter(user=user, release=release)

        if favourite_release.exists():
            favourite_release.delete()
            return Response({"detail": "Release removed from favourite list."}, status=status.HTTP_204_NO_CONTENT)
        else:
            FavouriteRelease.objects.create(user=user, release=release)
            return Response({"detail": "Release added to favourite list."}, status=status.HTTP_201_CREATED)

class MyLibraryReleaseListView(generics.ListAPIView):
    serializer_class = serializers.FavouriteReleaseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FavouriteRelease.objects.filter(
            user=self.request.user,
            release__is_blocked=False,
            release__is_active=True
        ).select_related('release__artist')

# Lấy các Release nghe gần đây.
class RecentReleaseListView(generics.ListAPIView):
    serializer_class = serializers.ListenerReleaseSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Release.objects.none()

        # 1. Lấy danh sách ID các Release vừa nghe (Sử dụng created_at, KHÔNG PHẢI listened_at)
        recent_release_ids = StreamHistory.objects.filter(user=user, track__release__isnull=False) \
            .order_by('-created_at') \
            .values_list('track__release_id', flat=True)

        # 2. Xóa các ID trùng lặp nhưng vẫn giữ nguyên thứ tự nghe mới nhất
        seen = set()
        ordered_unique_ids = [x for x in recent_release_ids if not (x in seen or seen.add(x))][:10]

        # 3. Truy vấn Release dựa trên list ID đó
        if not ordered_unique_ids:
            return Release.objects.none()

        # Dùng Case/When để giữ nguyên thứ tự sắp xếp theo ordered_unique_ids
        from django.db.models import Case, When
        preserved_order = Case(*[When(id=pk, then=pos) for pos, pk in enumerate(ordered_unique_ids)])
        
        return Release.objects.filter(id__in=ordered_unique_ids).order_by(preserved_order)

# recommeend
class RecommendedReleaseListView(generics.ListAPIView):
    """Gợi ý Album/EP/Single liên quan đến sở thích"""
    serializer_class = serializers.ListenerReleaseSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        base_qs = Release.objects.filter(is_active=True, is_blocked=False, is_published=True)

        if not user.is_authenticated:
            # Sắp xếp bằng số bài hát trong release hoặc random (Tùy logic)
            return base_qs.order_by('-created_at')[:10]

        # Lấy ID nghệ sĩ từ lịch sử nghe
        listened_artists = StreamHistory.objects.filter(user=user) \
            .values_list('track__artist_id', flat=True
            ).distinct()

        followed_artists = FavouriteArtist.objects.filter(user=user).values_list('artist_id', flat=True)
        
        target_artist_ids = set(list(listened_artists) + list(followed_artists))

        if target_artist_ids:
            return base_qs.filter(artist_id__in=target_artist_ids).distinct().order_by('-release_date')[:10]
        
        return base_qs.order_by('-created_at')[:10]

#  Tải cả release
class SecureReleaseDownloadView(APIView):
    permission_classes = [PremiumUserPermission]
    def get(self, request, short_id):
        release = get_object_or_404(Release, short_id=short_id)
        tracks = release.tracks.all() # Lấy tất cả track trong release
        
        if not tracks.exists():
            raise Http404("No tracks in this release")

        def zip_iterator():
            zip_buffer = io.BytesIO()
            # Khởi tạo Fernet đúng 1 lần cho cả album để tối ưu tốc độ
            fernet = Fernet(os.getenv('MUSIC_ENCRYPTION_KEY').encode())
            
            # 1. BẮT ĐẦU NÉN FILE
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for track in tracks:
                    try:
                        print(f"Đang kéo và giải mã bài: {track.title}...")
                        
                        # Kéo file từ R2
                        r2_res = requests.get(track.file_url.url, timeout=15)
                        
                        # Giải mã cục data
                        decrypted_data = fernet.decrypt(r2_res.content)
                        
                        # Nhét data đã giải mã vào file ZIP với định dạng .mp3
                        zip_file.writestr(f"{track.title}.mp3", decrypted_data)
                        
                    except Exception as e:
                        # Nếu có 1 bài bị lỗi mạng hoặc giải mã, báo log và bỏ qua bài đó, 
                        # tiếp tục nén các bài còn lại.
                        print(f"Lỗi ở bài {track.title}: {e}")
                        continue
            # 2. GỬI FILE ZIP XUỐNG FRONTEND
            zip_buffer.seek(0)
            try:
                while chunk := zip_buffer.read(8192):
                    yield chunk
                # 3. HOÀN TẤT 100% -> CỘNG LƯỢT TẢI
                # Chỉ lưu lịch sử cho những user đã nhận thành công trọn vẹn cục ZIP
                for track in tracks:
                    history_record, created = DownloadHistory.objects.get_or_create(
                        user=request.user, 
                        track=track
                    )

                    # Nếu là tải lần đầu -> Cộng 1 vào bảng điểm tổng
                    if created:
                        Track.objects.filter(pk=track.pk).update(downloads=F('downloads') + 1)
            except Exception as e:
                print(f"Đứt kết nối khi đang gửi file ZIP: {e}")
            finally:
                zip_buffer.close()

        # Xử lý tên file (bọc encode để hỗ trợ tiếng Việt có dấu)
        filename = f"{release.title}.zip"
        filename_encoded = filename.encode('utf-8').decode('latin-1', 'ignore')
        
        response = StreamingHttpResponse(zip_iterator())
        response['Content-Type'] = 'application/zip'
        response['Content-Disposition'] = f'attachment; filename="{filename_encoded}"'
        
        return response
# ==========================================================================================
# -------------------------------- Chức năng cho Artist quản lý các bản phát hành của mình --------------------------------
# ==========================================================================================
# lấy nghệ sĩ để tạo dropdown - chỉ cần lấy id và stage_name là đủ
class GetArtistForFeaturedInfoView(generics.ListAPIView):
    serializer_class = GetArtistForFeaturedInfoSerializer
    permission_classes = [ArtistPermission]
    filter_backends = [filters.SearchFilter]
    search_fields = ['stage_name']

    def get_queryset(self):
        return Artist.objects.all().order_by('-is_claimed', 'stage_name')

# Tạo release mới
class StudioReleaseListCreateView(generics.ListCreateAPIView):
    serializer_class = serializers.ReleaseDetailSerializer
    permission_classes = [ArtistPermission]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title']

    def get_queryset(self):
        qs = Release.objects.filter(artist__user=self.request.user)
        type_filter = self.request.query_params.get('type', 'all')
        status_param = self.request.query_params.get('status', 'published')
        
        if status_param == 'published':
            qs = qs.filter(
                is_published=True, 
                is_active=True, 
                is_blocked=False
            )
        elif status_param == 'pending':
            qs = qs.filter(is_pending=True)
        elif status_param == 'rejected':
            qs = qs.filter(is_pending=False, is_published=False, reject_reason__isnull=False)
        elif status_param == 'draft':
            qs = qs.filter(is_pending=False, is_published=False, reject_reason__isnull=True)
        elif status_param == 'inactive':
            qs = qs.filter(is_active=False)
        elif status_param == 'blocked':
            qs = qs.filter(is_blocked=True)

        if type_filter and type_filter.lower() != 'all':
            qs = qs.filter(release_type__iexact=type_filter)
            
        return qs.order_by('-created_at')

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        artist_profile = request.user.artist_profile
        action = request.data.get('action', 'temp') 
        is_active = False if action == 'temp' else True
        is_pending = True if action == 'pending' else False
        release = None
        try:
            #validate data trước tiên
            image = request.FILES.get('image')
            check_file_security(
                image, 
                5, 
                ['.png', '.jpg', '.jpeg', '.webp']
            )
            
            # 🔥 CHẶN FILE NHẠC TRONG VÒNG LẶP TRƯỚC KHI LÀM BẤT CỨ ĐIỀU GÌ
            for key, value in request.FILES.items():
                if key.endswith('[file]'): # Chỉ check file nhạc (đuôi key là [file])
                    check_file_security(
                        value, 
                        50, 
                        ['.mp3', '.wav', '.flac']
                    )
                elif key.endswith('[lyrics_file]'): # Check riêng cho file lời nhạc
                    check_file_security(
                        value, 
                        2, # File text cực nhẹ, cho 2MB là dư sức qua cầu
                        ['.lrc']
                    )

            # Tạo release trc
            title = request.data.get('title')
            release_type = request.data.get('type')
            release = Release.objects.create(
                artist = artist_profile,
                title = title,
                release_type = release_type,
                image = image,is_active=is_active,
                is_pending=is_pending
            )
            #  Lưu data của các bài hát
            track_data_dic = {}
            for key, value in request.data.items():
                match = re.match(r'releases\[(\d+)\]\[(\w+)\]', key)
                if match:
                    index = match.group(1)
                    field = match.group(2)
                    
                    if index not in track_data_dic:
                        track_data_dic[index] = {}
                    track_data_dic[index][field] = value
            # Tạo từng bài hát và cắt Preview
            for index, track_data in track_data_dic.items():
                track_title = track_data.get('title')
                genre_id = track_data.get('genre')
                lyrics_file_upload = request.FILES.get(f"releases[{index}][lyrics_file]")
                existing_short_id = track_data.get('existing_short_id')

                if existing_short_id:
                    try:
                        track = Track.objects.get(short_id=existing_short_id, artist=artist_profile)
                        track.release = release
                        track.order_index = int(index)

                        if track_title: 
                            track_title = track.title
                        if genre_id:
                            track.genre_id = genre_id
                        if lyrics_file_upload:
                            if track.lyrics_file:
                                track.lyrics_file.delete(save=False)
                            track.lyrics_file = lyrics_file_upload
                        
                        track.save()
                        feat_artists = request.POST.getlist(f'releases[{index}][featured_artists][]')
                        if feat_artists is not None: # Có truyền mảng lên
                            track.featured_artists.clear()
                            for item in feat_artists:
                                if item.isdigit():
                                    try: track.featured_artists.add(Artist.objects.get(id=int(item)))
                                    except Artist.DoesNotExist: pass
                                else:
                                    ghost_artist, _ = Artist.objects.get_or_create(
                                        stage_name__iexact=item,
                                        defaults={'stage_name': item, 'is_claimed': False, 'short_id': generate_short_id()}
                                    )
                                    track.featured_artists.add(ghost_artist)
                                    
                    except Track.DoesNotExist:
                        print(f"⚠️ Không tìm thấy bài hát có sẵn: {existing_short_id}")
                        continue
                else:
                    audio_file = request.FILES.get(f"releases[{index}][file]")
                    if audio_file:
                        audio_file.seek(0)
                        try:
                            audio_segment = AudioSegment.from_file(audio_file)
                            duration_timedelta = datetime.timedelta(seconds=int(len(audio_segment) / 1000))
                            
                            preview_segment = audio_segment[:30 * 1000]
                            buffer = io.BytesIO()
                            preview_segment.export(buffer, format='mp3', bitrate='128k')
                            preview_name = f"preview_{generate_short_id()}.mp3"
                            preview_content = ContentFile(buffer.getvalue(), name=preview_name)
                        except Exception as e:
                            print(f"Lỗi xử lý âm thanh: {e}")
                            duration_timedelta = None
                            preview_content = None

                        audio_file.seek(0) 

                        track = Track.objects.create(
                            release=release,
                            artist=artist_profile,
                            title=track_title,
                            file_url=audio_file,
                            genre_id=genre_id,
                            lyrics_file=lyrics_file_upload,
                            duration=duration_timedelta,
                            preview_file=preview_content,
                            is_active=is_active,
                            order_index=int(index)
                        )

                        # Xử lý Featured Artists cho bài mới
                        feat_artists = request.POST.getlist(f'releases[{index}][featured_artists][]')
                        if feat_artists:
                            for item in feat_artists:
                                if item.isdigit(): 
                                    try: track.featured_artists.add(Artist.objects.get(id=int(item)))
                                    except Artist.DoesNotExist: pass
                                else:
                                    ghost_artist, _ = Artist.objects.get_or_create(
                                        stage_name__iexact=item,
                                        defaults={'stage_name': item, 'is_claimed': False, 'short_id': generate_short_id()}
                                    )
                                    track.featured_artists.add(ghost_artist)
            
            # thông báo admin nếu là submit lên pending
            if is_pending:
                admins = User.objects.filter(is_staff=True, is_active=True)
                for admin in admins:
                    send_system_notification(
                        user=admin,
                        title="New Release Submission",
                        message=f"Artist '{artist_profile.stage_name}' has submit new release: '{release.title}' for review.",
                        use_app=True,
                        metadata={
                            'short_id': release.short_id, 
                            'type': 'release',
                            'status': 'pending'
                        }
                    )
                    send_system_event('NEW_SUBMISSION', {
                        'short_id': release.short_id, 
                        'type': 'release'
                    })
            # Trả về FE kết quả
            serializer = self.get_serializer(release)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            if release and release.image:
                release.image.delete(save=False)
            print(f"Upload Release Failed: {str(e)}") 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class StudioReleaseUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = serializers.ReleaseDetailSerializer
    permission_classes = [ArtistPermission]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    lookup_field = 'short_id'

    def get_queryset(self):
        return Release.objects.filter(artist__user=self.request.user)
    
    def perform_update(self, serializer):
        release_before_update = self.get_object()
        was_pending = release_before_update.is_pending
        was_active = release_before_update.is_active
        
        # 2. LƯU DỮ LIỆU MỚI
        updated_release = serializer.save()

        # ==========================================
        # LOGIC 1: SUBMIT DRAFT LÊN PENDING -> BÁO ADMIN
        # ==========================================
        if not was_pending and updated_release.is_pending:
            admins = User.objects.filter(is_staff=True, is_active=True)
            for admin in admins:
                send_system_notification(
                    user=admin,
                    title="🆕 Draft Submitted for Review",
                    message=f"Artist '{updated_release.artist.stage_name}' has submitted their draft release: '{updated_release.title}' for review.",
                    use_app=True,
                    metadata={
                        'short_id': updated_release.short_id, 
                        'type': 'release',
                        'status': 'pending'
                    }
                )
            
            send_system_event('NEW_SUBMISSION', {
                'short_id': updated_release.short_id, 
                'type': 'release'
            })

        # ==========================================
        # LOGIC 2: ARTIST DEACTIVE NHẠC -> BÁO FAN & GỠ KHỎI LISTENER
        # ==========================================
        if was_active and not updated_release.is_active:
            # Báo cho Fan (Những user đã thả tim Release này)
            # ⚠️ Chú ý: Thay 'favourite_by' bằng đúng cái related_name sếp khai báo trong model FavouriteRelease
            if hasattr(updated_release, 'favourite_by'):
                favorite_records = updated_release.favourite_by.select_related('user').all()
                for record in favorite_records:
                    # Truy cập object user từ bản ghi Favourite
                    user_to_notify = record.user if hasattr(record, 'user') else record
                    
                    send_system_notification(
                        user=user_to_notify,
                        title="Release Deactive",
                        message=f"The release '{updated_release.title}' by {updated_release.artist.stage_name} has been made private by the artist.",
                        use_app=True,
                        metadata={
                            'short_id': updated_release.short_id, 
                            'type': 'release'
                        }
                    )
            
            # Bắn lệnh ngầm để app Listener tự giấu bài này đi (Xài chung lệnh CONTENT_BLOCKED là tiện nhất)
            send_system_event('CONTENT_BLOCKED', {
                'short_id': updated_release.short_id, 
                'type': 'release'
            })

        # ==========================================
        # LOGIC 3: ARTIST ACTIVE LẠI NHẠC -> ĐỒNG BỘ LẠI LISTENER
        # ==========================================
        elif not was_active and updated_release.is_active:
            # Khúc này KHÔNG NÊN báo chuông để tránh spam user lỡ artist cứ bật/tắt liên tục.
            # Chỉ cần bắn WebSocket ngầm ép Listener F5 lại nhạc là đẹp.
            send_system_event('CONTENT_UNBLOCKED', {
                'short_id': updated_release.short_id, 
                'type': 'release'
            })

class StudioReleaseDeleteView(generics.DestroyAPIView):
    permission_classes = [ArtistPermission]
    lookup_field = 'short_id'

    def get_queryset(self):
        return Release.objects.filter(artist__user=self.request.user)

    def perform_destroy(self, instance):
        if instance.is_published or instance.is_pending or instance.is_blocked:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Không thể xoá Release đã xuất bản. Hãy liên hệ Admin hoặc gỡ bài.")
        
        # Tiến hành xoá vĩnh viễn khỏi DB
        instance.delete()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({"message": "Đã xoá bản nháp vĩnh viễn."}, status=status.HTTP_204_NO_CONTENT)

# thay đổi thứ tự nhạc trong 1 release
class StudioReleaseReorderTracksView(APIView):
    permission_classes = [ArtistPermission]

    @transaction.atomic # Khóa DB lại, nếu lỗi là tự rollback bảo toàn data
    def patch(self, request, short_id):
        # 1. Lấy đúng Release của Nghệ sĩ đang đăng nhập
        release = get_object_or_404(Release, short_id=short_id, artist__user=request.user)
        
        # 2. Gác cổng: Không cho đổi nếu đã xuất bản (Published)
        if release.is_published:
            return Response(
                {"detail": "Không thể đổi thứ tự bài hát của Release đã xuất bản."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        track_ids = request.data.get('track_ids', [])
        if not isinstance(track_ids, list):
            return Response(
                {"detail": "Dữ liệu không hợp lệ. Vui lòng gửi một mảng track_ids."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Lấy tất cả bài hát đang nằm trong Release này
        tracks = Track.objects.filter(release=release)
        track_dict = {track.short_id: track for track in tracks}

        # Đảm bảo Frontend gửi lên đủ số lượng bài hát hiện có
        if len(track_ids) != tracks.count():
            return Response(
                {"detail": "Số lượng bài hát gửi lên không khớp với dữ liệu thực tế!"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        tracks_to_update = []
        
        # 4. Gán lại thứ tự cho từng bài
        for index, t_id in enumerate(track_ids):
            if t_id not in track_dict:
                return Response(
                    {"detail": f"Bài hát ID {t_id} không thuộc Release này!"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            track = track_dict[t_id]
            track.order_index = index + 1
            tracks_to_update.append(track)
        
        # 5. Lưu toàn bộ xuống DB bằng 1 câu lệnh duy nhất (Cực nhanh)
        Track.objects.bulk_update(tracks_to_update, ['order_index'])

        return Response({"detail": "Lưu thứ tự bài hát thành công!"}, status=status.HTTP_200_OK)

# ==========================================================================================
# -------------------------------- Chức năng cho Admin --------------------------------
# ==========================================================================================
class AdminReleaseListView(generics.ListAPIView):
    serializer_class = serializers.AdminShortReleaseSerializer
    permission_classes = [AdminPermission]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'artist__stage_name']

    def get_queryset(self):
        # Admin xem tất cả, trừ những bài Artist tự ẩn (is_active=False)
        qs = Release.objects.exclude(is_active=False).select_related('artist')
        
        is_blocked = self.request.query_params.get('is_blocked') == 'true'
        is_published = self.request.query_params.get('is_published') == 'true'
        type_filter = self.request.query_params.get('type', 'all')

        if is_blocked: #block
            qs = qs.filter(is_blocked=True)
        else:
            if is_published: # đang published
                qs = qs.filter(
                    is_published=True, 
                    is_blocked=False,
                    is_pending=False,
                )
            else: # đang chờ duyệt
                qs = qs.filter(
                    is_published=False,
                    is_blocked=False,
                    is_pending=True,
                )
        
        if type_filter and type_filter.lower() != 'all':
            qs = qs.filter(release_type__iexact=type_filter)

        return qs.order_by('-created_at')

class AdminBlockReleaseActionView(views.APIView):
    """API Khóa/Mở khóa Release và gửi thông báo"""
    permission_classes = [AdminPermission]

    def patch(self, request, short_id):
        release = get_object_or_404(Release, short_id=short_id)
        action = request.data.get('action')
        block_reason = request.data.get('block_reason')
        note = request.data.get('block_note', '').strip() or None

        if action == 'block':
            if not block_reason or int(block_reason) not in BlockReason.values:
                return Response({"detail": "Lý do chặn không hợp lệ!"}, status=status.HTTP_400_BAD_REQUEST)
            
            release.is_blocked = True
            if hasattr(release, 'block_reason'):
                release.block_reason = int(block_reason)
                release.block_note = note
            release.save()
            release.tracks.all().update(is_active=False)

            #Nếu chỉ có 1 bài, thì khóa luôn cái Track đó (giữ logic cũ)
            if release.tracks.count() == 1:
                track = release.tracks.first()
                if not track.is_blocked:
                    track.is_blocked = True
                    if hasattr(track, 'block_reason'):
                        track.block_reason = int(block_reason)
                        track.block_note = note
                    track.save()

            # Gửi thông báo In-app cho Nghệ sĩ
            if release.artist and release.artist.user:
                reason_text = dict(BlockReason.choices).get(int(block_reason), "A serious violation of our terms.")
                note_text = f" Ghi chú: {note}." if note else ""
                send_system_notification(
                    user=release.artist.user,
                    title="Release Blocked",
                    message=f"Release '{release.title}' has been blocked. Reason: {reason_text}. {note_text}",
                    use_app=True,
                    metadata={
                        'type': 'release',
                        'status': 'blocked'
                    }
                )
                send_system_event('CONTENT_BLOCKED', {
                    'short_id': short_id, 
                    'type': 'release'
                })
            # gửi cho user yêu thích release này
            favourite_records = release.favourite_by.select_related('user').all()
            for record in favourite_records:
                print({record})
                send_system_notification(
                    user=record.user,
                    title="Release Blocked",
                    message=f"Release: '{release.title}' you like has now been removed from the platform.",
                    use_app=True,
                    metadata={
                        'short_id': release.short_id, 
                        'type': 'release'
                    }
                )
            return Response({"detail": "Đã chặn Release và các Track liên quan thành công!"}, status=status.HTTP_200_OK)

        elif action == 'unblock':
            release.is_blocked = False
            if hasattr(release, 'block_reason'):
                release.block_reason = None
                release.block_note = None
            release.save()
            release.tracks.all().update(is_active=True)

            # 3. Case Single: Nếu chỉ có 1 bài, mở khóa luôn cái Track đó (giữ logic cũ)
            if release.tracks.count() == 1:
                track = release.tracks.first()
                if track.is_blocked:
                    track.is_blocked = False
                    if hasattr(track, 'block_reason'):
                        track.block_reason = None
                        track.block_note = None
                    track.save()

            if release.artist and release.artist.user:
                send_system_notification(
                    user=release.artist.user,
                    title="Release Unblocked",
                    message=f"Release '{release.title}' has been restored.",
                    use_app=True,
                    metadata={
                        'type': 'release',
                        'status' : 'restored'
                    }
                )
                send_system_event('CONTENT_UNBLOCKED', {
                    'short_id': short_id, 
                    'type': 'release'
                })
            # gửi cho user yêu thích release này
            favourite_records = release.favourite_by.select_related('user').all()
            for record in favourite_records:
                print({record})
                send_system_notification(
                    user=record.user,
                    title="Release Unblocked",
                    message=f"Release: '{release.title}' you like has now been restored to the platform.",
                    use_app=True,
                    metadata={
                        'short_id': release.short_id, 
                        'type': 'release'
                    }
                )
            return Response({"detail": "Đã mở khóa Release!"}, status=status.HTTP_200_OK)

        return Response({"detail": "Hành động không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

# xem chi teit61 release  
class AdminDetailReleaseView(generics.RetrieveAPIView):
    queryset = Release.objects.all()
    permission_classes = [AdminPermission]
    serializer_class = serializers.AdminReleaseDetailSerializer
    lookup_field = 'short_id'
    

# xem pending release
class AdminPendingReleaseListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = serializers.AdminPendingReleaseSerializer
    
    def get_queryset(self):
        # Chỉ lấy những Release đang chờ duyệt, sắp xếp mới nhất lên đầu
        return Release.objects.filter(is_pending=True).order_by('-created_at')
    
# admin có quyền duyệt / bỏ 1 release mới 
class AdminReleaseActionView(APIView):
    permission_classes = [permissions.IsAdminUser] # Chỉ Admin mới được sờ vào

    @transaction.atomic
    def patch(self, request, short_id):
        # Lấy Release ra (có thể sếp dùng id hoặc short_id tùy cấu trúc)
        release = get_object_or_404(Release, short_id=short_id)
        action = request.data.get('action')

        # Kiểm tra xem có đang ở trạng thái chờ duyệt không (Giả sử field là status)
        if not release.is_pending:
            return Response({
                "detail": "Release này đã được xử lý hoặc chưa được gửi yêu cầu duyệt!"
            }, status=status.HTTP_400_BAD_REQUEST)

        # 🟢 TRƯỜNG HỢP: APPROVE
        if action == 'approve':
            release.is_pending = False
            release.is_published = True
            release.reject_reason = None
            release.reject_note = None
            release.save()
            
            artist = release.artist
            if artist and artist.user:
                send_system_notification(
                    user=artist.user,
                    title="🎉 Your Release is now LIVE!",
                    message=f"Congratulations! Your release '{release.title}' has been approved and published to the world.",
                    use_app=True,
                    metadata={
                        'type': 'release',
                        'status': 'approved' 
                    }
                )
                favorite_records = artist.favourite_by.select_related('user').all()
                # gửi thông báo cho các user yêu thích nghệ sĩ này
                for record in favorite_records:
                    send_system_notification(
                        user=record.user,
                        title=f"New Release from {artist.stage_name}!",
                        message=f"Listen to the new release '{release.title}' now!",
                        use_app=True,
                        metadata={
                            'short_id': release.short_id, 
                            'type': 'release'
                        }
                    )
            # 🔥 Bắn lệnh ngầm để bên Listener thấy nhạc mới ra lò
            send_system_event('NEW_RELEASE', {
                'short_id': short_id, 
                'type': 'release'
            })
            
            return Response({"detail": "Đã duyệt Release thành công!"}, status=status.HTTP_200_OK)
            
        # 🔴 TRƯỜNG HỢP: REJECT
        elif action == 'reject':
            reason_id = request.data.get('reject_reason')
            note = request.data.get('reject_note', '').strip() or None

            # 🔥 Kiểm tra với class mới
            if not reason_id or int(reason_id) not in ReleaseRejectReason.values:
                return Response({"detail": "Lý do từ chối không hợp lệ!"}, status=status.HTTP_400_BAD_REQUEST)

            release.is_pending = False
            release.is_published = False
            release.reject_reason = int(reason_id) 
            release.reject_note = note             
            release.save()

            artist = release.artist
            if artist and artist.user:
                # 🔥 Lấy text từ class mới để đưa vào thông báo
                reason_text = dict(ReleaseRejectReason.choices).get(int(reason_id), "Vi phạm tiêu chuẩn phát hành")
                note_text = f" Note from Admin: {note}" if note else ""
                
                send_system_notification(
                    user=artist.user,
                    title="⚠️ Action Required: Release Rejected",
                    message=f"Your release '{release.title}' could not be approved. Reason: {reason_text}.{note_text} Please update and submit again.",
                    use_app=True,
                    metadata={
                        'type': 'release',
                        'status': 'rejected' 
                    }
                )

            return Response({"detail": "Đã từ chối Release!"}, status=status.HTTP_200_OK)
