from django.db import models
from ..core.choices import BlockReason
from rest_framework import serializers

# Create your models here.
class BaseModel(models.Model):
    """
    Base model that includes common fields for all models.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        # This model will not create a database table
        # and will be used as a base class for other models.
        abstract = True
    
class BlockableMixin(models.Model):
    block_reason = models.IntegerField(
        choices=BlockReason.choices, 
        null=True, 
        blank=True
    )
    block_note = models.TextField(
        blank=True, 
        null=True, 
    )

    class Meta:
        abstract = True

class RejectableMixin(models.Model):
    reject_reason = models.IntegerField(
        null=True, 
        blank=True
    )
    reject_note = models.TextField(
        blank=True, 
        null=True, 
    )

    class Meta:
        abstract = True
    

class R2ImageField(serializers.ImageField):
    """
    Custom Image Field:
    - Nhận link ngoài (Google, Random API) -> Trả thẳng link
    - Nhận file upload R2 -> Tự động sinh URL và fix lỗi https//
    """
    def to_representation(self, value):
        if not value:
            return None
            
        # Lấy giá trị chuỗi gốc lưu trong DB (chưa qua xử lý của Storage)
        name = getattr(value, 'name', str(value))
        
        # 1. Nếu là link ngoài (Google, Random API) -> Trả thẳng luôn
        if name.startswith('http://') or name.startswith('https://'):
            return name
            
        # 2. Nếu là file upload lên R2 -> Lấy URL qua storage backend
        try:
            url = value.url
            # Fix lỗi dư https:// do cấu hình custom domain
            return url.replace('https://https//', 'https://')
        except Exception:
            return None