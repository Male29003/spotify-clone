from django.db import models
from django.contrib.auth import get_user_model
from model_utils import Choices
from django.utils.translation import gettext_lazy as _

User = get_user_model()

PAYMENT_STATUS = Choices(
    ("pending", _("Pending")),
    ("approved", _("Approved")),
    ("failed", _("Failed")),
) 

# Create your models here.
class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=100, unique=True)
    price = models.DecimalField(max_digits=6, decimal_places=2)
    duration_days = models.PositiveIntegerField(help_text='Duration of the plan in days')

    class Meta:
        verbose_name = 'Subscription Plan'
        verbose_name_plural = 'Subscription Plans'

    def __str__(self):
        return self.name
    
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

    def __str__(self):
        return f"{self.user.username} - {self.plan.name}"
    
class Payment(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    subscription_plan = models.ForeignKey(
        SubscriptionPlan, 
        on_delete=models.CASCADE, 
        related_name='payments'
    )
    amount = models.DecimalField(max_digits=6, decimal_places=2)
    transaction_id = models.CharField(max_length=255, unique=True)
    status = models.CharField(
        choices=PAYMENT_STATUS, 
        max_length=10,
        default=PAYMENT_STATUS.pending
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'

    def __str__(self):
        return f"Payment {self.transaction_id} by {self.user.username}"