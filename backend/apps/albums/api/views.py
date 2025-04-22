from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework.views import APIView
from ..models import Album, FavoriteAlbum
from .serializers import AlbumSerializer, FavoriteAlbumSerializer
# from apps.albums.models import Album, FavoriteAlbum