from django.db import models
from django.conf import settings
from courses.models import Course

class Payment(models.Model):
    STATUS_PENDING = 'PENDING'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_REFUNDED = 'REFUNDED'
    STATUS_DISPUTED = 'DISPUTED'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_REFUNDED, 'Refunded'),
        (STATUS_DISPUTED, 'Disputed'),
    ]

    GATEWAY_STRIPE = 'STRIPE'
    GATEWAY_PAYPAL = 'PAYPAL'

    GATEWAY_CHOICES = [
        (GATEWAY_STRIPE, 'Stripe'),
        (GATEWAY_PAYPAL, 'PayPal'),
    ]

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='payments')
    gateway = models.CharField(max_length=20, choices=GATEWAY_CHOICES, default=GATEWAY_STRIPE)
    transaction_id = models.CharField(max_length=255, unique=True)
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment {self.transaction_id} - {self.course.title} by {self.student.email} ({self.status})"
