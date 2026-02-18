from django.urls import path
from .views import (
    AlbumListView,
    AlbumDetailView,
    FavouriteAlbumToggleView,
    MyAlbumListCreateView,
    MyAlbumUpdateDeleteView,
    MyLibraryAlbumListView
)

app_name = "albums"

urlpatterns = [
    path('', AlbumListView.as_view(), name='album-list'),
    path('<slug:slug>/', AlbumDetailView.as_view(), name='album-detail'),
    path('<slug:slug>/favourite/', FavouriteAlbumToggleView.as_view(), name='favourite-album-toggle'),
    path('library/', MyLibraryAlbumListView.as_view(), name='my-favourite-albums'),

    # For Artists
    path('me/', MyAlbumListCreateView.as_view(), name='my-album-list-create'),
    path('me/<slug:slug>/', MyAlbumUpdateDeleteView.as_view(), name='my-album-update-delete'),
]