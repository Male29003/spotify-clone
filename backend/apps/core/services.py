from django.core.exceptions import ValidationError
import os

    # Upload các file về User
def get_path_upload_image_user(instance, filename):
    return os.path.join("users", str(instance), filename)

    # Upload các file về Artist
def get_path_upload_image_artist(instance, filename):
    return os.path.join("artists", f"{str(instance.slug)}", filename)

    # Upload các file về Genre
def get_path_upload_image_genre(instance, filename):
    return os.path.join("genres", f"{str(instance.slug)}", filename)

    # Upload các file về Album
def get_path_upload_image_album(instance, filename):
    return os.path.join("albums", f"{str(instance.slug)}", filename)

    # Upload các file về Playlist
def get_path_upload_image_playlist(instance, filename):
    return os.path.join("playlists", f"{str(instance.slug)}", filename)

    # Upload các file về Track       
def get_path_upload_image_track(instance, filename):
    return os.path.join("tracks", f"{instance.slug}", "images", filename)
def get_path_upload_audio_track(instance, filename):
    return os.path.join("tracks", f"{instance.slug}", "audio", filename)
def get_path_upload_video_track(instance, filename):
    return os.path.join("tracks", f"{instance.slug}", "video", filename)

# Validate file size

def validate_image_size(file):
    mb_limit = 5
    if file.size > mb_limit * 1024 * 1024:
        raise ValidationError(f"File size exceeds {mb_limit}MB limit.")
    return True

def validate_audio_size(file):
    mgb_limit = 10
    if file.size > mgb_limit * 1024 * 1024:
        raise ValidationError(f"File size exceeds {mgb_limit}MB limit.")
    return True

def validate_video_size(file):
    mgb_file = 500
    if file.size > mgb_file * 1024 * 1024:
        raise ValidationError(f"File size exceeds {mgb_file}MB limit.")
    return True