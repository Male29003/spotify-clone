from django.db import models
from model_utils import Choices
from django.utils import timezone
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from ..core.services import get_path_upload_image_user, validate_image_size
from django.utils.translation import gettext_lazy as _
from .managers import CustomUserManager
from django_countries.fields import CountryField

GENDER_CHOICES = Choices(
    ("male", _("Male")),
    ("female", _("Female")),
    ("other", _("Other")),
    ("prefer_not_to_say", _("Prefer not to say")),
)

TYPE_PROFILE = Choices(
    ("user", _("User")),
    ("artist", _("Artist")),
)

# Create your models here.
class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(
        unique=True,
        db_index=True,
        max_length=255
    )
    username = models.CharField(
        max_length=150,
        blank=True
    )
    phone = models.CharField(max_length=15, unique=True)
    image = models.ImageField(
        upload_to=get_path_upload_image_user,
        validators=[validate_image_size],
        default='default/profile_picture.png',
        blank=True,
    )
    country = CountryField(
        blank_label="Select a country",
        default="VN",
        blank=True,
        null=True,
    )
    gender = models.CharField(
        max_length=20, 
        choices=GENDER_CHOICES, 
        null=True
    )
    type = models.CharField(
        max_length=10,
        choices=TYPE_PROFILE,
        default=TYPE_PROFILE.user,
    )
    followers = models.ManyToManyField('self', symmetrical=False, related_name='following', blank=True)
    date_joined = models.DateTimeField(default=timezone.now)

    is_premium = models.BooleanField(default=False)

    # User permissions
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    objects = CustomUserManager()

    class Meta:
        ordering = ["-date_joined"]
        verbose_name = _("User")
        verbose_name_plural = _("Users")

    def __str__(self):
        return "User: " + self.username + " with email: " + self.email
    
    def save(self, *args, **kwargs):
        username_email = self.email.split("@", 1)
        if self.username is None or self.username == "":
            self.username = username_email
        super().save(*args, **kwargs)

    def follow(self, user):
        if user not in self.followers.all():
            self.followers.add(user)
            return True
        return False
    def unfollow(self, user):
        if user in self.followers.all():
            self.followers.remove(user)
            return True
        return False
    def check_following(self, user_id):
        return self.followers.filter(id=user_id).exists()
    
    @property
    def followers_count(self):
        return self.followers.count()
    @property
    def following_count(self):
        return self.following.count()
    
    def get_followers(self):
        return self.followers.all()
    def get_following(self):
        return self.following.all()
    
    @property
    def get_profile(self):
        """ Return profile user or artist """
        if self.is_artist:
            # If you are an artist, return artist
            return self.artist
        # else Default return a normal user
        return self

    def is_artist(self):
        return self.type == TYPE_PROFILE.artist
