from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet, ModuleViewSet, LessonViewSet, ToggleLessonProgressView, 
    QuizSubmitView, CertificateDownloadView, AdminCourseApprovalListView, ApproveCourseView,
    MentorAnalyticsView, AdminReviewListView, ToggleReviewModerationView, ReportReviewView,
    PublicCertificateVerifyView
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'modules', ModuleViewSet, basename='module')
router.register(r'lessons', LessonViewSet, basename='lesson')

urlpatterns = [
    path('', include(router.urls)),
    path('lessons/<int:pk>/progress/', ToggleLessonProgressView.as_view(), name='toggle_lesson_progress'),
    path('lessons/<int:pk>/quiz/submit/', QuizSubmitView.as_view(), name='quiz_submit'),
    path('courses/<int:pk>/certificate/', CertificateDownloadView.as_view(), name='certificate_download'),
    path('certificate/verify/<str:cert_id>/', PublicCertificateVerifyView.as_view(), name='public_certificate_verify'),
    path('mentor/analytics/', MentorAnalyticsView.as_view(), name='mentor_analytics'),
    path('reviews/<int:pk>/report/', ReportReviewView.as_view(), name='report_review'),
    
    # Admin approvals & moderation
    path('admin/courses/pending/', AdminCourseApprovalListView.as_view(), name='admin_courses_pending'),
    path('admin/courses/<int:pk>/approve/', ApproveCourseView.as_view(), name='admin_approve_course'),
    path('admin/reviews/', AdminReviewListView.as_view(), name='admin_reviews_list'),
    path('admin/reviews/<int:pk>/toggle/', ToggleReviewModerationView.as_view(), name='admin_toggle_review'),
]
