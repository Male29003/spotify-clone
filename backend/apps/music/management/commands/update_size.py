import requests
from django.core.management.base import BaseCommand
from apps.music.models import Track  # Nhớ đổi 'music' thành tên app thực tế của ông

class Command(BaseCommand):
    help = 'Quét R2 và cập nhật file_size cho các bài hát bị thiếu'

    def handle(self, *args, **kwargs):
        # Chỉ quét những bài chưa có file_size để đỡ tốn thời gian
        tracks = Track.objects.filter(file_size__isnull=True)
        total = tracks.count()
        
        if total == 0:
            self.stdout.write(self.style.SUCCESS("Tuyệt vời! Tất cả các bài hát đều đã có file_size."))
            return

        self.stdout.write(f"Bắt đầu quét và cập nhật cho {total} bài hát...")

        for index, track in enumerate(tracks, start=1):
            if not track.file_url:
                continue

            size = 0
            try:
                # CÁCH 1: Lấy trực tiếp từ thư viện Storage của Django (nhanh nhất, không tốn băng thông)
                size = track.file_url.size 
            except Exception:
                # CÁCH 2: Nếu Storage báo lỗi, dùng requests.head gọi lên R2
                # Dùng HEAD thay vì GET để R2 chỉ trả về thông tin Header (Size) chứ không tải file về
                try:
                    res = requests.head(track.file_url.url, allow_redirects=True, timeout=5)
                    size = int(res.headers.get('Content-Length', 0))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"[{index}/{total}] ❌ Lỗi gọi R2 bài {track.short_id}: {e}"))
                    continue
            
            # Nếu lấy được size thì lưu vào DB
            if size > 0:
                track.file_size = size
                # Dùng update_fields để tăng tốc độ ghi Database
                track.save(update_fields=['file_size'])
                self.stdout.write(self.style.SUCCESS(f"[{index}/{total}] ✅ Xong {track.short_id}: {size} bytes"))
            else:
                self.stdout.write(self.style.WARNING(f"[{index}/{total}] ⚠️ Không tìm thấy size cho {track.short_id}"))

        self.stdout.write(self.style.SUCCESS("\nĐã quét xong toàn bộ Database!"))