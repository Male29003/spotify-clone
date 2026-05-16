from django.core.management.base import BaseCommand
from django.core.cache import cache
from django.db.models import F
from apps.music.models import Track
from apps.analytics.models import TrackDailyStat
from django.utils import timezone

class Command(BaseCommand):
    help = 'Cộng dồn lượt nghe từ Redis vào Database (cả bảng Track và DailyStat)'

    def handle(self, *args, **options):
        # 1. Lấy tất cả key views từ Redis
        keys = cache.keys('track_views_*')

        if not keys:
            self.stdout.write("Không có lượt nghe nào mới.")
            return
    
        today = timezone.now().date()
        updated_count = 0

        for key in keys:
            try:
                # Lấy track_short_id từ key 'track_views_123'
                track_short_id = int(key.split('_')[-1])
                views_to_add = int(cache.get(key) or 0)

                if views_to_add > 0:
                    # Truy vấn lấy object track để lấy artist_id cho bảng Stat
                    track = Track.objects.filter(short_id=track_short_id).first()
                    if not track:
                        continue

                    # A. Update tổng số lượt nghe trong bảng Track (dùng F để tránh race condition)
                    Track.objects.filter(id=track_short_id).update(listens=F('listens') + views_to_add)

                    # B. Update hoặc Tạo mới lượt nghe trong bảng thống kê theo ngày
                    stat, created = TrackDailyStat.objects.get_or_create(
                        track=track, 
                        date=today, 
                        defaults={'artist': track.artist, 'listens': 0}
                    )
                    # Dùng F expressions để cộng dồn trực tiếp trong SQL
                    TrackDailyStat.objects.filter(id=stat.id).update(listens=F('listens') + views_to_add)

                    # C. Xóa key trong Redis sau khi đã "chốt sổ" vào DB
                    cache.delete(key)
                    updated_count += 1
                    
            except Exception as e:
                self.stderr.write(f"Lỗi xử lý key {key}: {str(e)}")

        self.stdout.write(self.style.SUCCESS(f"Thành công cập nhật {updated_count} bài hát."))