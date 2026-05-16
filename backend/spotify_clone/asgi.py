"""
ASGI config for spotify_clone project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
import django

# Khai báo môi trường trước khi import các module khác của Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spotify_clone.settings')
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from channels.security.websocket import AllowedHostsOriginValidator
from apps.users import routing 
from http.cookies import SimpleCookie

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token):
    try:
        # Giải mã token để lấy user
        decoded_data = UntypedToken(token)
        user = User.objects.get(id=decoded_data['user_id'])
        return user
    except (InvalidToken, TokenError, User.DoesNotExist):
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        headers = dict(scope.get('headers', []))
        # 1. Kiểm tra xem Browser có gửi Cookie lên qua WS không
        cookie_header = headers.get(b'cookie', b'').decode('utf-8')
        
        token = None
        if cookie_header:
            cookies = SimpleCookie(cookie_header)
            # 🔍 SOI COOKIE: In ra toàn bộ tên các cookie đang có
            print(f"🔍 [WS DEBUG] Danh sách Cookie nhận được: {list(cookies.keys())}")
            
            # Sếp kiểm tra xem trong log nó in ra tên gì? 
            # Có đúng là 'access' không hay là 'nk_music_stream-access-token'?
            if 'access' in cookies:
                token = cookies['access'].value
                print(f"✅ [WS DEBUG] Đã tìm thấy token 'access'")
        else:
            print("❌ [WS DEBUG] Trình duyệt KHÔNG gửi bất kỳ Cookie nào qua WS!")

        if token:
            scope['user'] = await get_user_from_token(token)
            print(f"👤 [WS DEBUG] Kết quả Auth: {scope['user']} | Auth: {scope['user'].is_authenticated}")
        else:
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)


# Đây là trái tim của Channels: Phân luồng HTTP và WebSocket
application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddleware(
            URLRouter(
                routing.websocket_urlpatterns
            )
        )
    ),
})