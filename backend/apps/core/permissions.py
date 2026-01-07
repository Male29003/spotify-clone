from django.contrib.auth import get_user_model
from rest_framework import permissions
from ..users.models import TYPE_PROFILE

User = get_user_model()
""" Check if user has which permissions:
    1. Normal user (Already had an account)
    2. Artist
    3. Premium user
    4. User has no account
    5. Users have permision with their own info: playlists, fav album, ....
"""

# Normal user permission
class UserPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated:
             return request.user.type == TYPE_PROFILE.user
        return False
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(obj, "user") and obj.user == request.user
    
# Artist permission
class ArtistPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated:
             return request.user.type == TYPE_PROFILE.artist
        return False
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(obj, "user") and obj.artist.user == request.user
    
# Premium user permission
class PremiumUserPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated:
            return request.user.is_premium
        return False
    
# User has no account permision
class CurrentUserOrReadOnlyPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(obj, "user") and obj == request.user
    
# Users have permision with their own info
class IsOwnerUserPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(obj, "user") and obj.user == request.user or obj.artist.user == request.user

# Admin
class AdminPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.is_staff