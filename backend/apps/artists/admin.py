from django.contrib import admin
from .models import Artist, FavouriteArtist, ArtistVerificationRequest

# Register your models here.
@admin.register(Artist)
class ArtistAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "stage_name", "image", "is_verify"]
    list_display_links = ["id", "user", "stage_name"]
    list_editable = ["is_verify"]
    list_filter = ["is_verify"]

@admin.register(FavouriteArtist)
class FavoriteArtistAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "artist", "created_at")
    list_display_links = ("id", "user", "artist")
    list_filter = ("created_at",)
    search_fields = ("user__username", "artist__stage_name")


@admin.register(ArtistVerificationRequest)
class ArtistVerificationRequestAdmin(admin.ModelAdmin):
    list_display = ["id", "artist", "is_processed", "created_at", "updated_at"]
    list_display_links = ["id", "artist"]

