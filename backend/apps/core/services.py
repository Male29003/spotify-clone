from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
import os, time
import uuid

# Import thư viện mã hóa
from cryptography.fernet import Fernet
from django.conf import settings

# ==========================================
# HÀM MÃ HÓA BẢO MẬT (DRM-LITE)
# ==========================================
def get_encryption_key():
    return getattr(settings, 'MUSIC_ENCRYPTION_KEY')

def encrypt_file_content(file_obj):
    key = get_encryption_key()
    fernet = Fernet(key)
    
    file_obj.seek(0)
    original_data = file_obj.read()
    encrypted_data = fernet.encrypt(original_data)
    
    # Trả về ContentFile (định dạng file ảo của Django) để lưu tiếp
    return ContentFile(encrypted_data, name=file_obj.name)

# ==========================================
# CÁC HÀM PATH & FILENAME
# ==========================================
def get_safe_filename(filename):
    ext = filename.split('.')[-1]
    return f"{uuid.uuid4().hex}.{ext}"


def get_path_upload_image_user(instance, filename):
    safe_name = getattr(instance, 'username', 'default_user') 
    return f"users/{safe_name}/{get_safe_filename(filename)}"


def get_path_upload_image_artist(instance, filename):
    return f"artists/{instance.slug}/{get_safe_filename(filename)}"
def get_path_upload_image_artist_banner(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{instance.short_id}_banner_{int(time.time())}.{ext}"
    root_path = f"artists/{instance.slug}"
    return os.path.join(root_path, filename)


def get_path_upload_image_genre(instance, filename):
    return f"genres/{instance.slug}/{get_safe_filename(filename)}"

def get_path_upload_image_album(instance, filename):
    return f"releases/{instance.slug}/image/{get_safe_filename(filename)}"

def get_path_upload_image_playlist(instance, filename):
    return f"playlists/{instance.slug}/{get_safe_filename(filename)}"

# --- QUY HOẠCH TRACK TẬP TRUNG ---
def get_path_upload_audio_track(instance, filename):
    ext = filename.split('.')[-1]
    # Tên file mã hóa thường nên giữ đuôi mp3/m4a nhưng ruột đã bị đổi
    new_filename = f"audio_{instance.short_id}.{ext}"
    
    if instance.release.release_type == 'single':
        return f"releases/{instance.release.slug}/{new_filename}"
    else:
        return f"releases/{instance.release.slug}/tracks/{new_filename}"

def get_path_upload_preview_track(instance, filename):
    ext = filename.split('.')[-1]
    new_filename = f"preview_{instance.short_id}.{ext}"
    
    if instance.release.release_type == 'single':
        return f"releases/{instance.release.slug}/{new_filename}"
    else:
        return f"releases/{instance.release.slug}/tracks/{new_filename}"
    
def get_path_upload_lyrics_track(instance, filename):
    ext = filename.split('.')[-1]
    new_filename = f"lyrics_{instance.short_id}.{ext}"
    
    if instance.release.release_type == 'single':
        return f"releases/{instance.release.slug}/{new_filename}"
    else:
        return f"releases/{instance.release.slug}/tracks/{new_filename}"

def get_path_upload_video_track(instance, filename):
    ext = filename.split('.')[-1]
    # Lưu ý: instance lúc này là model Video, nên phải gọi sang track
    new_filename = f"canvas_{instance.track.short_id}.{ext}"
    
    if instance.track.release.release_type == 'single':
        return f"releases/{instance.track.release.slug}/{new_filename}"
    else:
        return f"releases/{instance.track.release.slug}/tracks/{new_filename}"

# ==========================================
# CÁC HÀM VALIDATE
# ==========================================
def validate_image_size(file):
    mb_limit = 5
    if file.size > mb_limit * 1024 * 1024:
        raise ValidationError(f"File size exceeds {mb_limit}MB limit.")
    return True

def validate_audio_size(file):
    mb_limit = 30
    if file.size > mb_limit * 1024 * 1024:
        raise ValidationError(f"Audio size exceeds {mb_limit}MB limit.")
    return True

def validate_video_size(file):
    mb_limit = 500
    if file.size > mb_limit * 1024 * 1024:
        raise ValidationError(f"Video size exceeds {mb_limit}MB limit.")
    return True

def validate_audio_extension(file):
    ext = os.path.splitext(file.name)[1].lower()
    valid_extensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg']
    if ext not in valid_extensions:
        raise ValidationError(f"Unsupported audio extension: {ext}. Allowed: {', '.join(valid_extensions)}")
    return True

def validate_image_extension(file):
    ext = os.path.splitext(file.name)[1].lower()
    valid_extensions = ['.jpg', '.jpeg', '.png', '.webp']
    if ext not in valid_extensions:
        raise ValidationError(f"Unsupported image extension: {ext}. Allowed: {', '.join(valid_extensions)}")
    return True