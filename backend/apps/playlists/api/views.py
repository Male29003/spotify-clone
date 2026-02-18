from rest_framework import generics, permissions, filters, status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from rest_framework.views import APIView
from ..models import Playlist, FavouritePlaylist
from .serializers import PlaylistSerializer, ShortPlaylistSerializer, FavouritePlaylistSerializer
from ...core.permissions import IsOwnerUserPermission, ArtistPermission
from django.shortcuts import get_object_or_404

# GET method for all users
class PlaylistListView(generics.ListAPIView):
    queryset = Playlist.objects.all().filter(is_private=False).select_related('user')
    serializer_class = PlaylistSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['user', 'created_at']
    search_fields = ['title', 'user__username']
    ordering_fields = ['-created_at', 'title']

class PlaylistDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Playlist.objects.select_related('user').prefetch_related('tracks')
    serializer_class = PlaylistSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

# Favourite playlist handling function
class FavouritePlaylistToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        playlist = get_object_or_404(Playlist, slug=slug)
        user = request.user
        favourite_playlist = FavouritePlaylist.objects.filter(user=user, playlist=playlist)

        if favourite_playlist.exists():
            favourite_playlist.delete()
            return Response({"detail": "Playlist removed from favourite list."}, status=status.HTTP_204_NO_CONTENT)
        else:
            FavouritePlaylist.objects.create(user=user, playlist=playlist)
            return Response({"detail": "Playlist added to favourite list."}, status=status.HTTP_201_CREATED)
        
class MyLibraryPlaylistView(generics.ListCreateAPIView):
    serializer_class = ShortPlaylistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Playlist.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(user=user)

class MyFavouritePlaylistListView(generics.ListAPIView):
    serializer_class = FavouritePlaylistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return FavouritePlaylist.objects.filter(user=user).select_related('playlist')
