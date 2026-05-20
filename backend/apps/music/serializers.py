from django.apps import apps
from rest_framework import serializers
from ..artists.serializers import ShortArtistSerializer
from .models import Track
from ..genres.serializers import GenreSerializer
from ..core.models import R2ImageField
from ..core.validators import check_file_security
from django.core.files.base import ContentFile
from apps.releases.models import Release

class ShortTrackSerializer(serializers.ModelSerializer):
    artist = ShortArtistSerializer(read_only=True, many=False)
    file_url = serializers.CharField()
    preview_file = serializers.CharField()
    image = R2ImageField(source='release.image', read_only=True)
    release_short_id = serializers.CharField(source='release.short_id', read_only=True)

    class Meta:
        model = Track
        fields = [
            "id",
            "short_id",
            "release_short_id",
            "title",
            "artist",
            "image",
            "file_url",
            "preview_file",
            "lyrics_file",
            "duration",
            "is_blocked",
            "is_active",
            "order_index"
        ]
  
# ===============================================  Listener  ===================================
# Cho listener - trang home, trang profile của artist, trang search
class ListenerTrackSerializer(ShortTrackSerializer):
    is_favourite = serializers.SerializerMethodField()
    class Meta(ShortTrackSerializer.Meta):
        fields = ShortTrackSerializer.Meta.fields + [
            "is_premium_only",
            "is_favourite",
        ]
      
    def get_is_favourite(self, obj):
        if hasattr(obj, 'is_favourited'):
            return obj.is_favourited
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return obj.liked_by.filter(id=request.user.id).exists()
        return False
    
# Lấy chi tiết cho trang Detail ở listener
class ListenerDetailTrackSerializer(ListenerTrackSerializer):
    class Meta(ListenerTrackSerializer.Meta):
        fields = ListenerTrackSerializer.Meta.fields + [
            "id",
            "slug",
            "listens",
            "downloads",
        ]

# ===============================================  Artist  ===================================
# dành cho artist muốn quản lý track - chỉ cho release nào còn ở draft
class TrackSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    preview_file = serializers.SerializerMethodField()
    image = R2ImageField(source='release.image', read_only=True)
    lyrics_file = serializers.SerializerMethodField()
    lyrics = serializers.FileField(write_only=True, required=False, allow_null=True)
    release = serializers.PrimaryKeyRelatedField(
        queryset=Release.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Track
        fields = '__all__'
        extra_kwargs = {
            "listens": {"read_only": True},
            "downloads": {"read_only": True},
            "duration": {"read_only": True},
        }

    def get_file_url(self, obj):
        if not obj.file_url:
            return None
        url_string = str(obj.file_url)
        # Kiểm tra: Nếu đã là link ngoài (iTunes, Spotify, Cloud...) thì giữ nguyên
        if url_string.startswith('http://') or url_string.startswith('https://'):
            return url_string
        # Nếu là file trong máy (Local) thì mới gắn http://localhost:8000/media/ vào
        request = self.context.get('request')
        if request and hasattr(obj.file_url, 'url'):
            return request.build_absolute_uri(obj.file_url.url)
        return url_string
    
    def get_lyrics_file(self, obj):
        if not obj.lyrics_file:
            return None
        url_string = str(obj.lyrics_file)
        if url_string.startswith('http'):
            return url_string
        request = self.context.get('request')
        if request and hasattr(obj.lyrics_file, 'url'):
            return request.build_absolute_uri(obj.lyrics_file.url)
        return url_string
    
    def get_preview_file(self, obj):
        if not obj.preview_file:
            return None
        url_string = str(obj.preview_file)
        if url_string.startswith('http://') or url_string.startswith('https://'):
            return url_string
        request = self.context.get('request')
        if request and hasattr(obj.preview_file, 'url'):
            return request.build_absolute_uri(obj.preview_file.url)
        return url_string

    def update(self, instance, validated_data):
        print("Validated data in TrackSerializer update:", validated_data)
        print("Initial data in TrackSerializer update:", self.initial_data)
        if 'lyrics' in validated_data:
            new_file = validated_data.pop('lyrics')
            # Xóa file cũ để dọn rác
            if instance.lyrics_file:
                instance.lyrics_file.delete(save=False)
            # Gán thẳng file mới
            instance.lyrics_file = new_file
        if 'release' in self.initial_data:
            req_release = self.initial_data.get('release')
            if req_release in ['null', 'undefined', '', None]:
                validated_data['release'] = None
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        response = super().to_representation(instance)
        if instance.genre and instance.genre.is_active:
            response['genre'] = GenreSerializer(instance.genre, context=self.context).data
        else:
            response['genre'] = None
        return response
    
class CreateNewTrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = [
             "id",
             "title",
             "genre",
             "file_url",
             "is_premium_only",
        ]

    def validate_file_url(self, value):
        # File nhạc cho phép 50MB
        return check_file_security(
            value,
            max_size_mb=50, 
            allowed_extensions=['.mp3', '.wav', '.flac']
        )

# ===============================================  Admin  ===================================
# xem track
class AdminTrackSerializer(ShortTrackSerializer):
    genre = serializers.CharField(source='genre.name', read_only=True, default=None)
    release_title = serializers.CharField(source='release.title', read_only=True, default=None)
    class Meta(ShortTrackSerializer.Meta):
        fields = ShortTrackSerializer.Meta.fields + [
            'genre',
            "block_note",
            "block_reason",
            "release_title",
            "listens",
            "downloads"
        ]

# admin muốn block/ unblock 1 track
class AdminBlockTrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = [
            "is_blocked",
            "block_reason",
        ]
    