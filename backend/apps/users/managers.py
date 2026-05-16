from django.contrib.auth.base_user import BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

class CustomUserManager(BaseUserManager):
    """
    Custom manager for User model.
    """
    def email_validator(self, email):
        """
        Validate the email address.
        """
        try:
            validate_email(email)
        except ValidationError:
            raise ValueError(_("Please enter a valid email address !!!"))

# Create a user
    def create_user(self, email, password=None, **extra_fields):
        """
        Create and return a user with an email, username and password.
        """
        # Check if email and username are provided
        if not email:
            raise ValueError(_("The Email field must be set"))
        if not password:
            raise ValueError(_("The Password field must be set"))
        
        # Check if email is valid
        try:
            email = self.normalize_email(email)
            self.email_validator(email)
        except ValueError :
            raise ValueError(_("Invalid email address"))
        # Create user
        try:
            user = self.model(email=email, **extra_fields)
            user.set_password(password)
            user.save(using=self._db)
            return user
        except ValidationError as e:
            raise ValueError(_("Cannot create user !!!") + str(e))

# Create a superuser
    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and return a superuser with an email, username and password.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        # Ensure that is_staff and is_superuser are set to True
        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))
        if extra_fields.get("is_active") is not True:
            raise ValueError(_("Superuser must have is_active=True."))
        
        # Check if email and username are provided
        if not email:
            raise ValueError(_("The Email field must be set"))
        if not password:
            raise ValueError(_("The Password field must be set"))
        
        # Check if email is valid
        try:
            email = self.normalize_email(email)
            self.email_validator(email)
        except ValueError :
            raise ValueError(_("Invalid email address"))

        # Create superuser

        return self.create_user(email, password, **extra_fields)