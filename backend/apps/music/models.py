from django.db import models
from ..core.models import BaseModel, BlockableMixin
from autoslug import AutoSlugField
from ..core.services import get_path_upload_audio_track, validate_audio_size, validate_audio_extension, get_path_upload_lyrics_track, get_path_upload_preview_track
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from ..core.utils import generate_short_id
import io
import os
from django.core.files.base import ContentFile
from cryptography.fernet import Fernet
from django.conf import settings
User = get_user_model()

class Track(BaseModel, BlockableMixin):
    # short id đặc biệt của riêng
    short_id= models.CharField(
        max_length=15,
        unique=True,
        db_index=True,
        default=generate_short_id,
    )
    order_index = models.PositiveSmallIntegerField(default=0)
    # Ca sĩ hát chính
    artist = models.ForeignKey(
        'artists.Artist',
        on_delete=models.CASCADE,
        related_name='tracks'
    )
    # ca sĩ feat chung
    featured_artists = models.ManyToManyField(
        'artists.Artist',
        related_name='featured_tracks',
        blank=True
    )
    # thông tin cơ bản
    title = models.CharField(max_length=255)
    slug = AutoSlugField(populate_from='title', unique=True)
    
    duration = models.DurationField(null=True, blank=True)
    # Link to audio file
    file_url = models.FileField(
        max_length=500, 
        upload_to=get_path_upload_audio_track, 
        validators=[validate_audio_size, validate_audio_extension],
        help_text='Streaming'
    )
    preview_file = models.FileField(
        max_length=500,
        upload_to=get_path_upload_preview_track,
        null=True,
        blank=True,
    )
    lyrics_file = models.FileField(
        max_length=500,
        upload_to=get_path_upload_lyrics_track,
        null=True,
        blank=True,
    )

    file_size = models.PositiveBigIntegerField(null=True, blank=True, help_text="Dung lượng file (Bytes)")

    is_premium_only = models.BooleanField(
        default=False, 
        help_text='Premium track for premium users only'
    )
    # Liên kết đến album/EP/single và genre mà bài hát thuộc về - 
    # Nếu là null tức -> artist xóa 1 bài trong release draft -> lưu thành 1 Unsigned Track
    release = models.ForeignKey(
        'releases.Release',
        on_delete=models.CASCADE,
        related_name='tracks',
        null=True,
        blank=True
    )
    genre = models.ForeignKey(
        'genres.Genre',
        on_delete=models.SET_NULL,
        related_name='tracks',
        null=True
    )
    # Lượng nghe và downloa
    listens = models.PositiveIntegerField(default=0)
    downloads = models.PositiveIntegerField(default=0)

    # Người dùng đã thích bài hát
    liked_by = models.ManyToManyField(User, related_name='liked_tracks', blank=True)

    # chủ yếu Dành cho artist
    is_active = models.BooleanField(default=True)
    # Dành cho admin block bài hát
    is_blocked = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Track'
        verbose_name_plural = 'Tracks'
        indexes = [
            models.Index(fields=['is_active', 'is_blocked']),
            models.Index(fields=['release', 'artist']), 
        ]
    
    def save(self, *args, **kwargs):
        # Chỉ xử lý mã hóa khi tạo mới bài hát
        if self.file_url and not self.id: 
            try:
                # 1. Đọc nội dung file gốc từ RAM
                original_data = self.file_url.read()
                self.file_url.seek(0)

                # 2. MÃ HÓA FILE GỐC
                fernet = Fernet(settings.MUSIC_ENCRYPTION_KEY.encode())
                encrypted_data = fernet.encrypt(original_data)

                self.file_size = len(encrypted_data)
                
                # 3. Ghi đè file mã hóa (LỆNH NÀY TỰ ĐỘNG UPLOAD LÊN R2)
                self.file_url.save(
                    os.path.basename(self.file_url.name),
                    ContentFile(encrypted_data),
                    save=False
                )
            except Exception as e:
                print(f"Lỗi mã hóa file: {e}")
        
        # 4. Trích xuất dung lượng file từ R2
        if self.file_url and not self.file_size:
            try:
                self.file_size = self.file_url.size
            except Exception:
                pass

        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
    

class Video(BaseModel):
    track = models.ForeignKey(
        Track,
        on_delete=models.CASCADE,
        related_name='canvas'
    )
    file_url = models.FileField(help_text='URL of the canvas video')
    slug = AutoSlugField(populate_from='track__title', unique=True)
    thumbnail = models.ImageField(
        upload_to='tracks/canvas/thumbnails/', 
        null=True, 
        blank=True, 
        default='default/canvas_thumbnail.jpg'
    )

    class Meta:
        verbose_name = 'Track Canvas'
        verbose_name_plural = 'Track Canvases'

    def __str__(self):
        return f'Canvas video of "{self.track.title}"'
