# apps/analytics/api/urls.py
from django.urls import path
from .views import ArtistDashboardStatsView, AdminDashboardStatsView

app_name = "analytics"

urlpatterns = [
    path('artist-dashboard/', ArtistDashboardStatsView.as_view(), name='artist-dashboard'),
    path('admin-dashboard/', AdminDashboardStatsView.as_view(), name='admin-dashboard'),
]