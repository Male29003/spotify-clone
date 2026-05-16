from apps.core.permissions import AdminPermission, ArtistPermission, IsOwnerUserPermission
from rest_framework.permissions import IsAuthenticated
from django.core.files.storage import default_storage
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta

from .models import TrackDailyStat, UserDailyStat, DownloadHistory, StreamHistory
from apps.subscription.models import Payment
from apps.artists.models import Artist
from apps.music.models import Track
from apps.releases.models import Release

# ==========================================================================================
# -------------------------------- Chức năng cho Admin - Trang Admin --------------------------------
# ==========================================================================================
class AdminDashboardStatsView(APIView):
    permission_classes = [AdminPermission]

    def get(self, request):
        now = timezone.now().date()
        thirty_days_ago = now - timedelta(days=30)

        # 1 & 2. User Growth và Revenue giữ nguyên như cũ...
        user_stats = UserDailyStat.objects.filter(date__gte=thirty_days_ago).order_by('date')
        user_chart = [{"date": stat.date.strftime("%d/%m"), "new_users": stat.new_users} for stat in user_stats]

        revenue_stats = Payment.objects.filter(status='success', created_at__date__gte=thirty_days_ago).values('created_at__date').annotate(daily_revenue=Sum('amount')).order_by('created_at__date')
        revenue_chart = [{"date": r['created_at__date'].strftime("%d/%m"), "revenue": r['daily_revenue']} for r in revenue_stats]

        # 3. Top 5 Nghệ sĩ (Cũ)
        top_artists = (
            TrackDailyStat.objects.filter(date__gte=thirty_days_ago)
            .values('artist__stage_name')
            .annotate(total_listens=Sum('listens'))
            .order_by('-total_listens')[:5]
        )

        # 4. Top 5 Bài hát (MỚI)
        top_tracks = (
            TrackDailyStat.objects.filter(date__gte=thirty_days_ago)
            .values('track__title', 'track__artist__stage_name')
            .annotate(total_listens=Sum('listens'))
            .order_by('-total_listens')[:5]
        )

        # 5. Top 5 Releases (MỚI)
        top_releases = (
            TrackDailyStat.objects.filter(date__gte=thirty_days_ago)
            .values('track__release__title', 'track__release__release_type')
            .annotate(total_listens=Sum('listens'))
            .order_by('-total_listens')[:5]
        )

        return Response({
            "user_growth_chart": user_chart,
            "revenue_chart": revenue_chart,
            "top_artists": list(top_artists),
            "top_tracks": list(top_tracks),   
            "top_releases": list(top_releases)
        })


# ==========================================================================================
# -------------------------------- Chức năng cho Artist - Trang Studio của nghệ sĩ --------------------------------
# ==========================================================================================
class ArtistDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, ArtistPermission]

    def get(self, request):
        try:
            artist = request.user.artist_profile
        except:
            return Response({"error": "Bạn không phải là Nghệ sĩ"}, status=403)
            
        now = timezone.now().date()
        thirty_days_ago = now - timedelta(days=30)

        # 1. THẺ TỔNG QUAN (Đã thêm Followers và Tracks)
        total_listens = artist.get_total_listens
        total_downloads = DownloadHistory.objects.filter(track__artist=artist).count()
        monthly_listens = TrackDailyStat.objects.filter(
            artist=artist, 
            date__gte=thirty_days_ago
        ).aggregate(total=Sum('listens'))['total'] or 0
        
        # Đếm số người bấm theo dõi (dựa vào bảng FavouriteArtist)
        total_followers = artist.favourite_by.count()
        
        # Đếm tổng số bài hát (Chỉ đếm các track thuộc Release đã xuất bản và không bị khóa)
        total_tracks = Track.objects.filter(
            artist=artist, 
            release__is_published=True,
            release__is_active=True,
            release__is_blocked=False
        ).count()
        total_releases = Release.objects.filter(
            artist=artist,
            is_published=True,
            is_active=True,
            is_blocked=False
        ).count()

        # 2. Biểu đồ lượt nghe 30 ngày qua (Giữ nguyên)
        daily_listens = (
            TrackDailyStat.objects.filter(artist=artist, date__gte=thirty_days_ago)
            .values('date')
            .annotate(listens=Sum('listens'))
            .order_by('date')
        )
        performance_chart = [
            {
                "date": d['date'].strftime("%d/%m"), 
                "listens": d['listens']
            } for d in daily_listens
        ]

        # 3. Top Bài hát 30 ngày qua (Giữ nguyên)
        top_tracks = (
            TrackDailyStat.objects.filter(artist=artist, date__gte=thirty_days_ago)
            .values('track__id', 'track__title', 'track__release__image')
            .annotate(recent_listens=Sum('listens'))
            .order_by('-recent_listens')[:5]
        )
        top_tracks_data = []
        for t in top_tracks:
            image_path = t['track__release__image']
            image_url = None
            if image_path:
                # default_storage.url() sẽ tự động nhận diện ông đang xài R2 hay Local
                # để bung ra link chuẩn (VD: https://r2.domain.com/... hoặc /media/...)
                raw_url = default_storage.url(image_path)
                # Đảm bảo có domain nếu đang chạy local
                image_url = request.build_absolute_uri(raw_url) if raw_url.startswith('/') else raw_url

            top_tracks_data.append({
                "title": t['track__title'], 
                "image": image_url,
                "listens": t['recent_listens']
            })

        return Response({
            "overview": {
                "total_listens": total_listens,
                "monthly_listens": monthly_listens,
                "total_downloads": total_downloads,
                "total_followers": total_followers,
                "total_tracks": total_tracks,  
                "total_releases": total_releases,  
            },
            "performance_chart": performance_chart,
            "top_tracks": top_tracks_data
        })