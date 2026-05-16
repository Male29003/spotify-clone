from django.db import models
from model_utils import Choices
from django.utils import timezone
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from ..core.services import get_path_upload_image_user, validate_image_size, validate_image_extension
from django.utils.translation import gettext_lazy as _
from .managers import CustomUserManager
from ..core.models import BaseModel, BlockableMixin
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
class User(AbstractBaseUser, PermissionsMixin, BlockableMixin):
    email = models.EmailField(
        unique=True,
        db_index=True,
        max_length=255
    )
    username = models.CharField(
        unique=True,
        max_length=150,
        blank=True
    )
    phone = models.CharField(
        max_length=20, 
        unique=True, 
        null=True, 
        blank=True
    )
    profile_picture = models.ImageField(
        max_length=500,
        upload_to=get_path_upload_image_user,
        validators=[validate_image_size, validate_image_extension],
        default='default/profile.jpeg',
        blank=True,
        null=True,
    )
    first_name = models.CharField(
        max_length=70,
        blank=True,
    )
    last_name = models.CharField(
        max_length=30,
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
        null=True,
        blank=True
    )
    type = models.CharField(
        max_length=10,
        choices=TYPE_PROFILE,
        default=TYPE_PROFILE.user,
    )
    followers = models.ManyToManyField(
        'self', 
        symmetrical=False, 
        related_name='following', 
        blank=True
    )
    # User permissions
    is_premium = models.BooleanField(default=False)
    # Check if user is staff
    is_staff = models.BooleanField(
        _("staff status"),
        default=False,
        help_text=_("Designates whether the user can log into this admin site."),
    )
    # role cho staff
    role_permissions = models.JSONField(
        default=list, 
        blank=True, 
        null=True
    )

    # Dành cho admin block user nhé
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)
    
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
            self.username = username_email[0]
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
    def get_followers_count(self):
        return self.followers.count()
    @property
    def get_following_count(self):
        return self.following.count()
    
    def get_followers(self):
        return self.followers.all()
    
    def get_following(self):
        return self.following.all()
    
    @property
    def get_profile(self):
        """ Return profile user or artist """
        if self.is_artist:
            return getattr(self, 'artist_profile', self)
        return self

    @property
    def is_artist(self):
        return self.type == TYPE_PROFILE.artist
    
    @property
    def full_name(self):
        return self.first_name + " " + self.last_name

class Notification(BaseModel):
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='notifications'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    metadata = models.JSONField(
        default=dict, 
        blank=True, 
        null=True
    )
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"To {self.user.username}: {self.title}"