from rest_framework import generics, permissions, filters, status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from rest_framework.views import APIView
from ..models import Album, FavouriteAlbum
from .serializers import AlbumSerializer, AlbumDetailSerializer, FavouriteAlbumSerializer
from ...core.permissions import IsOwnerUserPermission, ArtistPermission
from django.shortcuts import get_object_or_404

# GET method for all users
class AlbumListView(generics.ListAPIView):
    queryset = Album.objects.all().filter(is_private=False).select_related('artist')
    serializer_class = AlbumSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['artist', 'release_date']
    search_fields = ['title', 'artist__stage_name']
    ordering_fields = ['-release_date', 'created_at']

class AlbumDetailView(generics.RetrieveAPIView):
    queryset = Album.objects.select_related('artist').prefetch_related('tracks')
    serializer_class = AlbumDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

# Favourite album hadling function
class FavouriteAlbumToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        album = get_object_or_404(Album, slug=slug)
        user = request.user
        favourite_album = FavouriteAlbum.objects.filter(user=user, album=album)

        if favourite_album.exists():
            favourite_album.delete()
            return Response({"detail": "Album removed from favourite list."}, status=status.HTTP_204_NO_CONTENT)
        else:
            FavouriteAlbum.objects.create(user=user, album=album)
            return Response({"detail": "Album added to favourite list."}, status=status.HTTP_201_CREATED)

class MyLibraryAlbumListView(generics.ListAPIView):
    serializer_class = FavouriteAlbumSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FavouriteAlbum.objects.filter(user=self.request.user).select_related('album')

# For artists who want to manage their albums
class MyAlbumListCreateView(generics.ListCreateAPIView):
    serializer_class = AlbumDetailSerializer
    permission_classes = [ArtistPermission]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'artist_profile'):
            return Album.objects.filter(artist=user.artist_profile).select_related('artist')
        return Album.objects.none()

    def perform_create(self, serializer):
        serializer.save(artist=self.request.user.artist_profile)

class MyAlbumUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AlbumDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerUserPermission]
    lookup_field = 'slug'

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'artist_profile'):
            return Album.objects.filter(artist=user.artist_profile).select_related('artist')
        return Album.objects.none()
