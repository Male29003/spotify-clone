from rest_framework import serializers
from ...artists.api.serializers import ShortArtistSerializer
from ...albums.api.serializers import ShortAlbumSerializer
from ..models import Track
from ...albums .models import Album
from ...genres.models import Genre
from ...genres.api.serializers import GenreSerializer

#Song serializers
class TrackSerializer(serializers.ModelSerializer):
    artist = ShortArtistSerializer(read_only=True, many=False)
    genre = GenreSerializer(read_only=True)
    album = ShortAlbumSerializer(read_only=True, many=False)

    class Meta: 
        modell = Track
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
            "likes",
            "liked_by",
            "is_private",
            "release_date",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "listens": {"read_only": True},
            "downloads": {"read_only": True},
            "likes": {"read_only": True},
            "liked_by": {"read_only": True},
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
            "likes",
            "listens"
        ]

class CreateNewTrackSerializer(TrackSerializer):
    album = serializers.PrimaryKeyRelatedField(
        queryset=Album.objects.all(),
        required=False
    )
    genre = serializers.PrimaryKeyRelatedField(
        queryset=Genre.objects.all()
    )