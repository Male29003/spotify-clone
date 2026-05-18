from apps.core.permissions import AdminPermission, ArtistPermission, IsOwnerUserPermission
from rest_framework.permissions import IsAuthenticated
from django.core.files.storage import default_storage
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import datetime, timedelta

from .models import TrackDailyStat, UserDailyStat, DownloadHistory, StreamHistory
from apps.subscription.models import Payment
from apps.artists.models import Artist
from apps.music.models import Track
from apps.releases.models import Release

# Helper function xử lý date
def get_date_range(request):
    now = timezone.now().date()
    start_date_str = request.query_params.get('start_date')
    end_date_str = request.query_params.get('end_date')

    if start_date_str and end_date_str:
        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
            return start_date, end_date
        except ValueError:
            pass # Nếu format sai thì fallback về mặc định
            
    return now - timedelta(days=30), now

# ==========================================================================================
# -------------------------------- Chức năng cho Admin - Trang Admin --------------------------------
# ==========================================================================================
class AdminDashboardStatsView(APIView):
    permission_classes = [AdminPermission]

    def get(self, request):
        start_date, end_date = get_date_range(request)

        user_stats = UserDailyStat.objects.filter(date__gte=start_date, date__lte=end_date).order_by('date')
        user_chart = [{"date": stat.date.strftime("%d/%m"), "new_users": stat.new_users} for stat in user_stats]

        revenue_stats = Payment.objects.filter(
            status='success', 
            created_at__date__gte=start_date, 
            created_at__date__lte=end_date
        ).values('created_at__date').annotate(daily_revenue=Sum('amount')).order_by('created_at__date')
        
        revenue_chart = [{"date": r['created_at__date'].strftime("%d/%m"), "revenue": r['daily_revenue']} for r in revenue_stats]

        # Cập nhật filter cho Top Artists, Tracks, Releases
        top_artists = TrackDailyStat.objects.filter(
            date__gte=start_date, 
            date__lte=end_date
        ).values('artist__stage_name')\
            .annotate(total_listens=Sum('listens'))\
            .order_by('-total_listens')[:5]
        top_tracks = TrackDailyStat.objects.filter(
            date__gte=start_date, 
            date__lte=end_date
        ).values('track__title', 'track__artist__stage_name')\
            .annotate(total_listens=Sum('listens'))\
            .order_by('-total_listens')[:5]
        top_releases = TrackDailyStat.objects.filter(
            date__gte=start_date, 
            date__lte=end_date
        ).values('track__release__title', 'track__release__release_type')\
            .annotate(total_listens=Sum('listens'))\
            .order_by('-total_listens')[:5]
    
        country_stats = (
            StreamHistory.objects.filter(
                created_at__date__gte=start_date,
                created_at__date__lte=end_date
            )
            .values('country')
            .annotate(value=Count('id'))
            .order_by('-value')[:5]
        )

        top_countries_data = []
        for c in country_stats:
            country_name = c['country'] if c['country'] else 'Unknown'
            top_countries_data.append({
                "name": country_name,
                "value": c['value']
            })

        return Response({
            "user_growth_chart": user_chart,
            "revenue_chart": revenue_chart,
            "top_artists": list(top_artists),
            "top_tracks": list(top_tracks),   
            "top_releases": list(top_releases),
            "top_countries": top_countries_data
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
            
        start_date, end_date = get_date_range(request)

        # 1. Tổng quan tĩnh (Không đổi theo thời gian, hoặc sếp có thể filter số lượng theo time)
        total_listens = artist.get_total_listens
        total_downloads = DownloadHistory.objects.filter(track__artist=artist).count()
        total_followers = artist.favourite_by.count()
        total_tracks = Track.objects.filter(artist=artist, release__is_published=True, release__is_active=True, release__is_blocked=False).count()
        total_releases = Release.objects.filter(artist=artist, is_published=True, is_active=True, is_blocked=False).count()

        # Biến đổi theo thời gian
        period_listens = TrackDailyStat.objects.filter(
            artist=artist, date__gte=start_date, date__lte=end_date
        ).aggregate(total=Sum('listens'))['total'] or 0

        # 2. Biểu đồ lượt nghe
        daily_listens = TrackDailyStat.objects.filter(
            artist=artist, date__gte=start_date, date__lte=end_date
        ).values('date').annotate(listens=Sum('listens')).order_by('date')
        
        performance_chart = [{"date": d['date'].strftime("%d/%m"), "listens": d['listens']} for d in daily_listens]

        # 3. Top Bài hát theo thời gian
        top_tracks = TrackDailyStat.objects.filter(
            artist=artist, date__gte=start_date, date__lte=end_date
        ).values('track__id', 'track__title', 'track__release__image').annotate(recent_listens=Sum('listens')).order_by('-recent_listens')[:5]
        
        top_tracks_data = []
        for t in top_tracks:
            # (Giữ nguyên logic convert URL ảnh của sếp ở đây)
            image_path = t['track__release__image']
            image_url = request.build_absolute_uri(default_storage.url(image_path)) if image_path else None
            
            top_tracks_data.append({
                "title": t['track__title'], 
                "image": image_url,
                "listens": t['recent_listens']
            })

        # theo country
        country_stats = (
            StreamHistory.objects.filter(
                track__artist=artist,
                created_at__date__gte=start_date,
                created_at__date__lte=end_date
            )
            .values('country')
            .annotate(value=Count('id'))
            .order_by('-value')[:5]
        )

        top_countries_data = []
        for c in country_stats:
            # Nếu country là None (Guest) thì để là Unknown
            country_name = c['country'] if c['country'] else 'Unknown'
            top_countries_data.append({
                "name": country_name,
                "value": c['value']
            })

        return Response({
            "overview": {
                "total_listens": total_listens,
                "period_listens": period_listens,
                "total_downloads": total_downloads,
                "total_followers": total_followers,
                "total_tracks": total_tracks,  
                "total_releases": total_releases,  
            },
            "performance_chart": performance_chart,
            "top_tracks": top_tracks_data,
            "top_countries": top_countries_data
        })