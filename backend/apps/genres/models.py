from django.db import models
from ..core.models import BaseModel
from autoslug import AutoSlugField
from ..core.services import get_path_upload_image_album, validate_image_size
from django.utils.translation import gettext_lazy as _

# Create your models here.
class Genre(BaseModel):
    """Genre model representing a music genre."""

    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True, max_length=500)
    slug = AutoSlugField(populate_from="name", unique=True)
    image = models.ImageField(upload_to=get_path_upload_image_album, validators=[validate_image_size], blank=True, null=True, default="default/genre.jpg")
    
    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
    
    @property
    def get_all_tracks_count(self):
        count = 0
        for album in self.albums.all():
            count += album.get_total_tracks
        return count

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
