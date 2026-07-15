from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import MentorProfile

User = get_user_model()

class MentorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MentorProfile
        fields = ['id', 'bio', 'specialization', 'hourly_rate', 'qualifications', 'is_approved']
        read_only_fields = ['id', 'is_approved']


class UserSerializer(serializers.ModelSerializer):
    mentor_profile = MentorProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'role', 'avatar', 'bio', 'is_active', 'mentor_profile', 'created_at']
        read_only_fields = ['id', 'role', 'is_active', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'first_name', 'last_name', 'role']

    def create(self, validated_data):
        password = validated_data.pop('password')
        role = validated_data.get('role', User.ROLE_STUDENT)
        user = User(**validated_data)
        user.set_password(password)
        user.save()

        # Automatically create MentorProfile if role is MENTOR
        if role == User.ROLE_MENTOR:
            MentorProfile.objects.create(user=user)
            
        return user
