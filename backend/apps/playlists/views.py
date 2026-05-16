from rest_framework import generics, permissions, filters, status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Playlist, FavouritePlaylist
from . import serializers
from ..core.permissions import IsOwnerUserPermission
from django.shortcuts import get_object_or_404
from ..music.models import Track

# GET method for all users
class PlaylistListView(generics.ListAPIView):
    queryset = Playlist.objects.all().filter(is_private=False).select_related('user')
    serializer_class = serializers.PlaylistSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['user', 'created_at']
    search_fields = ['title', 'user__username']
    ordering_fields = ['-created_at', 'title']

class PlaylistDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Playlist.objects.select_related('user').prefetch_related('tracks')
    permission_classes = [permissions.IsAuthenticated, IsOwnerUserPermission]
    
    # Xài cái Serializer mới tạo ở trên khi update
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH'] and not self.request.data.get('action'):
            return serializers.PlaylistCreateUpdateSerializer
        return serializers.PlaylistSerializer

    lookup_field = 'slug'

    # ĐÃ FIX: Chặn người lạ xem Playlist Private
    def get_object(self):
        obj = super().get_object()
        if obj.is_private and obj.user != self.request.user:
            raise PermissionDenied("Playlist này là riêng tư. Bạn không có quyền truy cập.")
        return obj
    
    def patch(self, request, *args, **kwargs):
        playlist = self.get_object()
        track_id = request.data.get('track_id')
        action = request.data.get('action')
        
        if track_id and action:
            try:
                track = Track.objects.get(
                    id=track_id, 
                    is_active=True, 
                    is_blocked=False,
                    artist__is_active=True, 
                    artist__is_blocked=False
                )
                if action == 'add_remove_track':
                    if playlist.tracks.filter(id=track_id).exists():
                        playlist.tracks.remove(track)
                        return Response({
                            "detail": "Successfully remove from Playlist."
                        }, status=status.HTTP_200_OK)
                    else:
                        playlist.tracks.add(track)
                        return Response({
                            "detail": "Successfully add to Playlist."
                        }, status=status.HTTP_200_OK)
            except Track.DoesNotExist:
                return Response({
                    "detail": "Song is not existed or blocked."
                }, status=status.HTTP_404_NOT_FOUND)
        print("📥 DATA FE GỬI LÊN (request.data):", request.data)
        
        # Chặn lỗi của Serializer để in ra
        serializer = self.get_serializer(playlist, data=request.data, partial=True)
        if not serializer.is_valid():
            print("❌ LỖI SERIALIZER CHỬI:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        return super().patch(request, *args, **kwargs)
        
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
    permission_classes = [permissions.IsAuthenticated]

    # ĐÃ FIX: GET thì trả về Short, POST thì xài CreateUpdate
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return serializers.PlaylistCreateUpdateSerializer
        return serializers.PlaylistSerializer

    def get_queryset(self):
        return Playlist.objects.filter(user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class MyFavouritePlaylistListView(generics.ListAPIView):
    serializer_class = serializers.FavouritePlaylistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return FavouritePlaylist.objects.filter(user=user).select_related('playlist').order_by('-created_at')
