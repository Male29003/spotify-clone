from django.db import models

# Create your models here.
class BaseModel(models.Model):
    """
    Base model that includes common fields for all models.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # This model will not create a database table
        # and will be used as a base class for other models.
        abstract = True