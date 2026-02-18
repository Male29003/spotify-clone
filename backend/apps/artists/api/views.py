from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from ..models import Artist, FavouriteArtist
from .serializers import ArtistSerializer, ShortArtistSerializer, FavouriteArtistSerializer, UpdateArtistSerializer, UpdateImageArtistSerializer
from ...core.permissions import ArtistPermission

class ArtistListView(generics.ListAPIView):
    queryset = Artist.objects.all().select_related('user')
    serializer_class = ArtistSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['stage_name']
    filterset_fields = ['created_at', 'is_verify']

class ArtistDetailView(generics.RetrieveAPIView):
    queryset = Artist.objects.all().select_related('user')
    serializer_class = ArtistSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

# Follow artist handling function
class FavouriteArtistToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        artist = generics.get_object_or_404(Artist, slug=slug)
        user = request.user
        favourite_artist = FavouriteArtist.objects.filter(user=user, artist=artist)

        if favourite_artist.exists():
            favourite_artist.delete()
            return Response({"detail": "Artist removed from favourite list."}, status=status.HTTP_204_NO_CONTENT)
        else:
            FavouriteArtist.objects.create(user=user, artist=artist)
            return Response({"detail": "Artist added to favourite list."}, status=status.HTTP_201_CREATED)
        
class MyFavouriteAritistListView(generics.ListAPIView):
    serializer_class = FavouriteArtistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FavouriteArtist.objects.filter(user=self.request.user).select_related('artist')
    
# For artists to manage their profile
class ArtistProfileUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = UpdateArtistSerializer
    permission_classes = [ArtistPermission]

    def get_object(self):
        user = self.request.user
        return generics.get_object_or_404(Artist, user=user)
    
class ArtistImageUpdateView(generics.UpdateAPIView):
    serializer_class = UpdateImageArtistSerializer
    permission_classes = [ArtistPermission]

    def get_object(self):
        user = self.request.user
        return generics.get_object_or_404(Artist, user=user)

