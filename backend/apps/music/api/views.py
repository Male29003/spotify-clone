from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework.views import APIView
from ..models import Song, FavoriteSong
from .serializers import SongSerializer, FavoriteSongSerializer

# Create your views here.