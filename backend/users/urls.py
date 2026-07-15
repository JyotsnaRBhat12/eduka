from django.urls import path
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, CustomTokenObtainPairView, ProfileView, MentorListView, ApproveMentorView,
    AdminUserListView, ToggleUserActiveView, RequestPasswordResetView, ConfirmPasswordResetView,
    TestEmailView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='user_profile'),
    path('password-reset/request/', RequestPasswordResetView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', ConfirmPasswordResetView.as_view(), name='password_reset_confirm'),
    path('test-email/', TestEmailView.as_view(), name='test_email'),
    
    # Admin URLs
    path('admin/mentors/', MentorListView.as_view(), name='admin_mentors_list'),
    path('admin/mentors/<int:pk>/approve/', ApproveMentorView.as_view(), name='admin_approve_mentor'),
    path('admin/users/', AdminUserListView.as_view(), name='admin_users_list'),
    path('admin/users/<int:pk>/toggle/', ToggleUserActiveView.as_view(), name='admin_toggle_user'),
]
