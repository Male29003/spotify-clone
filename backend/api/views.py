from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import *
from .serializers import *

# Create your views here.

class SongList(generics.ListAPIView):
    queryset = Song.objects.all()
    serializer_class = SongSerializer
class CreateSongView(APIView):
    queryset = Song.objects.all()
    serializer_class = CreateSongSerializer
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ArtistList(generics.ListCreateAPIView):
    queryset = Artist.objects.all()
    serializer_class = ArtistSerializer

class AlbumList(generics.ListCreateAPIView):    
    queryset = Album.objects.all()
    serializer_class = AlbumSerializer


class CreateAlbumView(APIView):
    queryset = Album.objects.all()
    serializer_class = CreateAlbumSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
class PlaylistList(generics.ListCreateAPIView):
    queryset = Playlist.objects.all()
    serializer_class = PlaylistSerializer

