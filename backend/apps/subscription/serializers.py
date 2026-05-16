from django.apps import apps
from rest_framework import serializers
from .models import SubscriptionPlan, UserSubscription, Payment

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'price', 'duration_days']

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields =[
            "created_at",
            "transaction_id",
            "amount",
            "status"
        ]

