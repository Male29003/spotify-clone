from django.urls import path
from .views import (
    UserRegistrationView,
    UserPublicProfileView,
    UserOwnerView,
    ChangePasswordView
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

app_name = "users"

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('me/', UserOwnerView.as_view(), name='user-me'),
    path('me/change-password', ChangePasswordView.as_view(), name='change_password'),

    path('profile/<str:username', UserPublicProfileView.as_view(), name='user-profile'),
]