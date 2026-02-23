from rest_framework import generics, permissions, status
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from ..models import Track
from .serializers import TrackSerializer, ShortTrackSerializer, CreateNewTrackSerializer
from apps.core.permissions import ArtistPermission, IsOwnerUserPermission

# Create your views here.
class TrackListView(generics.ListAPIView):
    queryset = Track.objects.all().select_related('artist', 'genre', 'album')
    serializer_class = ShortTrackSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['genre', 'is_premium_only']
    search_fields = ['title', 'artist__stage_name']
    ordering_fields = ['listens', '-created_at']

class TrackDetailView(generics.RetrieveAPIView):
    queryset = Track.objects.all().select_related('artist', 'album')
    serializer_class = TrackSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

class LikedTrackToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        track = get_object_or_404(Track, slug=slug)
        user = request.user

        if track.liked_by.filter(id=user.id).exists():
            track.liked_by.remove(user)
            return Response({"detail": "Remove from favourite songs."}, status=status.HTTP_204_NO_CONTENT)
        else:
            track.liked_by.add(user)
            return Response({"detail": "Added to favourite songs."}, status=status.HTTP_201_CREATED)

class MyLikedSongsListView(generics.ListAPIView):
    serializer_class = ShortTrackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.liked_tracks.all().select_related('artist')
    
# For artitsts who want to manage their musics
class ArtistTrackManagementView(generics.ListCreateAPIView):
    permission_classes = [ArtistPermission]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateNewTrackSerializer
        return ShortTrackSerializer
    
    def get_queryset(self):
        return Track.objects.filter(artist=self.request.user.artist_profile)
    
    def perform_create(self, serializer):
        serializer.save(artist=self.request.user.artist_profile)

class ArtistTrackUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = CreateNewTrackSerializer
    permission_classes = [ArtistPermission, IsOwnerUserPermission]
    lookup_field = 'slug'

    def get_queryset(self):
        if hasattr(self.request.user, 'artist_profile'):
            return Track.objects.filter(artist=self.request.user.artist_profile)
        return Track.objects.none()
class TrackListView(generics.ListAPIView):
    queryset = Track.objects.all().select_related('artist', 'genre', 'album')
    serializer_class = ShortTrackSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['genre', 'is_premium_only']
    search_fields = ['title', 'artist__stage_name']
    ordering_fields = ['listens', '-created_at']

class TrackDetailView(generics.RetrieveAPIView):
    queryset = Track.objects.all().select_related('artist', 'album')
    serializer_class = TrackSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

class LikedTrackToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        track = get_object_or_404(Track, slug=slug)
        user = request.user

        if track.liked_by.filter(id=user.id).exists():
            track.liked_by.remove(user)
            return Response({"detail": "Remove from favourite songs."}, status=status.HTTP_204_NO_CONTENT)
        else:
            track.liked_by.add(user)
            return Response({"detail": "Added to favourite songs."}, status=status.HTTP_201_CREATED)

class MyLikedSongsListView(generics.ListAPIView):
    serializer_class = ShortTrackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.liked_tracks.all().select_related('artist')
    
# For artitsts who want to manage their musics
class ArtistTrackManagementView(generics.ListCreateAPIView):
    permission_classes = [ArtistPermission]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateNewTrackSerializer
        return ShortTrackSerializer
    
    def get_queryset(self):
        return Track.objects.filter(artist=self.request.user.artist_profile)
    
    def perform_create(self, serializer):
        serializer.save(artist=self.request.user.artist_profile)

class ArtistTrackUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = CreateNewTrackSerializer
    permission_classes = [ArtistPermission, IsOwnerUserPermission]
    lookup_field = 'slug'

    def get_queryset(self):
        if hasattr(self.request.user, 'artist_profile'):
            return Track.objects.filter(artist=self.request.user.artist_profile)
        return Track.objects.none()