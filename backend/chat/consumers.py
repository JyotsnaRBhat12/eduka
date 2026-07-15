import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from courses.models import Course, Enrollment
from .models import QAMessage

User = get_user_model()

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.course_id = self.scope['url_route']['kwargs']['course_id']
        self.room_group_name = f'chat_{self.course_id}'
        self.user = self.scope.get('user')

        # Authentication check
        if not self.user or self.user.is_anonymous:
            await self.close(code=4001)  # Unauthorized
            return

        # Authorization check (Must be student enrolled, course mentor, or admin)
        authorized = await self.check_authorization()
        if not authorized:
            await self.close(code=4003)  # Forbidden
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive_json(self, content):
        action = content.get('action', 'message')
        
        if action == 'message':
            msg_text = content.get('content')
            parent_id = content.get('parent_id', None)
            
            if not msg_text:
                return

            # Save message to DB
            saved_msg = await self.save_message(msg_text, parent_id)
            if saved_msg:
                # Broadcast message to group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': saved_msg
                    }
                )
        elif action == 'moderate':
            message_id = content.get('message_id')
            if not message_id:
                return

            # Only Mentors of the course and Admins can moderate
            is_moderator = await self.check_is_moderator()
            if is_moderator:
                success = await self.moderate_message(message_id)
                if success:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'chat_moderate',
                            'message_id': message_id
                        }
                    )

    # Receive message from room group
    async def chat_message(self, event):
        await self.send_json({
            'type': 'message',
            'message': event['message']
        })

    # Receive moderation event from room group
    async def chat_moderate(self, event):
        await self.send_json({
            'type': 'moderate',
            'message_id': event['message_id']
        })

    @database_sync_to_async
    def check_authorization(self):
        if self.user.role == User.ROLE_ADMIN:
            return True
        try:
            course = Course.objects.get(id=self.course_id)
            if self.user.role == User.ROLE_MENTOR:
                return course.mentor == self.user
            # Student check
            return Enrollment.objects.filter(student=self.user, course=course).exists()
        except Course.DoesNotExist:
            return False

    @database_sync_to_async
    def check_is_moderator(self):
        if self.user.role == User.ROLE_ADMIN:
            return True
        try:
            course = Course.objects.get(id=self.course_id)
            return course.mentor == self.user
        except Course.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, text, parent_id):
        try:
            course = Course.objects.get(id=self.course_id)
            parent = None
            if parent_id:
                parent = QAMessage.objects.get(id=parent_id)

            msg = QAMessage.objects.create(
                course=course,
                sender=self.user,
                content=text,
                parent_message=parent
            )

            # If this message is a reply to another question, notify the parent author
            if parent and parent.sender != self.user:
                from notifications.models import Notification
                Notification.objects.create(
                    recipient=parent.sender,
                    title="New Q&A Reply Received",
                    message=f"User {self.user.username} replied to your question in '{course.title}': \"{text[:60]}...\"",
                    notification_type=Notification.TYPE_QA
                )
            return {
                'id': msg.id,
                'content': msg.content,
                'parent_id': msg.parent_message_id,
                'sender': {
                    'id': self.user.id,
                    'email': self.user.email,
                    'username': self.user.username,
                    'role': self.user.role,
                },
                'created_at': msg.created_at.isoformat()
            }
        except Exception as e:
            print(f"Error saving chat message: {e}")
            return None

    @database_sync_to_async
    def moderate_message(self, message_id):
        try:
            msg = QAMessage.objects.get(id=message_id, course_id=self.course_id)
            msg.is_moderated = True
            msg.save()
            return True
        except QAMessage.DoesNotExist:
            return False
