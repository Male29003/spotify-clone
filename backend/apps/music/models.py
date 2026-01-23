from django.db import models
from ..core.models import BaseModel
from autoslug import AutoSlugField
from django.utils.translation import gettext_lazy as _

from django.contrib.auth import get_user_model

User = get_user_model()

class TrackAccessType(models.TextChoices):
    FREE = 'free', _('Free')
    PREMIUM = 'premium', _('Premium')
    

class Track(BaseModel):
    title = models.CharField(max_length=255)
    artist = models.ForeignKey(
        'artists.Artist',
        on_delete=models.CASCADE,
        related_name='tracks'
    )
    album = models.ForeignKey(
        'albums.Album',
        on_delete=models.CASCADE,
        related_name='tracks',
        null=True,
        blank=True
    )
    genre = models.ForeignKey(
        'genres.Genre',
        on_delete=models.CASCADE,
        related_name='tracks'
    )

    slug = AutoSlugField(populate_from='title', unique=True)
    image = models.ImageField(
        upload_to='tracks/images/',
        blank=True,
        default='default/tracks.jpg')
    duration = models.DurationField(null=True, blank=True)

    # Link to audio file
    file_url = models.FileField(help_text='Streaming')
    preview_file = models.FileField(
        upload_to="tracks/previews/",
        null=True,
        blank=True,
    )

    listens = models.PositiveIntegerField(default=0)
    downloads = models.PositiveIntegerField(default=0)

    liked_by = models.ManyToManyField(User, related_name='liked_tracks', blank=True)

    release_date = models.DateField(null=True, blank=True)
    is_premium_only = models.BooleanField(default=False, help_text='Premium track for premium users only')

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Track'
        verbose_name_plural = 'Tracks'

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