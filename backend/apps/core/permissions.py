from django.contrib.auth import get_user_model
from rest_framework import permissions
from ..users.models import TYPE_PROFILE
from ..artists.models import Artist

User = get_user_model()
""" Check if user has which permissions:
    1. Normal user
        1.1 (Already had an account)
        1.2 (No account yet)
        1.3 Users have permision with their own info
    2. Artist
    3. Premium user
    4. Admin
"""
# 1.1
class UserPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated:
             return request.user.type == TYPE_PROFILE.user
        return False
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(obj, "user") and obj.user == request.user
    
# 1.2
class CurrentUserOrReadOnlyPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        user_obj = getattr(obj, 'user', None)
        return user_obj == request.user
    
# 1.3
class IsOwnerUserPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        owner = getattr(obj, 'user', None)
        if not owner and hasattr(obj, 'artist'):
            owner = obj.artist.user
        return owner ==  request.user
    
# 2
class ArtistPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated:
             return request.user.type == TYPE_PROFILE.artist
        return False
    
    def has_object_permission(self, request, view, obj):
        # Check nếu obj là chính Artist hoặc các model có link tới Artist (Track, Release)
        artist = getattr(obj, 'artist', obj if isinstance(obj, Artist) else None)
        return artist and artist.user == request.user
    
# 3
class PremiumUserPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated:
            return request.user.is_premium
        return False

# 4
class AdminPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_staff