from rest_framework import serializers
from ...artists.api.serializers import ShortArtistSerializer
from ...albums.api.serializers import ShortAlbumSerializer
from ..models import Track
from ...albums.models import Album
from ...genres.models import Genre
from ...artists.models import Artist
from ...genres.api.serializers import GenreSerializer

#Song serializers
class TrackSerializer(serializers.ModelSerializer):
    artist = ShortArtistSerializer(read_only=True, many=False)
    genre = GenreSerializer(read_only=True)
    album = ShortAlbumSerializer(read_only=True, many=False)
    likes_count = serializers.IntegerField(source='liked_by.count', read_only=True)

    class Meta: 
        model = Track
        fields =[
            "id",
            "title",
            "artist",
            "genre",
            "duration",
            "image",
            "slug",
            "album",
            "file_url",
            "listens",
            "downloads",
            "likes_count",
            "is_premium_only",
            "release_date",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "listens": {"read_only": True},
            "downloads": {"read_only": True},
            "likes_count": {"read_only": True},
            "duration": {"read_only": True},
        }

class ShortTrackSerializer(TrackSerializer):
    class Meta:
        model = Track
        fields = [
            "id",
            "title",
            "artist",
            "album",
            "genre",
            "duration",
            "likes_count",
            "listens"
        ]

class CreateNewTrackSerializer(serializers.ModelSerializer):
    album = serializers.PrimaryKeyRelatedField(
        queryset=Album.objects.all(),
        required=False
    )
    genre = serializers.PrimaryKeyRelatedField(
        queryset=Genre.objects.all()
    )
    artist = serializers.PrimaryKeyRelatedField(
        queryset=Artist.objects.all()
    )

    class Meta:
        model = Track
        fields = [
            "title",
            "artist",
            "album",
            "genre",
            "image",
            "file_url",
            "preview_file",
            "is_premium_only",
            "release_date",
        ]