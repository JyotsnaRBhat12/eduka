from django.db import models
from django.conf import settings

class Notification(models.Model):
    TYPE_ENROLLMENT = 'ENROLLMENT'
    TYPE_LESSON = 'LESSON'
    TYPE_QA = 'QA'
    TYPE_REFUND = 'REFUND'
    TYPE_ANNOUNCEMENT = 'ANNOUNCEMENT'

    TYPE_CHOICES = [
        (TYPE_ENROLLMENT, 'Enrollment'),
        (TYPE_LESSON, 'New Lesson'),
        (TYPE_QA, 'Q&A Activity'),
        (TYPE_REFUND, 'Refund Event'),
        (TYPE_ANNOUNCEMENT, 'Announcement'),
    ]

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_ANNOUNCEMENT)
    read_status = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.recipient.email}: {self.title}"


# Signals for real-time WebSocket broadcasting
from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

@receiver(post_save, sender=Notification)
def broadcast_notification(sender, instance, created, **kwargs):
    if created:
        # 1. Broadcast over WebSocket Channels
        channel_layer = get_channel_layer()
        if channel_layer:
            group_name = f"user_notifications_{instance.recipient.id}"
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "send_notification",
                    "notification": {
                        "id": instance.id,
                        "title": instance.title,
                        "message": instance.message,
                        "notification_type": instance.notification_type,
                        "created_at": instance.created_at.isoformat(),
                    }
                }
            )

        # 2. Dispatch Email notification (printed to console)
        from django.core.mail import send_mail
        from django.conf import settings
        try:
            subject = f"[{instance.notification_type}] {instance.title}"
            body = (
                f"Hello,\n\n"
                f"You have received a new notification on eduka:\n\n"
                f"--- {instance.title} ---\n"
                f"{instance.message}\n\n"
                f"Best regards,\n"
                f"The eduka Platform Team"
            )
            send_mail(
                subject=subject,
                message=body,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@eduka.com'),
                recipient_list=[instance.recipient.email],
                fail_silently=True
            )
        except Exception as e:
            print(f"Error sending email notification: {e}")
