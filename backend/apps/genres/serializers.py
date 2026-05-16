from rest_framework import serializers
from .models import Genre
from ..core.models import R2ImageField
from ..core.validators import check_file_security

# genre serializers
class ShortGenreSerializer(serializers.ModelSerializer):
    image = R2ImageField(required=False, allow_null=True)

    class Meta:
        model = Genre
        fields = [
            'id', 
            'name',
            'slug',
            'image',
        ]

# Cho admin
class GenreSerializer(ShortGenreSerializer):
    total_tracks = serializers.IntegerField(source="get_total_tracks", read_only=True)

    class Meta(ShortGenreSerializer.Meta):
        fields = ShortGenreSerializer.Meta.fields + [
            "description",
            "is_active",
            "total_tracks",
            "created_at",
            "updated_at",
        ]

# Cho listener
class ListenerGenreDetailSerializer(ShortGenreSerializer):
    top_tracks = serializers.SerializerMethodField()
    
    class Meta(ShortGenreSerializer.Meta):
        fields = ShortGenreSerializer.Meta.fields + [
            "description",
            "top_tracks",
        ]

    def get_top_tracks(self, obj):
        from apps.music.serializers import ListenerDetailTrackSerializer

        tracks = obj.tracks.filter(
            is_active=True,
            is_blocked=False,
            release__is_active=True,
            release__is_blocked=False,
        ).order_by('-listens')[:10]

        return ListenerDetailTrackSerializer(tracks, many=True, context=self.context).data