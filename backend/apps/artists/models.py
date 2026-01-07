from django.db import models
from ..core.models import BaseModel
from django.contrib.auth import get_user_model
from autoslug import AutoSlugField
from django.utils.translation import gettext_lazy as _
from ..core.services import validate_image_size, get_path_upload_image_artist

User = get_user_model()
# Create your models here.
class Artist(BaseModel):
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="artist")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    username = models.CharField(max_length=100, blank=True, unique=True)
    slug = AutoSlugField(populate_from="username", unique=True)
    image = models.ImageField(
        upload_to=get_path_upload_image_artist,
        validators=[validate_image_size],
        blank=True,
        default="default/profile.fpeg",
    )
    is_verify = models.BooleanField(default=False)

    class Meta:
        verbose_name = _("Artist")
        verbose_name_plural = _("Artists")
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if self.username == "" or self.username is None:
            self.username = f"{self.first_name} {self.last_name}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username
    
    @property
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def get_listeners(self):
        count = 0
        for track in self.tracks.all():
            count += track.plays_count
        return count
    
class ArtistVerificationRequest(BaseModel):
    """
    Artist verification request model.
    """

    artist = models.OneToOneField(Artist, on_delete=models.CASCADE, related_name="verification_requests")
    is_processed = models.BooleanField(_("is processed"), default=False)

    class Meta:
        verbose_name = _("Artist verification request")
        verbose_name_plural = _("Artist verification requests")
        ordering = ["-created_at", "-updated_at"]

    def __str__(self):
        """String representation of the artist verification request."""
        return self.artist.username

class FavouriteArtist(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorite_artists")
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name="favorite_artists")

    class Meta:
        verbose_name = _("Favorite artist")
        verbose_name_plural = _("Favorite artists")
        unique_together = ("user", "artist")
        ordering = ["-created_at", "-updated_at"]

    def __str__(self):
        return f"{self.artist.username} is one of {self.user.username}'s favourite artists"