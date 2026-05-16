from django.db import models
from ..core.models import BaseModel, BlockableMixin, RejectableMixin
from django.contrib.auth import get_user_model
from autoslug import AutoSlugField
from django.utils.translation import gettext_lazy as _
from ..core.services import validate_image_size, get_path_upload_image_artist, validate_image_extension, get_path_upload_image_artist_banner
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from ..analytics.models import StreamHistory
from ..core.utils import generate_short_id

User = get_user_model()

# Create your models here.
class Artist(BaseModel, BlockableMixin):
    # short id đặc biệt của riêng
    short_id= models.CharField(
        max_length=15,
        unique=True,
        db_index=True,
        default=generate_short_id,
    )
    # user của artist
    user = models.OneToOneField(
        User, 
        on_delete=models.SET_NULL, 
        related_name="artist_profile",
        null=True,
        blank=True
    )
    #thông tin cơ bản
    stage_name = models.CharField(
        max_length=255, 
        null=False,
    )
    slug = AutoSlugField(
        populate_from="stage_name", 
        unique=True, 
        null=True, 
        blank=True
    )
    image = models.ImageField(
        max_length=500,
        upload_to=get_path_upload_image_artist,
        validators=[validate_image_size, validate_image_extension],
        null=False,
        blank=False
    )
    banner = models.ImageField(
        max_length=500,
        upload_to=get_path_upload_image_artist_banner,
        validators=[validate_image_size, validate_image_extension],
        null=True,
        blank=True
    )
    is_verify = models.BooleanField(
        default=False
    )
    is_active = models.BooleanField(
        default=True
    )

    # Dành cho admin block bài hát
    is_blocked = models.BooleanField(default=False)

    is_claimed = models.BooleanField(default=False)

    class Meta:
        verbose_name = _("Artist")
        verbose_name_plural = _("Artists")
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.stage_name:
            if self.user:
                self.stage_name = f"{self.user.first_name} {self.user.last_name}"
            else:
                self.stage_name = "Unknown Artist"
        if self.pk:
            try:
                old_instance = Artist.objects.get(pk=self.pk)
                if old_instance.image and self.image and self.image != old_instance.image:
                    old_instance.image.delete(save=False)
                if old_instance.banner and self.banner and self.banner != old_instance.banner:
                    old_instance.banner.delete(save=False)
            except Artist.DoesNotExist:
                pass
        super().save(*args, **kwargs)

    def __str__(self):
        return self.stage_name
    
    @property
    def get_real_name(self):
        if self.user:
            return f"{self.user.first_name} {self.user.last_name}"
        return self.stage_name          
    
    @property
    def get_total_listens(self):
        total = self.tracks.aggregate(total_listens=Sum('listens'))['total_listens']
        return total or 0
    
    @property 
    def get_total_releases(self):
        total = self.releases.filter(
            is_active=True,
            is_blocked=False,
            is_published=True,
        ).count()
        return total or 0
    
    @property
    def get_monthly_listeners(self):
        # 1. Lấy mốc thời gian 30 ngày trước
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        # 2. Query đếm User duy nhất
        unique_users_count = StreamHistory.objects.filter(
            track__artist=self,             
            created_at__gte=thirty_days_ago 
        ).values('user').distinct().count()
        
        return unique_users_count
    
class ArtistVerificationRequest(BaseModel, RejectableMixin):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name="verification_requests", 
        null=True
    )
    
    artist = models.OneToOneField(
        'Artist', 
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verification_requests"
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    
    identity_document = models.ImageField(upload_to='verifications/documents/', null=True, blank=False)
    social_link = models.URLField(max_length=500, null=True, blank=False)
    contact_phone = models.CharField(max_length=20, null=True, blank=False)

    class Meta:
        verbose_name = "Artist verification request"
        verbose_name_plural = "Artist verification requests"
        ordering = ["-created_at", "-updated_at"]

    def __str__(self):
        return f"{self.artist.stage_name} - {self.status}"
    
class FavouriteArtist(BaseModel):
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name="favourite_artists"
    )
    artist = models.ForeignKey(
        Artist, 
        on_delete=models.CASCADE, 
        related_name="favourite_by"
    )

    class Meta:
        verbose_name = _("Favorite artist")
        verbose_name_plural = _("Favorite artists")
        unique_together = ("user", "artist")
        ordering = ["-created_at", "-updated_at"]

    def __str__(self):
        return f"{self.artist.stage_name} is one of {self.user.username}'s favourite artists"