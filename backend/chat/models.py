from django.db import models
from django.conf import settings
from courses.models import Course

class QAMessage(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='qa_messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='qa_messages')
    content = models.TextField()
    parent_message = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )
    is_moderated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.email} in {self.course.title}: {self.content[:30]}"
