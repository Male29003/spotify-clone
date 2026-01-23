from django.db import models
from ..core.models import BaseModel
from django.contrib.auth import get_user_model
from autoslug import AutoSlugField
from django.utils.translation import gettext_lazy as _
from ..core.services import validate_image_size, get_path_upload_image_artist

User = get_user_model()
# Create your models here.
class Artist(BaseModel):
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name="artist_profile"
    )
    stage_name = models.CharField(
        max_length=255, 
        unique=True,
        null=False,
    )

    slug = AutoSlugField(populate_from="stage_name", unique=True, null=True, blank=True)
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
        if self.stage_name == "" or self.stage_name is None:
            self.stage_name = f"{self.user.first_name} {self.user.last_name}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.stage_name
    
    @property
    def get_real_name(self):
        return f"{self.user.first_name} {self.user.last_name}"
    
    @property
    def get_listeners(self):
        count = 0
        for track in self.tracks.all():
            count += track.listens
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
        return self.artist.stage_name

class FavouriteArtist(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorite_artists")
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name="favorite_by")

    class Meta:
        verbose_name = _("Favorite artist")
        verbose_name_plural = _("Favorite artists")
        unique_together = ("user", "artist")
        ordering = ["-created_at", "-updated_at"]

    def __str__(self):
        return f"{self.artist.stage_name} is one of {self.user.username}'s favourite artists"