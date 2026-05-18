from django.db import models
from apps.core.models import BaseModel
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class StreamHistory(models.Model):
    # Khóa ngoại trỏ về bài hát (Track)
    track = models.ForeignKey(
        'music.Track', 
        on_delete=models.CASCADE, 
        related_name='stream_logs'
    )
    # Khóa ngoại trỏ về User (có thể null nếu cho phép nghe không cần đăng nhập)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='listen_history'
    )
    
    # Optional: Lưu thêm quốc gia để vẽ bản đồ người nghe
    country = models.CharField(max_length=50, blank=True, null=True)

    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        verbose_name = "Stream History"
        verbose_name_plural = "Stream Histories"
        # CỰC KỲ QUAN TRỌNG: Đánh index để Query theo ngày tháng không bị chậm
        indexes = [
            models.Index(fields=['created_at']), 
            models.Index(fields=['track', 'created_at']),
        ]

    def __str__(self):
        user_display = self.user.username if self.user else "Anonymous"
        return f"{user_display} listened to {self.track.title} at {self.created_at}"
    
class TrackDailyStat(models.Model):
    track = models.ForeignKey(
        'music.Track',
        on_delete=models.CASCADE,
        related_name='daily_stats'
    )
    artist = models.ForeignKey(
        'artists.Artist', 
        on_delete=models.CASCADE, 
        related_name='daily_stats'
    )
    date = models.DateField() # Ngày thống kê (VD: 2026-03-15)
    listens = models.IntegerField(default=0) # Lượt nghe tăng thêm trong ngày đó
    
    class Meta:
        unique_together = ('track', 'date') # Một bài hát mỗi ngày chỉ có 1 record
        ordering = ['-date']

class UserDailyStat(models.Model):
    # Dành cho Admin Dashboard: Theo dõi số user đăng ký mới mỗi ngày
    date = models.DateField(unique=True)
    new_users = models.IntegerField(default=0)


class DownloadHistory(models.Model):
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True
    )
    track = models.ForeignKey(
        'music.Track', 
        on_delete=models.CASCADE, 
        related_name='download_logs'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        unique_together = ('user', 'track')