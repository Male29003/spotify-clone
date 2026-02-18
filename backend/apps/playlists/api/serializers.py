from ...music.api.serializers import ShortTrackSerializer
from ...music.api.serializers import ShortTrackSerializer
from rest_framework import serializers
from ..models import Playlist, FavouritePlaylist

#Playlist, FavouritePlaylst serializers

class PlaylistSerializer(serializers.ModelSerializer):
    tracks=ShortTrackSerializer(many=True, read_only=True)
    tracks_count=serializers.IntegerField(source='tracks.count', read_only=True)
    
    class Meta:
        model=Playlist
        fields=[
            "user",
            "tracks",
            "title",
            "description",
            "slug",
            "image",
            "is_private"
        ]

class ShortPlaylistSerializer(serializers.ModelSerializer):
    tracks_count=serializers.IntegerField(source='tracks.count', read_only=True)
    
    class Meta:
        model=Playlist
        fields=[
            "id",
            "title",
            "slug",
            "image",
            "tracks_count"
        ]

class FavouritePlaylistSerializer(serializers.ModelSerializer):
    playlist=PlaylistSerializer(read_only=True)
    
    class Meta:
        model=FavouritePlaylist
        fields=[
            "id",
            "playlist",
            "created_at",
        ]