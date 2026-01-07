from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from ..models import Album, FavouriteAlbum
from ..api.serializers import AlbumSerializer, AlbumDetailSerializer,  FavouriteAlbumSerializer

# from apps.albums.models import Album, FavoriteAlbum
class AlbumListView(generics.ListCreateAPIView):
    """View to list and create albums."""

    serializer_class = AlbumSerializer
    permission_classes = [permissions.AllowAny]
    search_fields = ["title", "artist__stage_name", "tracks__title"]
    ordering_fields = ["-created_at"]

    def get_queryset(self):
        """Filter albums based on user authentication."""
        return Album.objects.select_related("artist").filter(is_private=False)

class AlbumDetailView(generics.RetrieveAPIView):
    """View to retrieve album details."""

    serializer_class = AlbumDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"

    def get_object(self):
        """Get the album object."""
        slug = self.kwargs.get("slug")
        return get_object_or_404(Album, slug=slug)
    
#  For artist to create album
class MyAlbumCreateView(generics.ListCreateAPIView):
    """View to list and create albums for the authenticated user."""

    serializer_class = AlbumDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ["title", "artist__stage_name", "tracks__title"]
    ordering_fields = ["-created_at"]

    def get_queryset(self):
        """Filter albums based on user authentication."""
        return Album.objects.select_related("artist").filter(artist=self.request.user.artist)
    
    def perform_create(self, serializer):
        serializer.save(artist=self.request.user.artist)
