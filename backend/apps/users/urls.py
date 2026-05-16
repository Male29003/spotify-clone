from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    # Auth
    CustomTokenObtainPairView,
    UserRegistrationView,
    ChangePasswordView,
    CustomTokenRefreshView,
    LogoutView,
    # Chung
    UserOwnerView,
    ForgotPasswordView,
    ResetPasswordView,
    VerifyRegistrationOTPView,
    VerifyOTPView,
    ResendOTPView,
    ToggleFollowUserView,
    UserPublicProfileView,
    MyNotificationListView,
    MarkNotificationReadView,
    # Admin
    AdminUserListView,
    AdminToggleUserStatusView,
    AdminStaffListView,
    AdminDetailUserView,
    AdminCreateStaffView,
    AdminStaffDetailView
)

app_name = "users"

urlpatterns = [
    # ==================== AUTH & JWT ====================
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('login/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('verify-register/', VerifyRegistrationOTPView.as_view(), name='verify-register'),
    
    # ==================== chung ====================
    path('me/', UserOwnerView.as_view(), name='user-me'),
    path('me/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('me/forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('me/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('me/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    
    path('me/noti/', MyNotificationListView.as_view(), name='noti-list'),
    path('me/noti/<int:pk>/', MarkNotificationReadView.as_view(), name='noti-marked'),
    # ==================== listener ====================
    path('profile/<str:username>/', UserPublicProfileView.as_view(), name='user-profile'),
    path('profile/<str:username>/follow/', ToggleFollowUserView.as_view(), name='toggle-follow-user'),
    # ==================== admin ====================
    path('admin/manage/', AdminUserListView.as_view(), name='admin-user-list'),

    path('admin/manage/staff/', AdminStaffListView.as_view(), name='admin-staff-list'),
    path('admin/manage/staff/<int:pk>/', AdminStaffDetailView.as_view(), name='admin-staff-detail'),
    path('admin/manage/create-staff/', AdminCreateStaffView.as_view(), name='admin-create-staff'),
    
    path('admin/manage/<int:pk>/', AdminDetailUserView.as_view(), name='admin-detail-user'),
    path('admin/manage/<int:pk>/toggle-active/', AdminToggleUserStatusView.as_view(), name='admin-toggle-status'),

]