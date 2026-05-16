from django.core.mail import send_mail
from django.conf import settings
from apps.users.models import Notification
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def send_system_notification(user, title, message, metadata=None, use_email=False, use_app=True):
    """Hàm xử lý thông báo tập trung"""
    
    # 1. Thông báo trong App (Cái chuông)
    if use_app and user.is_active:
        print(f"🚀 Đang bắn WS tới: notif_user_{user.id}")
        noti = Notification.objects.create(
            user=user,
            title=title,
            message=message,
            metadata = metadata
        )
        
        channel_layer = get_channel_layer()
        room_name = f"notif_user_{user.id}"

        async_to_sync(channel_layer.group_send)(
            room_name, {
                'type': 'send_notification',
                'message' : {
                    'id': noti.id,
                    'title': noti.title,
                    'message' : noti.message,
                    'is_read': noti.is_read,
                    'created_at': noti.created_at.isoformat(),
                    'metadata': noti.metadata
                }
            }
        )
    # 2. Thông báo qua Email
    if use_email:
        try:
            send_mail(
                subject=title,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Lỗi gửi email: {e}")

def send_system_event(action, payload):
    """
    Hàm bắn lệnh đồng bộ hệ thống (Không hiện chuông).
    Dành cho Listener F5 lại data khi có biến.
    """
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        'global_listeners',
        {
            'type': 'system_event',
            'action': action,
            'payload': payload
        }
    )