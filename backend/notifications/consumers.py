import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Notification

User = get_user_model()

class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')

        if not self.user or self.user.is_anonymous:
            await self.close(code=4001)
            return

        self.group_name = f'user_notifications_{self.user.id}'

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

        # Send existing unread notifications upon connection
        unread_notifications = await self.get_unread_notifications()
        await self.send_json({
            'type': 'initial_notifications',
            'notifications': unread_notifications
        })

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def receive_json(self, content):
        action = content.get('action')
        if action == 'mark_read':
            notification_id = content.get('notification_id')
            if notification_id:
                await self.mark_notification_read(notification_id)
                await self.send_json({
                    'type': 'notification_read',
                    'notification_id': notification_id
                })

    # Receive notification from group broad-cast
    async def send_notification(self, event):
        await self.send_json({
            'type': 'new_notification',
            'notification': event['notification']
        })

    @database_sync_to_async
    def get_unread_notifications(self):
        notifications = Notification.objects.filter(recipient=self.user, read_status=False)[:50]
        return [
            {
                'id': n.id,
                'title': n.title,
                'message': n.message,
                'notification_type': n.notification_type,
                'created_at': n.created_at.isoformat()
            }
            for n in notifications
        ]

    @database_sync_to_async
    def mark_notification_read(self, n_id):
        Notification.objects.filter(id=n_id, recipient=self.user).update(read_status=True)
