from django.urls import path
from . import views

app_name = "subscription"

urlpatterns = [
    path('plans/', views.SubscriptionPlanListView.as_view(), name='subscription-plan-list'),
    path('stripe/create-intent/', views.CreateStripePaymentIntentView.as_view(), name='create-stripe'),
    path('stripe/webhook/', views.stripe_webhook_view),
]