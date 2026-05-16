from django.db import models

class BlockReason(models.IntegerChoices):
    COPYRIGHT = 1, 'Copyright Infringement'
    SENSITIVE = 2, 'Sensitive Content'
    ARTIST_BLOCKED = 3, 'Artist Blocked'
    OTHER = 4, 'Other'

# dành cho việc từ chối đơn apply thành nghệ sĩ của user
class RejectionReason(models.IntegerChoices):
    INCOMPLETE_INFO = 1, 'Incomplete or unclear information'
    LOW_QUALITY_IMAGE = 2, 'Low quality profile or document image'
    SOCIAL_LINK_INVALID = 3, 'Social link is invalid or not owned'
    COPYRIGHT_ISSUE = 4, 'Stage name or content copyright issue'
    OTHER = 5, 'Other'

# dành cho việc từ chối tạo release mới của nghệ sĩ
class ReleaseRejectReason(models.IntegerChoices):
    COPYRIGHT_AUDIO = 1, 'Audio or Lyrics copyright infringement' # Vi phạm bản quyền âm thanh/lời
    POOR_AUDIO_QUALITY = 2, 'Poor audio quality or technical issues' # File nhạc bị rè, chất lượng kém
    INVALID_COVER_ART = 3, 'Cover art is inappropriate or low quality' # Ảnh bìa mờ, phản cảm hoặc vi phạm
    METADATA_MISMATCH = 4, 'Metadata does not match the audio content' # Tiêu đề bài hát không khớp với file nhạc
    UNMARKED_EXPLICIT = 5, 'Contains explicit content but not marked as Explicit' # Có từ ngữ nhạy cảm/chửi thề nhưng quên tick nút Explicit
    OTHER = 6, 'Other'