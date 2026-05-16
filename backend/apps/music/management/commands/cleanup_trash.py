from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from releases.models import Release

class Command(BaseCommand):
    help = "Dọn dẹp các Release và Track rác (is_active=False) quá 48h"

    def handle(self, *args, **kwargs):
        # Tính thời điểm 48 tiếng trước
        expiry_limit = timezone.now() - timedelta(hours=48)
        
        # Tìm các Release đang False và tạo từ 2 ngày trước
        trash_releases = Release.objects.filter(is_active=False, created_at__lt=expiry_limit)
        
        count = trash_releases.count()
        if count > 0:
            # Chỉ cần xóa Release, nhờ models.CASCADE nó sẽ xóa luôn các Track con.
            # Và nhờ Signal (ông nhớ viết post_delete signal chưa?), nó sẽ lên R2 xóa file vật lý!
            trash_releases.delete()
            self.stdout.write(self.style.SUCCESS(f"✅ Đã dọn dẹp thành công {count} bản nháp quá hạn!"))
        else:
            self.stdout.write(self.style.SUCCESS("Hệ thống sạch sẽ, không có rác."))