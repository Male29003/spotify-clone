# playlists/models.py
from django.db import models
from ..core.models import BaseModel
from autoslug import AutoSlugField
from ..core.services import validate_image_size, validate_image_extension
from django.contrib.auth import get_user_model

User = get_user_model()

class Playlist(BaseModel):
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='playlists'
    )
    tracks = models.ManyToManyField(
        'music.Track', 
        related_name='playlists', 
        blank=True
    )
    title = models.CharField(max_length=255) 
    description = models.TextField(blank=True, null=True)
    slug = AutoSlugField(populate_from='title', unique=True) 
    image = models.ImageField(
        max_length=500,
        validators=[validate_image_size, validate_image_extension],
        upload_to='playlists/images/',
        null=True,
        blank=True
    ) 
    is_private = models.BooleanField(default=True) 

    def __str__(self):
        return self.title
    
class FavouritePlaylist(BaseModel):
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name="favourite_playlists"
    )
    playlist = models.ForeignKey(
        'playlists.Playlist', 
        on_delete=models.CASCADE, 
        related_name="favourite_by"
    )

    class Meta:
        unique_together = ("user", "playlist")
        ordering= ["-created_at"]

    def __str__(self):
        return f"{self.playlist.title} is one of {self.user.username}'s favourite playlists."