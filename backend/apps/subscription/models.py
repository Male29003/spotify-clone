from django.db import models
from django.contrib.auth import get_user_model
from model_utils import Choices
from django.utils.translation import gettext_lazy as _
from ..core.models import BaseModel
import uuid

User = get_user_model()

PAYMENT_STATUS = Choices(
    ("pending", _("Pending")),
    ("success", _("Success")),
    ("failed", _("Failed")),
) 

# Create your models here.
class SubscriptionPlan(BaseModel):
    name = models.CharField(max_length=255, unique=True)
    price = models.PositiveIntegerField(help_text='Price in VND')
    duration_days = models.PositiveIntegerField(help_text='Duration of the plan in days')
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Subscription Plan'
        verbose_name_plural = 'Subscription Plans'

    def __str__(self):
        return f"{self.name} - {self.price} VND"
    
class UserSubscription(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE, 
        related_name='subscriptions'
    )
    plan = models.ForeignKey(
        SubscriptionPlan, 
        on_delete=models.CASCADE, 
        related_name='user_subscriptions'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expired_at = models.DateTimeField()

    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'User Subscription'
        verbose_name_plural = 'User Subscriptions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.plan.name} (Valid unit: {self.expired_at.strftime('%Y-%m-%d')})"
    
class Payment(BaseModel):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    subscription_plan = models.ForeignKey(
        SubscriptionPlan, 
        null=True,
        on_delete=models.SET_NULL, 
        related_name='payments'
    )
    amount = models.PositiveIntegerField(help_text='Amount paid in VND')
    order_id = models.CharField(
        max_length=255,
        unique=True,
        default=uuid.uuid4
    )
    status = models.CharField(
        choices=PAYMENT_STATUS, 
        max_length=10,
        default=PAYMENT_STATUS.pending
    )

    class Meta:
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-created_at']

    def __str__(self):
        return f"Order {self.order_id} - {self.amount} VND - {self.status}"