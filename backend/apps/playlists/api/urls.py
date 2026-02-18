from django.urls import path
from .views import (
    PlaylistListView,
    PlaylistDetailView,
    FavouritePlaylistToggleView,
    MyLibraryPlaylistView,
    MyFavouritePlaylistListView
)

app_name = "playlists"

urlpatterns = [
    path('', PlaylistListView.as_view(), name='playlist-list'),
    path('me/library/', MyLibraryPlaylistView.as_view(), name='my-playlists'),
    path('me/favourite/', MyFavouritePlaylistListView.as_view(), name='my-favourite-playlists'),
    
    path('<slug:slug>/', PlaylistDetailView.as_view(), name='playlist-detail'),
    path('<slug:slug>/favourite/', FavouritePlaylistToggleView.as_view(), name='favourite-playlist-toggle'),
]