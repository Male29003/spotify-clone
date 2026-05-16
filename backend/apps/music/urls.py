from django.urls import path
from .views import (
    # Listener
    TrackListView,
    TrackDetailView,
    RecordListeningView,
    RecommendedTrackListView,
    MusicStreamView,
    RelatedTrackListView,
    SecureTrackDownloadView,
    # Studio
    StudioTrackCreateView,
    StudioTrackUpdateDeleteView,
    StudioGetUnassignedTracksView,
    # Admin
    AdminTrackDetailView,
    AdminBlockTrackActionView,
    AdminTrackListView,
    # Các view phụ
    LikedTrackToggleView,
    MyLikedSongsListView,
    TrendingTrackListView,
    StudioToggleActiveTrackView,
    
)

app_name = "music"

urlpatterns = [
    # ==================== LISTENER ====================
    path('track/', TrackListView.as_view(), name='track-list'),
    path('get-trending/', TrendingTrackListView.as_view(), name='trending-tracks'),
    path('recommend/', RecommendedTrackListView.as_view(), name='recommended-tracks'),

    #path('recent/', RecentReleaseListView.as_view(), name='recent-releases'),
    path('history/record/', RecordListeningView.as_view(), name='history-record'),
    path('me/favourite/', MyLikedSongsListView.as_view(), name='liked-songs'),
    path('track/<str:short_id>/', TrackDetailView.as_view(), name='track-detail'),
    path('track/<str:short_id>/favourite/', LikedTrackToggleView.as_view(), name='favourite-track-toggle'),

    # ==================== ARTIST (STUDIO) ====================
    path('me/manage/', StudioTrackCreateView.as_view(), name='studio-track-list-create'),
    path('me/unassigned/', StudioGetUnassignedTracksView.as_view(), name='studio-unassigned-tracks'),
    path('me/manage/<str:short_id>/', StudioTrackUpdateDeleteView.as_view(), name='studio-track-update-delete'),
    path('me/manage/<str:short_id>/toggle-active', StudioToggleActiveTrackView.as_view(), name='studio-track-active'),
    # ==================== ADMIN ====================
    path('admin/manage/', AdminTrackListView.as_view(), name='admin-track-list'),
    path('admin/manage/<str:short_id>/', AdminTrackDetailView.as_view(), name='admin-track-detail'),
    path('admin/manage/<str:short_id>/block/', AdminBlockTrackActionView.as_view(), name='admin-track-block'),
    
    path('track/stream/<str:short_id>/', MusicStreamView.as_view(), name='track-stream'),
    path('track/<str:short_id>/download/', SecureTrackDownloadView.as_view(), name='track-download'),

    # ==================== LISTENER ====================
    path('track/<str:short_id>/related/', RelatedTrackListView.as_view()),

]