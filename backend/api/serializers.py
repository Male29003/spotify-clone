from rest_framework import serializers
from .models import *

class SongSerializer(serializers.ModelSerializer):
    class Meta:
        model = Song
        fields = ('id', 'title', 'artist', 'album', 'release_date', 
                  'genre', 'duration', 'cover_image', 'audio_file', 'created_at')
class CreateSongSerializer(serializers.ModelSerializer):
    class Meta:
        model = Song
        fields = ('title', 'artist', 'album', 'release_date', 
                  'genre', 'duration', 'cover_image', 'audio_file')
        
class ArtistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = ('id', 'name', 'bio', 'image', 'created_at')
class CreateArtistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = ('name', 'bio', 'image')


class AlbumSerializer(serializers.ModelSerializer):
    class Meta:
        model = Album
        fields = ('id', 'title', 'artist', 'release_date', 
                  'cover_image', 'created_at')
class CreateAlbumSerializer(serializers.ModelSerializer):
    class Meta:
        model = Album
        fields = ('title', 'artist', 'release_date', 
                  'cover_image')
        

class PlaylistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Playlist
        fields = ('id', 'name', 'user', 'songs', 'created_at')
class CreatePlaylistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Playlist
        fields = ('name', 'user', 'songs')