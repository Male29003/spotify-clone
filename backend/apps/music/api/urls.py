from django.urls import path
from.views import (
    TrackListView,
    TrackDetailView,
    LikedTrackToggleView,
    MyLikedSongsListView,
    ArtistTrackManagementView,
    ArtistTrackUpdateView
)

from . import views

app_name = "music"

urlpatterns = [
    path('', TrackListView.as_view(), name='track-list'),
    path('me/favourite/', MyLikedSongsListView.as_view(), name='liked-songs'),
    path('<slug:slug>/', TrackDetailView.as_view(), name='track-detail'),
    path('<slug:slug>/favourite/', LikedTrackToggleView.as_view(), name='favourite-track-toggle'),

    path('me/manage/', ArtistTrackManagementView.as_view(), name='artist-track'),
    path('me/manage/<slug:slug>/', ArtistTrackUpdateView.as_view(), name='track-update')
]