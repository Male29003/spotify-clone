from django.urls import path
from .views import (
    ArtistListView,
    ArtistDetailView,
    FavouriteArtistToggleView,
    MyFavouriteAritistListView,
    ArtistProfileUpdateView,
    ArtistImageUpdateView,
)

app_name = "artists"

urlpatterns = [
    path('', ArtistListView.as_view(), name='artist-list'),
    path('<slug:slug>/', ArtistDetailView.as_view(), name='artist-detail'),
    path('<slug:slug>/favourite/', FavouriteArtistToggleView.as_view(), name='favourite-artist-toggle'),
    path('library/', MyFavouriteAritistListView.as_view(), name='my-favourite-artists'),
    
    # For artists who want to manage their information
    path('me/', ArtistProfileUpdateView.as_view(), name='artist-update'),
    path('me/update-image/', ArtistImageUpdateView.as_view(), name='artist-image-update'),
]