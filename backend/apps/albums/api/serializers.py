from rest_framework import serializers
from ..models import Album, FavouriteAlbum

#Album, FavoriteAlbum serializers

class AlbumSerializer(serializers.ModelSerializer):
    """Serializer for Album model."""

    class Meta:
        model = Album
        fields = [
            "id",
            "artist",
            "title",
            "description",
            "image",
            "release_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]
        extra_kwargs = {
            "artist": {"required": True},
            "title": {"required": True},
            "description": {"required": False},
            "image": {"required": False},
            "release_date": {"required": False},
        }

class ShortAlbumSerializer(serializers.ModelSerializer):
    total_tracks = serializers.IntegerField(source="get_total_tracks", read_only=True)
    class Meta:
        model = Album
        fields = [
            "id",
            "title",
            "image",
            "slug",
            "is_private",
            "total_tracks"
        ]

class FavouriteAlbumSerializer(serializers.ModelSerializer):
    album =AlbumSerializer(read_only=True, many=False)
    class Meta: 
        model = FavouriteAlbum
        fields = [
            "id",
            "user",
            "album",
            "created_at",
            "updated_at",
        ]
