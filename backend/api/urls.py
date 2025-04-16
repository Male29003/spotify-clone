from django.urls import path
from django.db import models
from .views import *

urlpatterns = [
    path('song', SongList.as_view()),
    path('artist', ArtistList.as_view()),
    path('album', AlbumList.as_view()),
    path('playlist', SongList.as_view()),
]