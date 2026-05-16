import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        print(f"📡 [WS CHECK] Bat82 đầu đầu")

        # 1. Nhét vào Group cá nhân (để nhận thông báo riêng tư)
        if self.user and self.user.is_authenticated:
            self.room_group_name = f'notif_user_{self.user.id}'
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            print(f"📡 [WS CHECK] User {self.user.id} đã Join vào Group: {self.room_group_name}")

        # 2. 🔥 Nhét tất cả vào Group toàn cầu (Để nhận lệnh Refresh hệ thống từ Admin)
        self.global_group = 'global_listeners'
        await self.channel_layer.group_add(self.global_group, self.channel_name)
        print(f"📡 [WS CHECK] User {self.user.id} đã Join vào Group: {self.global_group}")

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        # Gỡ khỏi Group toàn cầu
        await self.channel_layer.group_discard('global_listeners', self.channel_name)

    # Nhận thông báo cá nhân (Như cũ)
    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'data': event['message']
        }))

    # 🔥 Thêm hàm nhận lệnh hệ thống (System Event)
    async def system_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'system_event',
            'action': event['action'],     # VD: 'CONTENT_BLOCKED'
            'payload': event['payload']    # VD: {'short_id': 'abc', 'type': 'track'}
        }))