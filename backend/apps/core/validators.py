import os
from rest_framework.exceptions import ValidationError

def check_file_security(file_obj, max_size_mb, allowed_extensions):
    """
    Hàm dùng chung để chặn dung lượng và đuôi file.
    """
    if not file_obj:
        return None
        
    # 1. Chặn dung lượng
    if file_obj.size > max_size_mb * 1024 * 1024:
        raise ValidationError(f"Kích thước file tối đa là {max_size_mb}MB! File hiện tại quá lớn.")
        
    # 2. Chặn đuôi file (Security cơ bản)
    ext = os.path.splitext(file_obj.name)[1].lower()
    if ext not in allowed_extensions:
        raise ValidationError(f"File không hợp lệ! Chỉ chấp nhận các định dạng: {', '.join(allowed_extensions)}")
    
    return file_obj