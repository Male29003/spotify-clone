from rest_framework import serializers
from drf_spectacular.types import OpenApiTypes
from ..models import Artist, FavouriteArtist
from ...music.models import Track
from ...users.api.serializers import ShortUserDetailSerializer

#Artist serializers
class ArtistSerializer(serializers.ModelSerializer):
    user = ShortUserDetailSerializer(read_only=True, many=False)
    track_slug = serializers.SerializerMethodField(read_only=True)
    listeners = serializers.IntegerField(source="get_listeners", read_only=True)

    class Meta:
        model = Artist
        fields = [
            "id",
            "user",
            "username",
            "firt_name",
            "last_name",
            "image",
            "slug",
            "listeners",
            "is_verify",
        ]
        extra_kwargs = {
            "is_verify": {"read_only": True}
        }

class ShortArtistSerializer(ArtistSerializer):
    class Meta:
        model = Artist
        fields = [
            "id",
            "username",
            "slug",
            "image",
            "is_verify",
        ]

class UpdateImageArtistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = ("image",)

class UpdateArtistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = [
            "username",
            "slug",
            "is_verify",
        ]

class FavouriteArtistSerializer(serializers.ModelSerializer):
    artist = ShortArtistSerializer(read_only=True, many=False)
    class Meta:
        model = Artist
        fields = [
            "id",
            "artist",
            "created_at",
            "updated_at"
        ]