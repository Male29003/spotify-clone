from django.db import models
from ..core.models import BaseModel, BlockableMixin, RejectableMixin
from autoslug import AutoSlugField
from django.contrib.auth import get_user_model
from ..core.services import get_path_upload_image_album, validate_image_size, validate_image_extension
from django.utils.translation import gettext_lazy as _
from django.db.models import Sum
import string, random
from ..core.utils import generate_short_id

User = get_user_model()

RELEASE_CHOICES = (
    ('single', 'Single'),
    ('ep', 'EP'),
    ('album', 'Album'),
)
STATUS_CHOICES = [
    ('draft', 'Draft'),
    ('pending', 'Pending'),
    ('published', 'Published'),
]
class Release(BaseModel, BlockableMixin, RejectableMixin):
    # short id đặc biệt của riêng
    short_id= models.CharField(
        max_length=15,
        unique=True,
        db_index=True,
        default=generate_short_id,
    )

    #thông tin cơ bản
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True, max_length=500)
    slug = AutoSlugField(populate_from="title", unique=True)
    image = models.ImageField(
        max_length=500,
        validators=[validate_image_size, validate_image_extension],
        upload_to=get_path_upload_image_album,
    )
    release_date = models.DateField(blank=True, null=True)
    # Loại phát hành: single, ep, album
    release_type = models.CharField(
        max_length=10, 
        choices=RELEASE_CHOICES, 
        default='single'
    )
    # nghệ sĩ phát hành
    artist = models.ForeignKey(
        'artists.Artist', 
        on_delete=models.CASCADE, 
        related_name="releases" 
    )
    
    # Dành cho admin block release
    is_blocked = models.BooleanField(default=False)

    # Dành cho artist -> gửi yêu cầu duyệt release
    is_pending = models.BooleanField(default=False)
    # Đã published
    is_published = models.BooleanField(default=False)
    # chủ yếu dành cho artist
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Release")
        verbose_name_plural = _("Releases")

    def __str__(self):
        return self.title
    
    @property    
    def get_total_tracks(self):
        return self.tracks.count()
    
    @property
    def get_total_likes(self):
        return self.favourite_releases.count()
    
    @property
    def get_total_listens(self):
        total = self.tracks.aggregate(total_listens=Sum('listens'))['total_listens']
        return total or 0
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
    

class FavouriteRelease(BaseModel):
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name="favourite_releases"
    )
    release = models.ForeignKey(
        Release, 
        on_delete=models.CASCADE, 
        related_name="favourite_by"
    )

    class Meta:
        unique_together = ("user", "release")
        ordering= ["-created_at"]

    def __str__(self):
        if self.user:
            return f"{self.release.title} is one of {self.user.username}'s favourite releases."