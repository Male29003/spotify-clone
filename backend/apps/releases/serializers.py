from django.apps import apps
from rest_framework import serializers
from .models import Release, FavouriteRelease
from ..core.models import R2ImageField
from ..core.validators import check_file_security


class ShortReleaseSerializer(serializers.ModelSerializer):
    image = R2ImageField(required=False, allow_null=True)
    artist = serializers.SerializerMethodField()

    class Meta:
        model = Release
        fields = [
            "short_id",
            "title",
            "image",
            "artist",
            "release_type",
        ]

    def get_artist(self, obj):
        from ..artists.serializers import ShortArtistSerializer
        artist = obj.artist
        return ShortArtistSerializer(artist, context=self.context).data

# ===============================================  Listener  ===================================
# Cho listener - trang home, trang profile của artist, trang search
class ListenerReleaseSerializer(ShortReleaseSerializer):
    tracks = serializers.SerializerMethodField()
    is_favourite = serializers.SerializerMethodField()
    
    class Meta(ShortReleaseSerializer.Meta):
        fields = ShortReleaseSerializer.Meta.fields + [
            "id",
            "tracks",
            "is_favourite",
        ]

    def get_is_favourite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favourite_by.filter(user=request.user).exists()
        return False
    
    def get_tracks(self, obj):
        from apps.music.serializers import ListenerDetailTrackSerializer
        tracks_queryset = obj.tracks.filter(
            is_active=True,
            is_blocked=False,
        ).order_by('order_index')
        return ListenerDetailTrackSerializer(tracks_queryset, many=True, context=self.context).data
    
# Dành cho listenr - trang chi tiết release
class ListenerReleaseDetailSerializer(ListenerReleaseSerializer):
    total_tracks = serializers.IntegerField(source="get_total_tracks", read_only=True)
    total_listens = serializers.IntegerField(source="get_total_listens", read_only=True)

    class Meta(ListenerReleaseSerializer.Meta):
        fields = ListenerReleaseSerializer.Meta.fields + [
            "description",
            "release_date",
            "total_tracks",
            "total_listens",
        ]

class FavouriteReleaseSerializer(serializers.ModelSerializer):
    release =ShortReleaseSerializer(read_only=True, many=False)
    class Meta: 
        model = FavouriteRelease
        fields = [
            "release",
        ]

    
# ===============================================  Artist  ===================================
# Dành cho artist muốn chỉnh sửa 
class ReleaseDetailSerializer(ShortReleaseSerializer):
    tracks = serializers.SerializerMethodField()
    total_tracks = serializers.IntegerField(source="get_total_tracks", read_only=True)
    total_listens = serializers.IntegerField(source="get_total_listens", read_only=True)

    class Meta(ShortReleaseSerializer.Meta):
        fields = ShortReleaseSerializer.Meta.fields + [
            "id",
            "description",
            "tracks",
            'image',
            "release_date",
            "total_tracks",
            "block_note",
            "block_reason",
            "reject_reason",
            "reject_note",
            "total_listens",
            "is_active",
            "is_pending",
            "is_published",
            "is_blocked",
        ]
        read_only_fields = [
            "id", 
            "artist",
        ]
    
    def get_tracks(self, obj):
        from apps.music.serializers import TrackSerializer
        tracks_queryset = obj.tracks.all().order_by('order_index') 
        return TrackSerializer(tracks_queryset, many=True, context=self.context).data

    def update(self, instance, validated_data):
        if 'image' in validated_data:
            if instance.image:
                instance.image.delete(save=False)
        return super().update(instance, validated_data)

    def validate_image(self, value):
        return check_file_security(
            value, 
            max_size_mb=5, 
            allowed_extensions=['.png', '.jpg', '.jpeg', '.webp']
        )

class ReleaseToggleActiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Release
        fields = [
            'is_active',
        ]

# ===============================================  Admin  ===================================
# Xem danh sách release cơ bản
class AdminShortReleaseSerializer(ShortReleaseSerializer):
    total_tracks = serializers.IntegerField(source="get_total_tracks", read_only=True)
    total_listens = serializers.IntegerField(source="get_total_listens", read_only=True)

    class Meta(ShortReleaseSerializer.Meta):
        fields = ShortReleaseSerializer.Meta.fields + [
            "id",
            "total_tracks",
            "total_listens",
            "is_active",
            "is_published",
            "is_blocked",
            "is_pending",
        ]
        
class AdminReleaseDetailSerializer(AdminShortReleaseSerializer):
    tracks = serializers.SerializerMethodField()

    class Meta(AdminShortReleaseSerializer.Meta):
        fields = AdminShortReleaseSerializer.Meta.fields + [
            "block_note",
            "block_reason",
            "reject_reason",
            "reject_note",
            "tracks"
        ]
    
    def get_tracks(self, obj):
        from apps.music.serializers import TrackSerializer
        tracks_queryset = obj.tracks.all().order_by('order_index')
        return TrackSerializer(tracks_queryset, many=True, context=self.context).data

# Admin mblock / unblock
class AdminBlockReleaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Release
        fields = [
            "is_blocked",
            "block_reason",
        ]
class AdminPendingReleaseSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source='artist.stage_name', read_only=True)
    image = R2ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Release
        fields = [
            'short_id', 
            'title', 
            'image', 
            'release_type', 
            'artist_name', 
            'created_at'
        ]

# Admin mblock / unblock
class AdminPublishReleaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Release
        fields = [
            "is_published",
        ]