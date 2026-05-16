from django.urls import path
from .views import (
    # Listener
    ReleaseListView,
    ReleaseDetailView,
    RecentReleaseListView,
    RecommendedReleaseListView,
    SecureReleaseDownloadView,
    RelatedReleaseListView,
    # Studio
    StudioReleaseListCreateView,
    StudioReleaseUpdateView,
    GetArtistForFeaturedInfoView,
    StudioReleaseReorderTracksView,
    # Admin
    AdminReleaseListView,
    AdminDetailReleaseView,
    AdminBlockReleaseActionView,
    AdminReleaseActionView,
    StudioReleaseDeleteView,
    AdminPendingReleaseListView,
    # Các hàm chức năng khác
    FavouriteReleaseToggleView,
    MyLibraryReleaseListView,
    TrendingReleaseListView
)

app_name = "releases"

urlpatterns = [
    # ==================== LISTENER ====================
    path('', ReleaseListView.as_view(), name='release-list'),

    path('get-artist/', GetArtistForFeaturedInfoView.as_view(), name='get-featured-artists'),

    # ==================== LISTENER ====================
    path('get-trending/', TrendingReleaseListView.as_view(), name='trending-releases'),
    path('recent/', RecentReleaseListView.as_view(), name='recent-releases'),
    path('recommended/', RecommendedReleaseListView.as_view(), name='recommended-releases'),
    path('favourite/', MyLibraryReleaseListView.as_view(), name='my-favourite-releases'),

    # ==================== ARTIST (STUDIO) ====================
    path('me/', StudioReleaseListCreateView.as_view(), name='studio-release-list-create'),
    path('me/<str:short_id>/', StudioReleaseUpdateView.as_view(), name='studio-release-update'),
    path('me/<str:short_id>/delete/', StudioReleaseDeleteView.as_view(), name='studio-release-delete'),
    path('me/<str:short_id>/reorder/', StudioReleaseReorderTracksView.as_view(), name='release-reorder'),

    # LISTENER 
    path('<str:short_id>/', ReleaseDetailView.as_view(), name='release-detail'),
    path('<str:short_id>/favourite/', FavouriteReleaseToggleView.as_view(), name='favourite-release-toggle'),

    # ==================== ADMIN ====================
    path('admin/manage/', AdminReleaseListView.as_view(), name='admin-release-list'),
    path('admin/manage/pending/', AdminPendingReleaseListView.as_view(), name='admin-pending-releases'),
    path('admin/manage/<str:short_id>/', AdminDetailReleaseView.as_view(), name='admin-release-detail'),
    path('admin/manage/<str:short_id>/block/', AdminBlockReleaseActionView.as_view(), name='admin-release-block'),
    path('admin/manage/<str:short_id>/action/', AdminReleaseActionView.as_view(), name='admin-release-publish'),


    path('<str:short_id>/download/', SecureReleaseDownloadView.as_view(), name='release-download'),
    path('<str:short_id>/related/', RelatedReleaseListView.as_view()),
]