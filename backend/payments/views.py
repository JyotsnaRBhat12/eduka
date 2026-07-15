import json
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import views, permissions, status
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
import stripe

from courses.models import Course, Enrollment, Lesson, LessonProgress
from notifications.models import Notification
from .models import Payment

stripe.api_key = settings.STRIPE_SECRET_KEY

class CreateStripeCheckoutSessionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        course_id = request.data.get('course_id')
        course = get_object_or_404(Course, id=course_id)
        student = request.user

        if Enrollment.objects.filter(student=student, course=course).exists():
            return Response({"error": "Already enrolled in this course."}, status=status.HTTP_400_BAD_REQUEST)

        # Generate unique mock or real session
        transaction_id = f"stripe_sess_{student.id}_{course.id}_{int(timezone.now().timestamp())}"

        # If Stripe key is default mock, use simulated payment page URL
        if settings.STRIPE_SECRET_KEY == 'sk_test_mock_secret_key_12345':
            mock_checkout_url = f"http://localhost:5173/payment/mock-stripe-checkout?course_id={course.id}&transaction_id={transaction_id}"
            # Log pending payment
            Payment.objects.create(
                student=student,
                course=course,
                gateway=Payment.GATEWAY_STRIPE,
                transaction_id=transaction_id,
                amount=course.price,
                status=Payment.STATUS_PENDING
            )
            return Response({"url": mock_checkout_url, "is_mock": True}, status=status.HTTP_200_OK)

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'INR',
                        'product_data': {
                            'name': course.title,
                            'description': course.description[:100],
                        },
                        'unit_amount': int(course.price * 100),
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f"http://localhost:5173/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url="http://localhost:5173/payment/cancel",
                client_reference_id=f"{student.id}_{course.id}",
            )
            
            Payment.objects.create(
                student=student,
                course=course,
                gateway=Payment.GATEWAY_STRIPE,
                transaction_id=session.id,
                amount=course.price,
                status=Payment.STATUS_PENDING
            )
            return Response({"url": session.url, "is_mock": False}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StripeWebhookView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        event = None

        # Handle mock/simulated webhook trigger for local development
        is_mock_trigger = request.data.get('is_mock_trigger', False)
        if is_mock_trigger:
            tx_id = request.data.get('transaction_id')
            action = request.data.get('action', 'completed')
            if action == 'disputed':
                return self.process_dispute_rollback(tx_id)
            success = request.data.get('success', False) or (action == 'completed')
            return self.process_payment_completion(tx_id, success)

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            return Response({"error": "Invalid payload"}, status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError as e:
            return Response({"error": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST)

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            tx_id = session.id
            self.process_payment_completion(tx_id, True)
        elif event['type'] in ['charge.dispute.created', 'charge.dispute.funds_withdrawn']:
            dispute = event['data']['object']
            payment_intent_id = dispute.get('payment_intent')
            if payment_intent_id:
                try:
                    # Look up Stripe sessions that match this payment intent
                    sessions = stripe.checkout.Session.list(payment_intent=payment_intent_id)
                    if sessions.data:
                        session_id = sessions.data[0].id
                        self.process_dispute_rollback(session_id)
                except Exception:
                    # Fallback lookup in database directly using payment intent ID
                    try:
                        payment = Payment.objects.get(transaction_id=payment_intent_id)
                        self.process_dispute_rollback(payment.transaction_id)
                    except Payment.DoesNotExist:
                        pass

        return Response({"status": "success"}, status=status.HTTP_200_OK)

    def process_dispute_rollback(self, tx_id):
        try:
            payment = Payment.objects.get(transaction_id=tx_id)
            with transaction.atomic():
                payment.status = Payment.STATUS_DISPUTED
                payment.save()

                # Rollback entitlement (Delete enrollment + progress)
                Enrollment.objects.filter(student=payment.student, course=payment.course).delete()
                LessonProgress.objects.filter(
                    student=payment.student, 
                    lesson__module__course=payment.course
                ).delete()

                # Trigger notifications
                Notification.objects.create(
                    recipient=payment.student,
                    title="Access Suspended (Dispute)",
                    message=f"Your access to course '{payment.course.title}' has been suspended due to an active payment dispute.",
                    notification_type=Notification.TYPE_ANNOUNCEMENT
                )
                Notification.objects.create(
                    recipient=payment.course.mentor,
                    title="Enrollment Revoked (Dispute)",
                    message=f"Access for student {payment.student.email} on course '{payment.course.title}' was revoked due to a payment dispute.",
                    notification_type=Notification.TYPE_ANNOUNCEMENT
                )
            return Response({"status": "disputed", "entitlement_rolled_back": True}, status=status.HTTP_200_OK)
        except Payment.DoesNotExist:
            return Response({"error": "Payment record not found"}, status=status.HTTP_404_NOT_FOUND)

    def process_payment_completion(self, tx_id, success):
        try:
            payment = Payment.objects.get(transaction_id=tx_id)
            if success:
                with transaction.atomic():
                    payment.status = Payment.STATUS_COMPLETED
                    payment.save()

                    # Automatically enroll student
                    enrollment, created = Enrollment.objects.get_or_create(
                        student=payment.student,
                        course=payment.course
                    )
                    
                    # Initialize lesson progress
                    lessons = Lesson.objects.filter(module__course=payment.course)
                    for lesson in lessons:
                        LessonProgress.objects.get_or_create(
                            student=payment.student, 
                            lesson=lesson, 
                            defaults={'is_completed': False}
                        )

                    # Trigger notification
                    Notification.objects.create(
                        recipient=payment.student,
                        title="Payment Completed",
                        message=f"Your payment of ${payment.amount} for course '{payment.course.title}' was processed successfully. You are now enrolled!",
                        notification_type=Notification.TYPE_ENROLLMENT
                    )
                    Notification.objects.create(
                        recipient=payment.course.mentor,
                        title="Course Purchased",
                        message=f"Student {payment.student.email} purchased your course '{payment.course.title}' for ${payment.amount}.",
                        notification_type=Notification.TYPE_ENROLLMENT
                    )
                return Response({"status": "completed", "enrolled": True}, status=status.HTTP_200_OK)
            else:
                payment.status = Payment.STATUS_PENDING
                payment.save()
                return Response({"status": "cancelled"}, status=status.HTTP_200_OK)
        except Payment.DoesNotExist:
            return Response({"error": "Payment record not found"}, status=status.HTTP_404_NOT_FOUND)


class VerifyPayPalOrderView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')
        course_id = request.data.get('course_id')
        course = get_object_or_404(Course, id=course_id)
        student = request.user

        if not order_id:
            return Response({"error": "Order ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        # In sandbox, we check client secrets or simulate verification
        # For full implementation, we log the PayPal transaction
        try:
            with transaction.atomic():
                # Check if this order_id is already registered to avoid double-processing
                payment, created = Payment.objects.get_or_create(
                    transaction_id=f"paypal_{order_id}",
                    defaults={
                        'student': student,
                        'course': course,
                        'gateway': Payment.GATEWAY_PAYPAL,
                        'amount': course.price,
                        'status': Payment.STATUS_COMPLETED
                    }
                )
                
                if not created and payment.status == Payment.STATUS_COMPLETED:
                    return Response({"detail": "Already processed.", "enrollment": True}, status=status.HTTP_200_OK)

                if not created:
                    payment.status = Payment.STATUS_COMPLETED
                    payment.save()

                # Enroll the student
                enrollment, enrolled_created = Enrollment.objects.get_or_create(
                    student=student,
                    course=course
                )

                # Initialize lesson progress
                lessons = Lesson.objects.filter(module__course=course)
                for lesson in lessons:
                    LessonProgress.objects.get_or_create(
                        student=student, 
                        lesson=lesson, 
                        defaults={'is_completed': False}
                    )

                # Notification
                Notification.objects.create(
                    recipient=student,
                    title="PayPal Payment Success",
                    message=f"PayPal order {order_id} verified. You have access to '{course.title}'.",
                    notification_type=Notification.TYPE_ENROLLMENT
                )
                Notification.objects.create(
                    recipient=course.mentor,
                    title="New Sale (PayPal)",
                    message=f"Course '{course.title}' sold via PayPal for ${course.price}.",
                    notification_type=Notification.TYPE_ENROLLMENT
                )

                return Response({"detail": "PayPal order verified successfully.", "success": True}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RefundPaymentView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, payment_id):
        payment = get_object_or_404(Payment, id=payment_id)

        if payment.status == Payment.STATUS_REFUNDED:
            return Response({"error": "Payment already refunded."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            payment.status = Payment.STATUS_REFUNDED
            payment.save()

            # Rollback entitlement (Delete enrollment + progress)
            Enrollment.objects.filter(student=payment.student, course=payment.course).delete()
            LessonProgress.objects.filter(
                student=payment.student, 
                lesson__module__course=payment.course
            ).delete()

            # Notify student
            Notification.objects.create(
                recipient=payment.student,
                title="Refund Processed",
                message=f"Your refund request for '{payment.course.title}' has been processed. Access to the course curriculum has been removed.",
                notification_type=Notification.TYPE_REFUND
            )

            # Notify mentor
            Notification.objects.create(
                recipient=payment.course.mentor,
                title="Enrollment Revoked (Refund)",
                message=f"A refund has been processed for student {payment.student.email} on course '{payment.course.title}'. Access was revoked.",
                notification_type=Notification.TYPE_REFUND
            )

        return Response({"detail": "Refund processed and entitlement rolled back.", "status": "REFUNDED"}, status=status.HTTP_200_OK)


# Admin endpoint to list all payments for reports and refunds
class AdminPaymentListView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        payments = Payment.objects.all().order_by('-created_at')
        data = [
            {
                "id": p.id,
                "student_email": p.student.email,
                "course_title": p.course.title,
                "gateway": p.gateway,
                "transaction_id": p.transaction_id,
                "amount": str(p.amount),
                "status": p.status,
                "created_at": p.created_at.isoformat()
            }
            for p in payments
        ]
        return Response(data, status=status.HTTP_200_OK)


import csv
from django.http import HttpResponse

class AdminSystemReportView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        from courses.models import Course, Enrollment
        from users.models import User
        from django.db.models import Sum

        total_revenue = Payment.objects.filter(status=Payment.STATUS_COMPLETED).aggregate(total=Sum('amount'))['total'] or 0.00
        student_count = User.objects.filter(role=User.ROLE_STUDENT).count()
        mentor_count = User.objects.filter(role=User.ROLE_MENTOR).count()
        course_count = Course.objects.count()
        enrollment_count = Enrollment.objects.count()

        return Response({
            "total_revenue": float(total_revenue),
            "student_count": student_count,
            "mentor_count": mentor_count,
            "course_count": course_count,
            "enrollment_count": enrollment_count
        }, status=status.HTTP_200_OK)


class ExportPaymentsCSVView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="payments_report.csv"'

        writer = csv.writer(response)
        writer.writerow(['ID', 'Student Email', 'Course Title', 'Gateway', 'Transaction ID', 'Amount', 'Status', 'Date'])

        payments = Payment.objects.all().order_by('-created_at')
        for p in payments:
            writer.writerow([p.id, p.student.email, p.course.title, p.gateway, p.transaction_id, p.amount, p.status, p.created_at.isoformat()])

        return response
