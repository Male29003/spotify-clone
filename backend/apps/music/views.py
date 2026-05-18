import io
import datetime,traceback
import os
import requests
import math
from django.conf import settings
from rest_framework import generics, serializers, status, permissions, filters, views
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.permissions import AdminPermission, ArtistPermission, PremiumUserPermission
from django.core.files.base import ContentFile
from django.shortcuts import get_object_or_404
from mutagen import File as MutagenFile
from rest_framework.response import Response
from django.db.models import F, Q, Count
from django.utils import timezone
from datetime import timedelta
from collections import Counter
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.core.cache import cache
from pydub import AudioSegment
from django.http import Http404
from django.http import StreamingHttpResponse
from cryptography.fernet import Fernet
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.renderers import BaseRenderer
from django_redis import get_redis_connection
from ..core.notification import send_system_notification, send_system_event
from apps.core.choices import BlockReason
from apps.core.utils import generate_short_id

from . import serializers
from apps.analytics.models import StreamHistory, DownloadHistory, TrackDailyStat
from .models import Track
from apps.releases.models import Release
from rest_framework.views import APIView
from apps.artists.models import FavouriteArtist

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
# ==========================================================================================
# -------------------------------- Chức năng cho Listener --------------------------------
# ==========================================================================================
# Kết nối này sẽ tự động dùng cấu hình từ settings.py của ông
redis_conn = get_redis_connection("default")
CHUNK_SIZE = 256 * 1024
# nghe nhạcclass MusicStreamView(APIView):
class PlainTextRenderer(BaseRenderer):
    media_type = 'audio/mpeg'
    format = 'mp3'
    def render(self, data, accepted_media_type=None, encodings=None):
        return data
class MusicStreamView(APIView):
    renderer_classes = [PlainTextRenderer]
    permission_classes = [permissions.AllowAny]

    def get(self, request, short_id):
        track = get_object_or_404(Track, short_id=short_id)
        is_premium_user = False

        if request.user.is_authenticated:
            is_premium_user = PremiumUserPermission().has_permission(request, self)

        # 1. XỬ LÝ PREVIEW (Dành cho user thường hoặc bài Premium)
        if track.is_premium_only and not is_premium_user:
            try:
                preview_res = requests.get(track.preview_file.url, stream=True, timeout=10)
                response = StreamingHttpResponse(
                    preview_res.iter_content(chunk_size=CHUNK_SIZE), 
                    content_type="audio/mpeg"
                )
                response['Accept-Ranges'] = 'bytes'
                return response
            except Exception as e:
                print(f"Lỗi stream file preview: {e}")
                return Response({"error": "Lỗi kết nối âm thanh"}, status=503)

        # 2. XỬ LÝ FULL TRACK (Lưu nguyên file tệp bytes đã giải mã vào 1 Key Redis)
        cache_key = f"track_decrypted_full:{track.id}"
        
        def audio_stream_generator():
            # Thử lấy nguyên file bytes đã giải mã từ Redis
            decrypted_data = cache.get(cache_key)
            
            # --- CƠ CHẾ CACHE MISS: RAM chưa có bài này ---
            if not decrypted_data:
                print(f"🔄 [Cache Miss] Đang kéo full bài {track.short_id} từ R2 về giải mã...")
                try:
                    r2_res = requests.get(track.file_url.url, timeout=15)
                    raw_data = r2_res.content
                    
                    # Tiến hành giải mã toàn bộ file dữ liệu
                    try:
                        fernet = Fernet(os.getenv('MUSIC_ENCRYPTION_KEY').encode())
                        decrypted_data = fernet.decrypt(raw_data)
                        print("✅ Giải mã nguyên khối thành công!")
                    except Exception:
                        print("⚠️ Giải mã thất bại. File gốc chưa mã hóa, dùng dữ liệu thô!")
                        decrypted_data = raw_data
                    
                    # CHỐNG SẬP KHI REDIS ĐẦY (Graceful Fallback)
                    try:
                        # Giảm timeout xuống còn 2 tiếng (7200s) thay vì 24 tiếng để xoay vòng RAM nhanh hơn
                        cache.set(cache_key, decrypted_data, timeout=7200)
                        print(f"💾 Đã nạp thành công bài {track.id} vào Redis.")
                    except Exception as redis_err:
                        # Nếu Upstash bị đầy RAM (OOM - Out of Memory) và từ chối ghi nhận Key
                        # Khối try-except này sẽ hứng lỗi, log lại, không thèm cache nữa 
                        # nhưng VẪN GIỮ lại biến decrypted_data để generator phía dưới chạy tiếp
                        print(f"❌ Redis đầy bộ nhớ hoặc lỗi cấu hình, bỏ qua bước cache: {redis_err}")
                        
                except Exception as e:
                    print(f"❌ Lỗi nghiêm trọng khi kết nối R2: {e}")
                    traceback.print_exc()
                    return

            # --- CƠ CHẾ STREAMING: Cắt nhỏ file trên RAM để bắn về Client theo từng đợt ---
            total_bytes = len(decrypted_data)
            for start in range(0, total_bytes, CHUNK_SIZE):
                end = min(start + CHUNK_SIZE, total_bytes)
                # Dùng tính năng slicing của Python để chia nhỏ dữ liệu siêu nhanh trên RAM
                yield decrypted_data[start:end]

        response = StreamingHttpResponse(audio_stream_generator(), content_type="audio/mpeg")
        response['Accept-Ranges'] = 'bytes'
        return response

# Tim2 kiem61
class TrackListView(generics.ListAPIView):
    serializer_class = serializers.ListenerTrackSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['genre', 'is_premium_only']
    search_fields = ['title', 'artist__stage_name']
    ordering_fields = ['listens', '-created_at']

    def get_queryset(self):
        return Track.objects.filter(
            is_active=True,
            is_blocked=False,
            artist__is_active=True, # Nghệ sĩ đang hoạt động
            artist__is_blocked=False, # Nghệ sĩ không bị block
            release__is_published=True,
            release__is_active=True, # Release không bị xóa
        ).select_related('artist', 'genre', 'release')

#Lấy chi tiết track
class TrackDetailView(generics.RetrieveAPIView):
    serializer_class = serializers.ListenerDetailTrackSerializer
    permission_classes = [permissions.AllowAny]
    ordering_fields = ['order_index']
    lookup_field = 'short_id'

    def get_queryset(self):
        return Track.objects.filter(
            is_active=True, 
            is_blocked=False,
            artist__is_active=True, # Nghệ sĩ đang hoạt động
            artist__is_blocked=False, # Nghệ sĩ không bị block
            release__is_published=True, # Release không bị xóa
            release__is_blocked=False
        )

# 3. API: Related Tracks (Gợi ý Bài hát)
class RelatedTrackListView(generics.ListAPIView):
    serializer_class = serializers.ShortTrackSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        short_id = self.kwargs.get('short_id')
        current_track = generics.get_object_or_404(Track, short_id=short_id)
        
        # Lấy bài hát cùng nghệ sĩ nhưng khác release (album)
        queryset = Track.objects.filter(
            artist=current_track.artist,
            is_active=True,
            is_blocked=False,
            release__is_published=True
        ).exclude(id=current_track.id)\
         .select_related('artist', 'release')\
         .order_by('-listens')[:10] 

        qs_list = list(queryset)
        
        if len(qs_list) < 10:
            needed = 10 - len(qs_list)
            exclude_ids = [current_track.id] + [t.id for t in qs_list]
            
            # Xóa order_by('?') -> thay bằng bài hát mới/hot nhất
            fallback = Track.objects.filter(
                is_active=True, is_blocked=False, release__is_published=True
            ).exclude(id__in=exclude_ids)\
             .select_related('artist', 'release')\
             .order_by('-listens')[:needed]
             
            qs_list.extend(list(fallback))

        return qs_list

# Lấy tredning track
class TrendingTrackListView(generics.ListAPIView):
    serializer_class = serializers.ListenerTrackSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class=None

    def get_queryset(self):
        return Track.objects.filter(
            is_active=True, 
            is_blocked=False,
            artist__is_active=True,
            artist__is_blocked=False,
            release__is_published=True,
            release__is_blocked=False
        ).select_related('artist', 'genre', 'release')\
         .order_by('-listens')[:20]

# Like và bỏ like track
class LikedTrackToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, short_id):
        track = get_object_or_404(Track, short_id=short_id)
        user = request.user

        if track.liked_by.filter(id=user.id).exists():
            track.liked_by.remove(user)
            return Response({"detail": "Remove from favourite songs."}, status=status.HTTP_204_NO_CONTENT)
        else:
            track.liked_by.add(user)
            return Response({"detail": "Added to favourite songs."}, status=status.HTTP_201_CREATED)

# Lấy danh sách bài hát đã thích của user
class MyLikedSongsListView(generics.ListAPIView):
    serializer_class = serializers.ListenerTrackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.liked_tracks.filter(
            release__is_published=True,
            release__is_blocked=False,
            release__is_active=True,
            artist__is_blocked=False,
            artist__is_active=True
        ).select_related('artist', 'release')
    
# Thêm lượt nghe
class RecordListeningView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        short_id = request.data.get('short_id')
        if not short_id:
            return Response({"detail": "Vui lòng cung cấp short_id"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            track = Track.objects.get(short_id=short_id, is_active=True)
            user = request.user if request.user.is_authenticated else None
            today = timezone.now().date()

            # Check Spam (Chỉ áp dụng cho User đã đăng nhập)
            if user:
                if user.is_staff or user.is_superuser or user.type != 'user':
                    return Response({"detail": "View từ Admin không được tính."}, status=status.HTTP_200_OK)
                
                # Check giới hạn 5 view/ngày
                daily_user_views = StreamHistory.objects.filter(
                    user=user, 
                    track=track, 
                    created_at__date=today
                ).count()
                print(f"{daily_user_views} of {user.username} for {track.title}")
                if daily_user_views >= 5:
                    return Response({"detail": "User đã đạt giới hạn 5 lượt/ngày."}, status=status.HTTP_200_OK)

                # Check Spam (1 phút)
                one_minute_ago = timezone.now() - timedelta(minutes=1)
                is_spam = StreamHistory.objects.filter(
                    user=user, 
                    track=track, 
                    created_at__gte=one_minute_ago
                ).exists()
                if is_spam:
                    return Response({"detail": "Đang trong thời gian chờ (User)."}, status=status.HTTP_200_OK)
            # --- KIỂM TRA CHO GUEST (CHƯA ĐĂNG NHẬP) DÙNG REDIS CACHE ---
            else:
                ip_address = get_client_ip(request)
                
                # Check Spam (1 phút)
                spam_cache_key = f"spam_ip_{ip_address}_track_{track.id}"
                if cache.get(spam_cache_key):
                    return Response({"detail": "Đang trong thời gian chờ (Guest)."}, status=status.HTTP_200_OK)
                
                # Check giới hạn 5 view/ngày theo IP
                daily_cache_key = f"daily_ip_{ip_address}_track_{track.id}_{today}"
                guest_views = cache.get(daily_cache_key, 0)
                
                # Cho phép IP nghe tối đa 5 lượt (có thể cho lên 10 vì mạng Cafe/Trường học xài chung IP)
                if guest_views >= 5:
                    return Response({"detail": "IP đã đạt giới hạn lượt nghe hôm nay."}, status=status.HTTP_200_OK)
                
                # Đánh dấu đã nghe và set thời gian khóa Spam 60 giây
                cache.set(spam_cache_key, True, timeout=60)
                # Tăng view của IP lên 1, giữ hạn sử dụng là 24 tiếng (86400 giây)
                cache.set(daily_cache_key, guest_views + 1, timeout=86400)
            
            # Lưu vào lịch sử (Kèm theo Country để vẽ bản đồ)
            user_country = user.country if user else None
            
            # 1. Lưu vào bảng History (Lịch sử)
            StreamHistory.objects.create(
                user=user, 
                track=track,
                country=user_country
            )
            
            # 2. Cập nhật Thống kê ngày
            daily_stat, created = TrackDailyStat.objects.get_or_create(
                track=track, date=today, defaults={'artist': track.artist, 'listens': 1}
            )
            if not created:
                daily_stat.listens = F('listens') + 1
                daily_stat.save(update_fields=['listens'])

            # 3. Tăng tổng view của Track
            track.listens = F('listens') + 1
            track.save(update_fields=['listens'])

            # 4. Nạp Cache View Tổng (Để Artist load số nhanh hơn nếu sếp có xài)
            cache_key = f'track_views_{track.id}'
            try:
                if cache.get(cache_key) is None:
                    cache.set(cache_key, 1, timeout=None)
                else:
                    cache.incr(cache_key)
            except Exception:
                cache.set(cache_key, 1, timeout=None)
                
            return Response({"detail": "Đã ghi nhận lượt nghe thành công."}, status=status.HTTP_200_OK)
            
        except Track.DoesNotExist:
            return Response({"detail": "Bài hát không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        
class RecommendedTrackListView(generics.ListAPIView):
    """Thuật toán Gợi ý Nhạc cá nhân hóa đa chiều"""
    serializer_class = serializers.ListenerTrackSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        base_qs = Track.objects.filter(
            is_active=True, 
            is_blocked=False, 
            release__is_active=True
        ).select_related('artist', 'genre', 'release')

        # NẾU LÀ GUEST (Chưa đăng nhập) -> Trả về Top 20 bài HOT nhất
        if not user.is_authenticated:
            return base_qs.order_by('-listens')[:20]

        # ---------------------------------------------------------
        # TỐI ƯU 1: Đếm Top Thể loại siêu tốc bằng Python Counter
        # Chỉ phân tích trên 200 bài nghe gần nhất, bảo vệ Database
        # ---------------------------------------------------------
        recent_genres = StreamHistory.objects.filter(user=user, track__genre__isnull=False) \
            .order_by('-created_at') \
            .values_list('track__genre_id', flat=True)[:200]
        
        # Đếm tần suất xuất hiện và lấy 3 ID thể loại nhiều nhất
        top_genres = [genre_id for genre_id, count in Counter(recent_genres).most_common(3)]

        # Lấy ID các nghệ sĩ user đang follow
        followed_artists = FavouriteArtist.objects.filter(user=user).values_list('artist_id', flat=True)
        # Lấy ID các nghệ sĩ từ những bài hát user đã bấm Like
        liked_track_artists = user.liked_tracks.values_list('artist_id', flat=True)

        target_artist_ids = set(list(followed_artists) + list(liked_track_artists))

        query = Q()
        if top_genres:
            query |= Q(genre_id__in=top_genres)
        if target_artist_ids:
            query |= Q(artist_id__in=target_artist_ids)

        if not query:
            return base_qs.order_by('-listens')[:20]

        # ---------------------------------------------------------
        # TỐI ƯU 2: Gom Query để không hit DB lắt nhắt
        # ---------------------------------------------------------
        recent_listened_tracks = list(StreamHistory.objects.filter(user=user) \
            .order_by('-created_at') \
            .values_list('track_id', flat=True)[:50])

        recommended_tracks = base_qs.filter(query) \
            .exclude(id__in=recent_listened_tracks) \
            .distinct() \
            .order_by('-listens')[:20]

        # Chuyển thành list 1 lần duy nhất để DB không phải count() rồi lại quét data
        rec_list = list(recommended_tracks)

        if len(rec_list) < 5:
            # Lọc bỏ luôn cả bài đã gợi ý và bài vừa nghe
            exclude_ids = [t.id for t in rec_list] + recent_listened_tracks
            hot_tracks = base_qs.exclude(id__in=exclude_ids).order_by('-listens')[:20]
            
            return (rec_list + list(hot_tracks))[:20]

        return rec_list

# Tải nhạc
class SecureTrackDownloadView(APIView):
    permission_classes = [PremiumUserPermission]

    def get(self, request, short_id):
        try:
            track = Track.objects.get(short_id=short_id)
        except Track.DoesNotExist:
            raise Http404

        # KÉO FILE MÃ HÓA BẰNG URL
        try:
            print(f"Đang tải file gốc của bài {track.short_id} để chuẩn bị download...")
            r2_res = requests.get(track.file_url.url, timeout=15)
            encrypted_data = r2_res.content
        except Exception as e:
            print("Lỗi lấy file:", e)
            raise Http404("Không thể tải file từ máy chủ lưu trữ")

        # gIẢI MÃ
        try:
            fernet = Fernet(os.getenv('MUSIC_ENCRYPTION_KEY').encode())
            decrypted_data = fernet.decrypt(encrypted_data)
        except Exception as e:
            print("Lỗi giải mã file:", e)
            return Response({"error": "Cannot decrypt file"}, status=500)

        # YIELD DATA & ĐẾM LƯỢT TẢI
        def file_iterator(data, chunk_size=8192):
            buffer = io.BytesIO(data)
            try:
                while chunk := buffer.read(chunk_size):
                    yield chunk
                
                # Hoàn tất 100% mới ghi nhận tải
                history_record, created = DownloadHistory.objects.get_or_create(
                    user=request.user, 
                    track=track
                )
                if created:
                    Track.objects.filter(pk=track.pk).update(downloads=F('downloads') + 1)
            except Exception as e:
                print(f"Bị ngắt kết nối khi đang tải: {e}")
            finally:
                buffer.close()

        # 4. GỬI FILE XUỐNG BROWSER
        filename = f"{track.title}.mp3" 
        response = StreamingHttpResponse(file_iterator(decrypted_data))
        response['Content-Type'] = 'audio/mpeg'
        
        filename_encoded = filename.encode('utf-8').decode('latin-1', 'ignore')
        response['Content-Disposition'] = f'attachment; filename="{filename_encoded}"'
        
        return response


# ==========================================================================================
# -------------------------------- Chức năng cho Artist quản lý các bản phát hành của mình --------------------------------
# ==========================================================================================
class StudioTrackCreateView(generics.ListCreateAPIView):
    serializer_class = serializers.TrackSerializer
    permission_classes = [ArtistPermission] 

    def get_queryset(self):
        return Track.objects.filter(artist__user=self.request.user).order_by('-created_at')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return serializers.CreateNewTrackSerializer
        return serializers.TrackSerializer

    def perform_create(self, serializer):
        release_short_id = self.request.data.get('release') 
        release = get_object_or_404(Release, short_id=release_short_id, artist__user=self.request.user)
        
        # Chỉ cho phép thêm nhạc nếu Release chưa được duyệt (Draft/Pending)
        if release.is_published:
            raise serializers.ValidationError({"detail": "Không thể thêm nhạc vào Album đã xuất bản."})
            
        audio_file = self.request.FILES.get('file_url')
        
        duration = None
        preview_file_data = None 
        
        if audio_file:
            try:
                # Dùng io.BytesIO để đọc file trên RAM, tránh lỗi file path của Cloud
                file_data = audio_file.read()
                audio_buffer = io.BytesIO(file_data)
                
                # 1. Trích xuất Duration
                audio_segment = AudioSegment.from_file(audio_buffer)
                duration = datetime.timedelta(seconds=int(len(audio_segment) / 1000))
                
                # 2. Tạo Preview File (30s đầu)
                preview_segment = audio_segment[:30 * 1000]
                preview_buffer = io.BytesIO()
                preview_segment.export(preview_buffer, format='mp3', bitrate='128k')
                
                # Bọc nó lại thành ContentFile (Đặt tên dựa theo file gốc)
                file_name = f"preview_{audio_file.name}"
                preview_file_data = ContentFile(preview_buffer.getvalue(), name=file_name)
                
                # Trả con trỏ file về 0 để model còn lấy đi mã hóa
                audio_file.seek(0)
            except Exception as e:
                print(f"Lỗi xử lý file âm thanh: {e}")
        
        lyrics_text = self.request.data.get('lyrics', '')
        lyrics_file_obj = None
        if lyrics_text and lyrics_text.strip():
            # Tạo file .lrc trên RAM
            lyrics_name = f"lyrics_{generate_short_id()}.lrc"
            lyrics_file_obj = ContentFile(lyrics_text.encode('utf-8'), name=lyrics_name)

        # Lưu Track với đầy đủ thông tin (Model sẽ lo việc mã hóa file gốc, còn Django sẽ tự up file Preview)
        serializer.save(
            artist=release.artist, 
            release=release,
            duration=duration,
            preview_file=preview_file_data,
            lyrics_file=lyrics_file_obj
        )

class StudioTrackUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = serializers.TrackSerializer
    permission_classes = [ArtistPermission] 
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    lookup_field = 'short_id'

    def get_queryset(self):
        return Track.objects.filter(artist__user=self.request.user)
    
    def perform_update(self, serializer):
        track = self.get_object()
        
        if track.release and track.release.is_published:
            raise serializers.ValidationError({"detail": "Không thể sửa nhạc của Release đã xuất bản."})
            
        serializer.save()
    
    def perform_destroy(self, instance):
        if instance.release and instance.release.is_published:
            raise serializers.ValidationError({"detail": "Không thể xóa nhạc của Release đã xuất bản."})
            
        instance.delete()

class StudioToggleActiveTrackView(generics.RetrieveUpdateAPIView):
    serializer_class = serializers.ShortTrackSerializer
    permission_classes = [ArtistPermission]
    lookup_field = 'short_id'

# lấy danh sách unassigned
class StudioGetUnassignedTracksView(generics.ListAPIView):
    serializer_class = serializers.TrackSerializer
    permission_classes = [ArtistPermission]
    lookup_field = 'short_id'

    def get_queryset(self):
        return Track.objects.filter(
            artist__user = self.request.user,
            is_active=True,
            release__isnull=True
        ).order_by('-created_at')

# ==========================================================================================
# -------------------------------- Chức năng cho Admin --------------------------------
# ==========================================================================================
class AdminTrackListView(generics.ListAPIView):
    serializer_class = serializers.AdminTrackSerializer
    permission_classes = [AdminPermission]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'artist__stage_name']

    def get_queryset(self):
        # Lọc cốt lõi: Chỉ lấy các bài hát nằm trong Release đã Publish HOẶC đã bị Block.
        # (Tự động loại bỏ hoàn toàn các bài thuộc Draft hoặc Pending)
        qs = Track.objects.filter(
            Q(release__is_published=True, release__is_blocked=False) | Q(release__is_blocked=True)
        ).select_related('artist', 'release')
        # Lọc theo trạng thái khóa/mở khóa từ Frontend truyền xuống
        status_filter = self.request.query_params.get('status', 'all')
        if status_filter == 'blocked':
            qs = qs.filter(is_blocked=True)
        elif status_filter == 'active':
            qs = qs.filter(is_blocked=False)

        return qs.order_by('-created_at')

class AdminTrackDetailView(generics.RetrieveAPIView):
    """API xem chi tiết Track cho Admin"""
    permission_classes = [AdminPermission]
    serializer_class = serializers.AdminTrackSerializer
    lookup_field = 'short_id'

    def get_queryset(self):
        # Vẫn giữ logic query của sếp
        return Track.objects.filter(
            Q(release__is_published=True, release__is_blocked=False) | Q(release__is_blocked=True)
        )

# 2. VIEW XỬ LÝ KHÓA 1 bài hát (PATCH)
class AdminBlockTrackActionView(views.APIView):
    """API Khóa/Mở khóa Track và gửi thông báo"""
    permission_classes = [AdminPermission]

    def patch(self, request, short_id):
        # Bỏ qua QuerySet filter ở trên vì Admin có quyền khóa MỌI track nếu có ID
        track = get_object_or_404(Track, short_id=short_id)
        action = request.data.get('action')
        block_reason = request.data.get('block_reason')
        block_note = request.data.get('block_note', '').strip() or None
        release = track.release

        if action == 'block':
            if not block_reason or int(block_reason) not in BlockReason.values:
                return Response({"detail": "Lý do chặn không hợp lệ!"}, status=status.HTTP_400_BAD_REQUEST)
            
            track.is_blocked = True
            if hasattr(track, 'block_reason'):
                track.block_reason = int(block_reason)
                track.block_note = block_note
            track.save()

            if track.artist and track.artist.user:
                reason_text = dict(BlockReason.choices).get(int(block_reason), "A serious violation of our terms.")
                send_system_notification(
                    user=track.artist.user,
                    title="Song Blocked",
                    message=f"The song '{track.title}' has been blocked. Reason: {reason_text}. {block_note}",
                    use_app=True,
                    metadata={
                        'type': 'release',
                        'short_id': release.short_id, 
                    }
                )
                send_system_event('CONTENT_BLOCKED', {
                    'short_id': short_id, 
                    'type': 'track'
                })
            
            if hasattr(track, 'release') and track.release:
                # Đếm xem trong Release này còn bài hát nào chưa bị block không?
                active_tracks_count = release.tracks.filter(is_blocked=False).count()

                if active_tracks_count == 0 and not release.is_blocked:
                    # Nếu không còn bài nào ko bị block -> KHÓA LUÔN RELEASE
                    release.is_blocked = True
                    release.block_reason = int(block_reason)
                    release.block_note = "Auto-blocked because all containing tracks are blocked."
                    release.save()

                    # Thông báo cho user đã thả tim Release này
                    if hasattr(release, 'favourite_by'):
                        favorite_records = release.favourite_by.select_related('user').all()
                        for record in favorite_records:
                            send_system_notification(
                                user=record.user,
                                title="Release Blocked",
                                message=f"The release '{release.title}' you liked is no longer available.",
                                use_app=True,
                                metadata= {
                                    'short_id': release.short_id,
                                    'type': 'release'
                                }
                            )
                    # Bắn WebSocket ép FE gỡ Release khỏi màn hình
                    send_system_event('CONTENT_BLOCKED', {
                        'short_id': release.short_id,
                        'type': 'release'
                    })
            return Response({"detail": "Đã chặn bài hát thành công!"}, status=status.HTTP_200_OK)

        elif action == 'unblock':
            track.is_blocked = False
            if hasattr(track, 'block_reason'):
                track.block_reason = None
                track.block_note = None
            track.save()

            if track.artist and track.artist.user:
                send_system_notification(
                    user=track.artist.user,
                    title="Song Unblocked",
                    message=f"The song '{track.title}' has been restored.",
                    use_app=True,
                    metadata= {
                        'short_id': release.short_id,
                        'type': 'release'
                    }
                )
                send_system_event('CONTENT_UNBLOCKED', {
                    'short_id': short_id, 
                    'type': 'track'
                })

            if hasattr(track, 'release') and track.release:
                release = track.release
                
                # Nếu Release đang bị khóa, giờ có 1 bài gỡ block lại -> Mở khóa Release luôn
                if release.is_blocked:
                    release.is_blocked = False
                    release.block_reason = None
                    release.block_note = None
                    release.save()

                    # Thông báo cho user đã thả tim Release này
                    if hasattr(release, 'favourite_by'):
                        favorite_records = release.favourite_by.select_related('user').all()
                        for record in favorite_records:
                            send_system_notification(
                                user=record.user,
                                title="Release Unlocked",
                                message=f"The release '{release.title}' you liked is no longer available.",
                                use_app=True,
                                metadata= {
                                    'short_id': release.short_id,
                                    'type': 'release'
                                }
                            )

                    # Bắn WebSocket ép FE hiện Release lại lên màn hình
                    send_system_event('CONTENT_UNBLOCKED', {
                        'short_id': release.short_id,
                        'type': 'release'
                    })
            return Response({"detail": "Đã mở khóa bài hát!"}, status=status.HTTP_200_OK)

        return Response({"detail": "Hành động không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)