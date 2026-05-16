from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django_countries.serializers import CountryFieldMixin
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.core.cache import cache
from ..users.models import Notification
from ..core.models import R2ImageField
from ..core.validators import check_file_security

#User serializers
User = get_user_model()

# ====================================== Auth ======================================
# Custom Login JWT
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        email = attrs.get('email')
        # Kiểm tra xem User có bị khóa tài khoản hoàn toàn không
        try:
            user = User.objects.get(email=email)
            if not user.is_active:
                raise serializers.ValidationError({
                    "detail": "Your account is blocked!"
                })
        except User.DoesNotExist:
            pass # bỏ qua TH bị block - ktra thông tin đăng nhập như bth
            
        # xác thực mật khẩu mặc định của JWT
        data = super().validate(attrs)
        
        # thông tin vào Token trả về FE
        data['type'] = self.user.type
        data['is_staff'] = self.user.is_staff
        data['is_superuser'] = self.user.is_superuser
        data['is_active'] = self.user.is_active
        
        return data
# Đăng ký
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    passwordCP = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'email', 
            'username',
            'password', 
            'passwordCP', 
            'country', 
            'type', 
            'gender'
        ]
        extra_kwargs = {
            'country': {'required': False},
            'type': {'default': 'user'},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['passwordCP']:
            raise serializers.ValidationError({"password": "Confirm passwords does not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('passwordCP')
        validated_data.pop('phone', None)
        user = User.objects.create_user(**validated_data)
        user.is_active = False
        user.save()
        return user
    
# Đổi mk
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True) 
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    confirm_new_password = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_new_password']:
            raise serializers.ValidationError("Confirm password does not match.")
        return data

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect")
        return value
    
    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


# ====================================== Chung ======================================
class ShortUserSerializer(CountryFieldMixin, serializers.ModelSerializer):
    profile_picture = R2ImageField(required=False, allow_null=True)
    rejected = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'country',
            'rejected',
            'type', 
            'profile_picture',
        ]
        
    def get_rejected(self, obj):
        latest_request = obj.verification_requests.order_by('-created_at').first()
        if latest_request and latest_request.status == 'rejected':
            return latest_request.reject_reason
        return None

# Thông tin chi tiết của user
class UserDetailSerializer(ShortUserSerializer):    
    subscription_plan = serializers.SerializerMethodField()
    playlists_count = serializers.IntegerField(source="playlists.count", read_only=True)
    following_count = serializers.IntegerField(source='get_following_count', read_only=True)
    followers_count = serializers.IntegerField(source='get_followers_count', read_only=True)
    
    class Meta(ShortUserSerializer.Meta):
        fields = ShortUserSerializer.Meta.fields + [
            'first_name',
            'last_name',
            'phone', 
            'gender', 
            "subscription_plan",
            "playlists_count",
            'date_joined',        
            'following_count',
            'followers_count',
            'role_permissions',
            'rejected',
            'is_premium',
            'is_staff',
            'is_superuser',
        ]
        read_only_fields = [
            "email", 
            "type", 
            "is_premium", 
            "is_staff", 
            "date_joined",
            "role_permissions", 
            "is_superuser"
        ]

    def get_subscription_plan(self, obj):
        if obj.is_premium:
            sub = getattr(obj, 'subscription', None)
            return sub.plan.name if sub else "Premium"
        if obj.is_staff:
            return "Admin"
        return "Free"

# User có thể update 1 số thông tin của mình
class UserUpdateSerializer(CountryFieldMixin, serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'email',
            'first_name', 
            'last_name',
            'username',
            'phone',
            'type',
            'profile_picture', 
            'gender', 
            'country'
        ]
        read_only_fields = [
            "type",
            "email"
        ]
    def validate_phone(self, value):
        if not value or str(value).strip() == "":
            return None
        return value
    
    def update(self, instance, validated_data):
        if 'profile_picture' in validated_data:
            new_picture = validated_data.get('profile_picture')

            if not new_picture:
                if instance.profile_picture and instance.profile_picture.name != 'default/profile.jpeg':
                    instance.profile_picture.delete(save=False)
                validated_data['profile_picture'] = 'default/profile.jpeg'
            elif new_picture and instance.profile_picture and instance.profile_picture.name != 'default/profile.jpeg':
                instance.profile_picture.delete(save=False)

        return super().update(instance, validated_data)

    def validate_profile_picture(self, value):
        # Tránh lỗi khi user xóa ảnh (chuyển về default)
        if isinstance(value, str) and value == 'default/profile.jpeg':
            return value
        return check_file_security(
            value, 
            max_size_mb=5, 
            allowed_extensions=['.png', '.jpg', '.jpeg', '.webp']
        )

# đổi mk
class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        # Kiểm tra xem email có trong DB chưa
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email này không tồn tại trong hệ thống!")
        return value

class ResendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email này không tồn tại trong hệ thống!")
        return value

# Gác cổng cho bước Reset Password
class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True) # THÊM DÒNG NÀY VÀO
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    confirm_new_password = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        # Check pass khớp nhau
        if data['new_password'] != data['confirm_new_password']:
            raise serializers.ValidationError({"confirm_new_password": "Mật khẩu xác nhận không khớp."})
            
        # Kiểm tra thêm xem email này có tồn tại trong hệ thống không
        if not User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Email không tồn tại trong hệ thống."})
            
        return data
    
class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True, max_length=6)

    def validate(self, data):
        cached_otp = cache.get(f"otp_{data['email']}")
        if not cached_otp:
            raise serializers.ValidationError({"otp": "Mã OTP đã hết hạn. Vui lòng gửi lại."})
        if cached_otp != data['otp']:
            raise serializers.ValidationError({"otp": "Mã OTP không chính xác."})
        return data

# ====================================== artist ======================================
class ArtistDetailProfileSerializer(ShortUserSerializer):
    artist_short_id = serializers.SerializerMethodField()
    artist_is_blocked = serializers.SerializerMethodField()
    artist_block_reason = serializers.SerializerMethodField()

    class Meta(UserDetailSerializer.Meta):
        fields = UserDetailSerializer.Meta.fields + [
            'artist_short_id',
            'artist_is_blocked',
            'artist_block_reason',
        ]
    
    def get_artist_short_id(self, obj):
        return obj.artist_profile.short_id if hasattr(obj, 'artist_profile') else None

    def get_artist_is_blocked(self, obj):
        return obj.artist_profile.is_blocked if hasattr(obj, 'artist_profile') else False

    def get_artist_block_reason(self, obj):
        if hasattr(obj, 'artist_profile') and obj.artist_profile.block_reason:
            return obj.artist_profile.get_block_reason_display()
        return ""

#============================================ For admin ============================================ 
class AdminUserSerializer(ShortUserSerializer):
    class Meta(ShortUserSerializer.Meta):
        fields = ShortUserSerializer.Meta.fields + [
            "is_active",
        ]

class AdminDetailUserSerializer(UserDetailSerializer):
    class Meta(UserDetailSerializer.Meta):
        fields = UserDetailSerializer.Meta.fields + [
            'first_name',
            'last_name',
            "is_active",
        ]

# Admin update role cho user
class AdminUpdateRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'type',
            'role_missions',
            'is_staff'
        ]

# Admin khóa Account
class AdminToggleStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'is_active',
            'block_reason'
        ]
# dành cho quản lý staff
class AdminStaffSerializer(serializers.ModelSerializer):
    profile_picture = R2ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            'id', 
            'username', 
            'email', 
            'first_name', 
            'last_name', 
            'is_staff', 
            'is_superuser', 
            'is_active', 
            'date_joined', 
            'profile_picture',
            'role_permissions'
        ]
        read_only_fields = [
            'id', 
            'date_joined',
            'is_superuser', 
        ]
    
    def update(self, instance, validated_data):
        if 'profile_picture' in validated_data:
            new_picture = validated_data.get('profile_picture')

            if not new_picture:
                if instance.profile_picture and instance.profile_picture.name != 'default/profile.jpeg':
                    instance.profile_picture.delete(save=False)
                validated_data['profile_picture'] = 'default/profile.jpeg'
            elif new_picture and instance.profile_picture and instance.profile_picture.name != 'default/profile.jpeg':
                instance.profile_picture.delete(save=False)

        return super().update(instance, validated_data)

    def validate_profile_picture(self, value):
        # Tránh lỗi khi user xóa ảnh (chuyển về default)
        if isinstance(value, str) and value == 'default/profile.jpeg':
            return value
        return check_file_security(
            value, 
            max_size_mb=5, 
            allowed_extensions=['.png', '.jpg', '.jpeg', '.webp']
        )


# ==========================================================================================
# -------------------------------- Phần dành cho thông báo --------------------------------
# ==========================================================================================
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 
            'title', 
            'message', 
            'is_read', 
            'metadata',
            'created_at'
        ]
