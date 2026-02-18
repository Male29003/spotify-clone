from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django_countries.serializers import CountryFieldMixin
#User serializers
User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    passwordCP = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'passwordCP', 'country', 'type', 'gender']
        extra_kwargs = {
            'country': {'required': False},
            'type': {'default': 'user'},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['passwordCP']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('passwordCP')
        user = User.objects.create_user(**validated_data)
        return user

class LoginSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        user = authenticate(email=data['email'], password=data['password'])
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Invalid email or password")

    class Meta:
        model = User
        fields = ['email']
        read_only_fields = ['email']

class UserSerializer(CountryFieldMixin, serializers.ModelSerializer):
    """ Serializers display all details of user even you are a normal user or an artist"""
    followers_count = serializers.IntegerField(source='followers.count', read_only=True)
    following_count = serializers.IntegerField(source='following.count', read_only=True)
    type = serializers.CharField(source="get_type_display", read_only=True)
    gender = serializers.CharField(source="get_gender_display", read_only=True)
    artist_slug = serializers.CharField(source="artist.slug", read_only=True)
    playlists_count = serializers.IntegerField(source="playlists.count", read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 
            'email', 
            'username',
            'phone', 
            'profile_picture', 
            'country',
            'gender',
            'type',
            'followers_count',
            'following_count',
            'subscription_plan',
            'is_active',
            'is_premium',
        ]
        read_only_fields = ["email", "type", "is_premium"]

class ShortUserDetailSerializer(UserSerializer):
    class Meta():
        model = User
        fields = [
            'id', 
            'username', 
            'type',
            'is_premium',
            'is_active',
            'followers_count',
            'following_count',
        ]

class UserUpdateSerializer(CountryFieldMixin, serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'username',
            'phone',
            'profile_picture', 
            'country',
        ]
        read_only_fields = ['email', 'phone', 'profile_picture', 'country']


class UserProfilePictureSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("profile_picture",)

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    confirm_new_password = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_new_password']:
            raise serializers.ValidationError("New password and confirm password do not match")
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