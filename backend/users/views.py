from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import random
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta

from .models import MentorProfile, PasswordResetCode
from .serializers import RegisterSerializer, UserSerializer, MentorProfileSerializer

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['email'] = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        user_serializer = self.get_serializer(user, data=request.data, partial=True)
        user_serializer.is_valid(raise_exception=True)
        self.perform_update(user_serializer)

        # Update MentorProfile if applicable
        if user.role == User.ROLE_MENTOR and hasattr(user, 'mentor_profile'):
            mentor_profile = user.mentor_profile
            profile_data = request.data.get('mentor_profile', {})
            profile_serializer = MentorProfileSerializer(mentor_profile, data=profile_data, partial=True)
            profile_serializer.is_valid(raise_exception=True)
            profile_serializer.save()

        # Re-fetch instance to reflect profile updates
        user = self.get_object()
        return Response(self.get_serializer(user).data)


class MentorListView(generics.ListAPIView):
    queryset = MentorProfile.objects.all()
    serializer_class = MentorProfileSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['is_approved']


class ApproveMentorView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            profile = MentorProfile.objects.get(pk=pk)
            profile.is_approved = True
            profile.save()
            return Response({"detail": "Mentor approved successfully.", "is_approved": True}, status=status.HTTP_200_OK)
        except MentorProfile.DoesNotExist:
            return Response({"error": "Mentor profile not found."}, status=status.HTTP_404_NOT_FOUND)


from django.shortcuts import get_object_or_404

class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


class ToggleUserActiveView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        user = get_object_or_404(User, id=pk)
        if user.is_superuser:
            return Response({"error": "Cannot suspend superuser."}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = not user.is_active
        user.save()
        return Response({"id": user.id, "username": user.username, "is_active": user.is_active}, status=status.HTTP_200_OK)


class RequestPasswordResetView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)

        # Generate 6-digit code
        code = f"{random.randint(100000, 999999)}"

        # Save/update verification code
        PasswordResetCode.objects.filter(email=email).delete()
        PasswordResetCode.objects.create(email=email, code=code)

        # Send mail
        subject = "[eduka] Password Reset Verification Code"
        message = f"Hello {user.first_name or user.username},\n\nYour password reset verification code is: {code}\n\nThis code will expire in 15 minutes.\n\nBest regards,\neduka Team"
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"FAILED TO SEND EMAIL: {e}")

        return Response({"detail": "Password reset code sent to your email."}, status=status.HTTP_200_OK)


class ConfirmPasswordResetView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        new_password = request.data.get('new_password')

        if not email or not code or not new_password:
            return Response({"error": "Email, verification code, and new password are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reset_record = PasswordResetCode.objects.get(email=email, code=code)
        except PasswordResetCode.DoesNotExist:
            return Response({"error": "Invalid verification code or email."}, status=status.HTTP_400_BAD_REQUEST)

        # Check expiration (15 minutes)
        now = timezone.now()
        if now - reset_record.created_at > timedelta(minutes=15):
            reset_record.delete()
            return Response({"error": "Verification code has expired."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            
            # Clean up verification code
            reset_record.delete()
            return Response({"detail": "Password reset successful. You can now log in with your new password."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User no longer exists."}, status=status.HTTP_404_NOT_FOUND)


class TestEmailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        recipient = request.user.email
        if not recipient:
            return Response({"error": "Your account does not have a configured email address."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            send_mail(
                subject="eduka Test Email Verification",
                message=(
                    f"Hello {request.user.username},\n\n"
                    f"This is a test email sent from your eduka instance to confirm that your SMTP "
                    f"email server settings are configured and sending correctly!\n\n"
                    f"If you received this, everything works perfectly.\n\n"
                    f"Best regards,\n"
                    f"eduka Dev Server Verification"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
            )
            return Response({"detail": f"Test email successfully dispatched to {recipient}."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to send email: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

