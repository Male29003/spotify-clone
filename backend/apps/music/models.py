from django.db import models
from ..core.models import BaseModel
from ..artists.models import Artist
from autoslug import AutoSlugField
from datetime import timedelta, date
from django.contrib.auth import get_user_model
from ..core.services import get_path_upload_image_album, validate_image_size, get_path_upload_audio_track, validate_audio_size
from ..artists.models import Artist
from ..genres.models import Genre
from ..albums.models import Album
from ..users.models import User
from mutagen import File
from django.utils.translation import gettext_lazy as _

User = get_user_model()
# Create your models here.
class Track(BaseModel):
    """Track model representing a music track."""

    title = models.CharField(max_length=255)
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name="tracks")
    slug = AutoSlugField(populate_from="title", unique=True)
    image = models.ImageField(
        upload_to=get_path_upload_image_album, 
        validators=[validate_image_size], 
        blank=True, 
        null=True, 
        default="default/track.jpg"
    )
    genre = models.ForeignKey(Genre, on_delete=models.CASCADE, related_name="tracks")
    album = models.ForeignKey(
        Album, 
        on_delete=models.SET_NULL, 
        related_name="tracks", 
        null=True
    )
    file_url = models.FileField(upload_to=get_path_upload_audio_track, validators=[validate_audio_size], )
    duration = models.DurationField(blank=True, null=False)

    listens = models.PositiveBigIntegerField(default=0)
    downloads = models.PositiveBigIntegerField(default=0)
    likes = models.PositiveBigIntegerField(default=0)

    liked_by = models.ManyToManyField(
        User, 
        related_name="liked_tracks", 
        blank=True
    )
    
    release_date = models.DateField(null=True)
    is_private = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Track")
        verbose_name_plural = _("Tracks")

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        audio = File(self.file_url)
        if audio is not None:
            self.duration = timedelta(seconds=audio.info.length)
        super().save(*args, **kwargs)
