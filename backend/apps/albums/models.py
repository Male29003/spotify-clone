from django.db import models
from ..core.models import BaseModel
from autoslug import AutoSlugField
from django.contrib.auth import get_user_model
from ..core.services import get_path_upload_image_album, validate_image_size
from django.utils.translation import gettext_lazy as _

User = get_user_model()
# Create your models here.
class Album(BaseModel):
    title = models.CharField(max_length=255)
    artist = models.ForeignKey(
        'artists.Artist', 
        on_delete=models.CASCADE, 
        related_name="albums"
    )
    description = models.TextField(blank=True, null=True, max_length=500)
    slug = AutoSlugField(populate_from="title", unique=True)
    image = models.ImageField(
        upload_to='albums/images/', 
        blank=True, 
        null=True,
        default="default/album.jpg"
    )
    
    release_date = models.DateField(blank=True, null=True)
    is_private = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Album")
        verbose_name_plural = _("Albums")

    def __str__(self):
        return self.title
    
    @property    
    def get_total_tracks(self):
        return self.tracks.count()
    
    @property
    def get_total_likes(self):
        return self.favourite_albums.count()
    
    @property
    def get_total_listens(self):
        count = 0
        for track in self.tracks.all():
            count += track.listens
        return count
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
    

class FavouriteAlbum(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favourite_albums")
    album = models.ForeignKey(Album, on_delete=models.CASCADE, related_name="favourite_by")

    class Meta:
        unique_together = ("user", "album")
        ordering= ["-created_at"]

    def __str__(self):
        return f"{self.album.title} is one of {self.user.username}'s favourite albums."