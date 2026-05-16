from rest_framework import serializers
from .models import Artist, FavouriteArtist, ArtistVerificationRequest
from ..users.serializers import UserDetailSerializer, ShortUserSerializer, UserDetailSerializer
from ..releases.serializers import ShortReleaseSerializer, AdminReleaseDetailSerializer, AdminShortReleaseSerializer
from ..core.models import R2ImageField
from ..core.validators import check_file_security


class ShortArtistSerializer(serializers.ModelSerializer):
    image = R2ImageField(required=False, allow_null=True)
    banner = R2ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Artist
        fields = [
            "short_id", 
            "stage_name", 
            "slug", 
            "image", 
            "banner",
            "is_verify", 
            "is_active", 
            "is_blocked"
        ]

# dành riêng cho artist để tạo release
class GetArtistForFeaturedInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = [
            "id",
            "stage_name"
        ]

# ===============================================  Listener  ===================================
# Dành cho listenr - trang home là chủ yếu
class ListenerArtistSerializer(ShortArtistSerializer):
    is_favourite = serializers.SerializerMethodField(read_only=True)
    class Meta(ShortArtistSerializer.Meta):
        fields = ShortArtistSerializer.Meta.fields + [
            "id",
            "is_favourite",
        ]
    def get_is_favourite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from .models import FavouriteArtist
            return FavouriteArtist.objects.filter(user=request.user, artist=obj).exists()
        return False
    
# Dành cho listenr - trang xem chi tiết
class ListenerArtistDetailSerializer(ListenerArtistSerializer):
    listens = serializers.IntegerField(source="get_total_listens", read_only=True)
    releases = serializers.SerializerMethodField()

    class Meta(ListenerArtistSerializer.Meta):
        fields = ListenerArtistSerializer.Meta.fields + [
            "releases",
            "listens",
        ]
    
    def get_releases(self, obj):
        from apps.releases.serializers import ListenerReleaseDetailSerializer
        releases = obj.releases.filter(
            is_published=True,
            is_active=True,
            is_blocked=False
        ).order_by('-release_date')
        return ListenerReleaseDetailSerializer(releases, many=True, context=self.context).data

class FavouriteArtistSerializer(serializers.ModelSerializer):
    artist = ShortArtistSerializer(read_only=True, many=False)
    class Meta:
        model = FavouriteArtist
        fields = [
            "artist",
        ]
        

# ===============================================  Artist  ===================================
# Dành cho artist - trang profile của artist
class ArtistProfileUpdateSerializer(ShortArtistSerializer):
    listens = serializers.IntegerField(source="get_total_listens", read_only=True)
    total_releases = serializers.IntegerField(source="get_total_releases", read_only=True)
    followers_count = serializers.IntegerField(source="favourite_by.count", read_only=True)

    class Meta(ShortArtistSerializer.Meta):
        fields = ShortArtistSerializer.Meta.fields + [
            "block_reason",
            "total_releases",
            "listens",
            "followers_count"
        ]
        extra_kwargs = {
            "listens": {"read_only": True},
            "downloads": {"read_only": True},
            "duration": {"read_only": True},
        }

    def update(self, instance, validated_data):
        # Nếu artist đã có ảnh cũ, xóa đi
        if 'image' in validated_data:
            if instance.image:
                instance.image.delete(save=False)
        if 'banner' in validated_data:
            if instance.banner:
                instance.banner.delete(save=False)
        
        return super().update(instance, validated_data)

    def validate_image(self, value):
        return check_file_security(
            value, 
            max_size_mb=5, 
            allowed_extensions=['.png', '.jpg', '.jpeg', '.webp']
        )

    def validate_banner(self, value):
        # Banner cho phép tới 10MB vì nó bự
        return check_file_security(
            value, 
            max_size_mb=10, 
            allowed_extensions=['.png', '.jpg', '.jpeg', '.webp']
        )
    
class AdminVerificationRequestSerializer(serializers.ModelSerializer):
    artist_id = serializers.IntegerField(source='artist.id', read_only=True)
    stage_name = serializers.CharField(source='artist.stage_name', read_only=True)
    user_email = serializers.EmailField(source='artist.user.email', read_only=True)
    image = serializers.ImageField(source='artist.image', read_only=True)
    full_name = serializers.SerializerMethodField()
    document_url = serializers.SerializerMethodField()

    class Meta:
        model = ArtistVerificationRequest
        fields = [
            'id', 'artist_id', 'stage_name', 'user_email', 
            'full_name', 'status', 'created_at', 'image',
            'social_link', 'contact_phone', 'document_url'
        ] 

    def get_full_name(self, obj):
        return f"{obj.artist.user.first_name} {obj.artist.user.last_name}".strip() or obj.artist.user.username

    def get_document_url(self, obj):
        if obj.identity_document:
            return obj.identity_document.url.replace('https://https//', 'https://')
        return None
    
# ===============================================  Admin  ===================================
# Dành cho admin - trang quản lý artist
class AdminArtistSerializer(ShortArtistSerializer):
    user = ShortUserSerializer(read_only=True, many=False)
    listens = serializers.IntegerField(source="get_total_listens", read_only=True)
    followers_count = serializers.IntegerField(read_only=True)
    class Meta(ShortArtistSerializer.Meta):
        fields = ShortArtistSerializer.Meta.fields + [
            "id",
            "user",
            "releases",
            "listens",
            "followers_count",
            "block_reason",
            "block_note",
            "created_at",
            "updated_at"
        ]
        extra_kwargs = {
            "is_verify": {"read_only": True}
        }
    
    def get_releases(self, obj):
        releases = obj.releases.filter(
            is_published=True,
            is_active=True,
        ).order_by('-release_date')
        return AdminShortReleaseSerializer(releases, many=True, context=self.context).data
    
class AdminArtistDetailSerializer(ShortArtistSerializer):
    user = UserDetailSerializer(read_only=True, many=False)
    listens = serializers.IntegerField(source="get_total_listens", read_only=True)
    releases = serializers.SerializerMethodField()

    class Meta(ShortArtistSerializer.Meta):
        fields = ShortArtistSerializer.Meta.fields + [
            "id",
            "user",
            "releases",
            "listens",
            "block_reason",
            "block_note",
            "created_at",
            "updated_at"
        ]
        extra_kwargs = {
            "is_verify": {"read_only": True}
        }
    
    def get_releases(self, obj):
        releases = obj.releases.filter(
            is_published=True,
            is_active=True,
        ).order_by('-release_date')
        return AdminReleaseDetailSerializer(releases, many=True, context=self.context).data
    
# block/unblock artist
class AdminBlockArtistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = [
            "is_blocked",
            "block_reason",
        ]
