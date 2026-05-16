from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # 1. Thọc tay vào túi Cookie lấy thẻ 'access'
        raw_token = request.COOKIES.get('access')
        
        # 2. Nếu không có Cookie, thử tìm trong Header (dành cho Postman hoặc luồng cũ nếu sếp chưa xóa hết)
        if raw_token is None:
            header = self.get_header(request)
            if header is not None:
                raw_token = self.get_raw_token(header)
                
        # 3. Nếu vẫn không có thì chịu, trả về AnonymousUser
        if raw_token is None:
            return None

        # 4. Xác thực Token xem có hợp lệ hay hết hạn không
        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except Exception:
            # Token hết hạn hoặc tào lao -> Báo lỗi 401
            return None