from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework.views import APIView
from ..models import Artist, FavoriteArtist, ArtistAlbum, ArtistTrack
from .serializers import ArtistSerializer, FavoriteArtistSerializer, ArtistAlbumSerializer, ArtistTrackSerializer

# Create your views here.