from ..music.serializers import ShortTrackSerializer, ListenerDetailTrackSerializer
from rest_framework import serializers
from .models import Playlist, FavouritePlaylist
from ..core.models import R2ImageField
from ..core.validators import check_file_security

# chung
class ShortPlaylistSerializer(serializers.ModelSerializer):
    image = R2ImageField(required=False, allow_null=True)
    class Meta:
        model=Playlist
        fields=[
            "title",
            "slug",
            "image",
        ]

# chi tiết playlist
class PlaylistSerializer(ShortPlaylistSerializer):
    tracks=serializers.SerializerMethodField()
    tracks_count=serializers.IntegerField(source='tracks.count', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True) 
    owner_name = serializers.CharField(source='user.username', read_only=True)

    class Meta(ShortPlaylistSerializer.Meta):
        model=Playlist
        fields = ShortPlaylistSerializer.Meta.fields + [
            "id",
            "user_id",
            "owner_name",
            "tracks",
            "description",
            "tracks_count",
            "is_private"
        ]

    def get_tracks(self, obj):
        active_tracks = obj.tracks.filter(
            is_active=True,
            is_blocked=False,
            artist__is_active=True, # Nghệ sĩ đang hoạt động
            artist__is_blocked=False, # Nghệ sĩ không bị block
            release__is_published=True, # Release không bị xóa
            release__is_blocked=False
        )
        print(f"👉 [DEBUG PLAYLIST] Số track qua ải: {active_tracks.count()}")
        return ListenerDetailTrackSerializer(active_tracks, many=True, context=self.context).data

# tạo playlist mới
class PlaylistCreateUpdateSerializer(ShortPlaylistSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    class Meta(ShortPlaylistSerializer.Meta):
        fields = ShortPlaylistSerializer.Meta.fields + [
            'title', 
            'description', 
            'image', 
            'is_private'
        ]
    
    def to_internal_value(self, data):
        # Tạo bản copy để có thể chỉnh sửa dữ liệu Frontend gửi lên
        mutable_data = data.copy() if hasattr(data, 'copy') else data
        # Nếu FE gửi lên chuỗi rỗng -> Chuyển thành None để báo xóa ảnh
        if mutable_data.get('image') == '':
            mutable_data['image'] = None
            
        return super().to_internal_value(mutable_data)

    def update(self, instance, validated_data):
        # Kiểm tra xem Frontend có truyền trường 'image' lên không
        if 'image' in validated_data:
            new_image = validated_data.get('image')
            old_image = instance.image

            # XỬ LÝ TRƯỜNG HỢP 2 & 3: Nếu playlist đang có ảnh cũ 
            # VÀ ảnh mới khác ảnh cũ (hoặc new_image là None do user muốn xóa)
            if old_image and old_image != new_image:
                # Lệnh này gọi thẳng vào django-storages để dọn rác trên R2
                old_image.delete(save=False) 
        
        # Gọi hàm gốc để Django tự làm nốt việc lưu DB và upload file mới (Trường hợp 1 & 2)
        return super().update(instance, validated_data)

    def validate_image(self, value):
        return check_file_security(
            value,
            max_size_mb=5,
            allowed_extensions=['.png', '.jpg', '.jpeg', '.webp']
        )

class FavouritePlaylistSerializer(serializers.ModelSerializer):
    playlist=PlaylistSerializer(read_only=True)
    
    class Meta:
        model=FavouritePlaylist
        fields=[
            "playlist",
        ]
