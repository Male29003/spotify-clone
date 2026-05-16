from django.db import models
from ..core.models import BaseModel
from autoslug import AutoSlugField
from ..core.services import get_path_upload_image_genre, validate_image_size, validate_image_extension
from django.utils.translation import gettext_lazy as _

# Create your models here.
class Genre(BaseModel):
    """Genre model representing a music genre."""

    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True, max_length=500)
    slug = AutoSlugField(populate_from="name", unique=True)
    image = models.ImageField(
        max_length=500,
        upload_to=get_path_upload_image_genre,
        validators=[validate_image_size, validate_image_extension],
        blank=True,
        null=True,
        default="default/genre.jpg"
    )
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ["-created_at"]

    @property
    def get_total_tracks(self):
        return self.tracks.filter(
            is_active=True,
            is_blocked=False,
            release__is_active=True,
            release__is_blocked=False,
        ).count()

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.pk: # Nếu đã tồn tại trong DB (tức là đang update)
            try:
                old_genre = Genre.objects.get(pk=self.pk)
                # Kiểm tra nếu có ảnh cũ, khác ảnh mặc định, và ảnh mới khác ảnh cũ
                if (old_genre.image and 
                    old_genre.image.name != "default/genre.jpg" and 
                    old_genre.image != self.image):
                    old_genre.image.delete(save=False) 
            except Genre.DoesNotExist:
                pass
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.image and self.image.name != "default/genre.jpg":
            self.image.delete(save=False) # Xóa file trên R2
        super().delete(*args, **kwargs)
