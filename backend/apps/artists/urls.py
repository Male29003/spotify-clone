from django.urls import path
from .views import (
    ArtistListView,
    ArtistDetailView,
    FavouriteArtistToggleView,
    MyFavouriteArtistListView,
    StudioArtistProfileView,
    TrendingArtistListView,
    ArtistDiscographyListView,
    RelatedArtistListView,

    ApplyArtistView,
    AdminVerificationActionView,
    AdminArtistListView,
    AdminPendingVerificationListView,
    AdminArtistDetailView,
    AdminBlockArtistActionView,
)

app_name = "artists"

urlpatterns = [
    # Ưu tiên ko có params
        #  lis
    path('', ArtistListView.as_view(), name='artist-list'),
    path('favourite/', MyFavouriteArtistListView.as_view(), name='my-favourite-artists'),
    path('get-trending/', TrendingArtistListView.as_view(), name='trending-artists'),
        
    # Artist thay đỗi thông tin cá nhân
        #  art
    path('me/', StudioArtistProfileView.as_view(), name='artist-profile'),
    
    # Registration & Admin Workflow
        #  art
    path('apply/', ApplyArtistView.as_view(), name='register-artist'),

    # Quản lý danh sách (Admin)
    path('admin/manage/', AdminArtistListView.as_view(), name='admin-artist-list'),
    
    # Quản lý chi tiết/Update/Delete (Admin)
    path('admin/manage/<str:short_id>/', AdminArtistDetailView.as_view(), name='admin-artist-detail'),
    path('admin/manage/<str:short_id>/block/', AdminBlockArtistActionView.as_view(), name='admin-artist-block'),
    path('admin/verifications/', AdminPendingVerificationListView.as_view(), name='admin-verifications'),
    path('admin/verifications/<int:pk>/action/', AdminVerificationActionView.as_view(), name='admin-verify-action'),

    # Public & Artist self-manage
        #  lis
    path('<str:short_id>/', ArtistDetailView.as_view(), name='artist-detail'),
    path('<str:short_id>/favourite/', FavouriteArtistToggleView.as_view(), name='favourite-artist-toggle'),
    path('<str:short_id>/related/', RelatedArtistListView.as_view()),
    path('<str:short_id>/discography/', ArtistDiscographyListView.as_view(), name='artist-discography'),
]