from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status, views, filters, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models

from .models import Course, Module, Lesson, Quiz, Question, Answer, Enrollment, LessonProgress, CourseReview, ReviewReport
from .serializers import (
    CourseSerializer, CourseCreateUpdateSerializer, ModuleSerializer, 
    LessonSerializer, QuizSerializer, EnrollmentSerializer, CourseReviewSerializer,
    QAMessageSerializer, ReviewReportSerializer
)
from users.models import User
from .filters import CourseFilter
from .search_service import search_courses, get_autocomplete_suggestions

def update_enrollment_progress(student, course):
    total_lessons = Lesson.objects.filter(module__course=course).count()
    if total_lessons == 0:
        return
    
    completed_lessons = LessonProgress.objects.filter(
        student=student,
        lesson__module__course=course,
        is_completed=True
    ).count()
    
    percentage = round((completed_lessons / total_lessons) * 100, 2)
    percentage = min(percentage, 100.00)
    
    enrollment = Enrollment.objects.filter(student=student, course=course).first()
    if enrollment:
        enrollment.progress_percentage = percentage
        if percentage >= 100.00 and not enrollment.is_completed:
            enrollment.is_completed = True
            enrollment.certificate_url = f"/api/courses/{course.id}/certificate/"
        elif percentage < 100.00:
            enrollment.is_completed = False
            enrollment.certificate_url = None
        enrollment.save()


class IsMentorOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == User.ROLE_MENTOR


class IsCourseMentor(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Handle course/module/lesson
        if isinstance(obj, Course):
            return obj.mentor == request.user
        elif isinstance(obj, Module):
            return obj.course.mentor == request.user
        elif isinstance(obj, Lesson):
            return obj.module.course.mentor == request.user
        return False


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = CourseFilter
    ordering_fields = ['price', 'created_at']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CourseCreateUpdateSerializer
        return CourseSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.IsAuthenticated(), IsMentorOrReadOnly()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsCourseMentor()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            if user.role == User.ROLE_ADMIN:
                return Course.objects.all()
            elif user.role == User.ROLE_MENTOR:
                # Return their own courses (approved or not), plus all other approved courses
                return Course.objects.filter(models.Q(mentor=user) | models.Q(is_approved=True)).distinct()
            else:
                # Students can only see approved courses or courses they are already enrolled in
                enrolled_ids = Enrollment.objects.filter(student=user).values_list('course_id', flat=True)
                return Course.objects.filter(models.Q(is_approved=True) | models.Q(id__in=enrolled_ids)).distinct()
        return Course.objects.filter(is_approved=True)

    def filter_queryset(self, queryset):
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = search_courses(queryset, search_query)
        queryset = super().filter_queryset(queryset)
        return queryset

    @action(detail=False, methods=['GET'], permission_classes=[permissions.AllowAny])
    def autocomplete(self, request):
        q = request.query_params.get('q', '')
        suggestions = get_autocomplete_suggestions(q)
        return Response(suggestions)

    @action(detail=True, methods=['POST'], permission_classes=[permissions.IsAuthenticated])
    def enroll(self, request, pk=None):
        course = self.get_object()
        student = request.user
        
        if student.role != User.ROLE_STUDENT:
            return Response({"error": "Only students can enroll in courses."}, status=status.HTTP_400_BAD_REQUEST)

        if Enrollment.objects.filter(student=student, course=course).exists():
            return Response({"detail": "Already enrolled."}, status=status.HTTP_200_OK)

        # Check pricing. If price > 0, check if there is an approved payment for it first!
        if course.price > 0:
            from payments.models import Payment
            payment_exists = Payment.objects.filter(
                student=student, 
                course=course, 
                status=Payment.STATUS_COMPLETED
            ).exists()
            if not payment_exists:
                return Response({"error": "This course requires payment first."}, status=status.HTTP_402_PAYMENT_REQUIRED)

        enrollment = Enrollment.objects.create(student=student, course=course)
        
        # Initialize lesson progress for all lessons in the course as False
        lessons = Lesson.objects.filter(module__course=course)
        for lesson in lessons:
            LessonProgress.objects.get_or_create(student=student, lesson=lesson, defaults={'is_completed': False})
            
        update_enrollment_progress(student, course)
        
        # Trigger enrollment notification
        from notifications.models import Notification
        Notification.objects.create(
            recipient=student,
            title="Enrolled Successfully",
            message=f"You have enrolled in the course: {course.title}.",
            notification_type=Notification.TYPE_ENROLLMENT
        )
        Notification.objects.create(
            recipient=course.mentor,
            title="New Enrollment",
            message=f"A new student ({student.email}) has enrolled in your course: {course.title}.",
            notification_type=Notification.TYPE_ENROLLMENT
        )

        return Response(EnrollmentSerializer(enrollment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['GET', 'POST'], permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def reviews(self, request, pk=None):
        course = self.get_object()
        if request.method == 'GET':
            reviews = course.reviews.filter(is_moderated=False)
            serializer = CourseReviewSerializer(reviews, many=True)
            return Response(serializer.data)
        
        # POST Review
        student = request.user
        if student.role != User.ROLE_STUDENT:
            return Response({"error": "Only students can write reviews."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Check if student is enrolled
        if not Enrollment.objects.filter(student=student, course=course).exists():
            return Response({"error": "You must be enrolled to review this course."}, status=status.HTTP_403_FORBIDDEN)

        if CourseReview.objects.filter(student=student, course=course).exists():
            return Response({"error": "You have already reviewed this course."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = CourseReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save(student=student, course=course)
        
        # Send notification to mentor
        from notifications.models import Notification
        Notification.objects.create(
            recipient=course.mentor,
            title="New Course Review",
            message=f"A student left a {review.rating}-star review on your course {course.title}.",
            notification_type=Notification.TYPE_ANNOUNCEMENT
        )

        return Response(CourseReviewSerializer(review).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['GET'], permission_classes=[permissions.IsAuthenticated])
    def qa(self, request, pk=None):
        course = self.get_object()
        user = request.user
        
        # Check authorization (Student must be enrolled, Mentor must be the course owner, Admins always allowed)
        is_authorized = False
        if user.role == User.ROLE_ADMIN:
            is_authorized = True
        elif user.role == User.ROLE_MENTOR:
            is_authorized = (course.mentor == user)
        else:
            is_authorized = Enrollment.objects.filter(student=user, course=course).exists()
            
        if not is_authorized:
            return Response({"error": "You are not authorized to access Q&A for this course."}, status=status.HTTP_403_FORBIDDEN)
            
        from chat.models import QAMessage
        messages = QAMessage.objects.filter(course=course).order_by('created_at')
        serializer = QAMessageSerializer(messages, many=True)
        return Response(serializer.data)


class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.IsAuthenticated(), IsMentorOrReadOnly()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsCourseMentor()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        course_id = self.request.data.get('course')
        course = get_object_or_404(Course, id=course_id)
        if course.mentor != self.request.user:
            raise permissions.exceptions.PermissionDenied("You do not own this course.")
        serializer.save(course=course)


class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.IsAuthenticated(), IsMentorOrReadOnly()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsCourseMentor()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        module_id = self.request.data.get('module')
        module = get_object_or_404(Module, id=module_id)
        if module.course.mentor != self.request.user:
            raise permissions.exceptions.PermissionDenied("You do not own this course.")
        serializer.save(module=module)

    @action(detail=True, methods=['POST'], permission_classes=[permissions.IsAuthenticated])
    def create_quiz(self, request, pk=None):
        lesson = self.get_object()
        if lesson.module.course.mentor != request.user:
            return Response({"error": "You do not own this course."}, status=status.HTTP_403_FORBIDDEN)
            
        quiz_data = request.data.get('quiz')
        if not quiz_data:
            return Response({"error": "Quiz data is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Delete old quiz if exists to overwrite
        if hasattr(lesson, 'quiz'):
            lesson.quiz.delete()

        quiz = Quiz.objects.create(
            lesson=lesson,
            title=quiz_data.get('title', 'Lesson Quiz'),
            passing_score=int(quiz_data.get('passing_score', 70))
        )
        
        for q_data in quiz_data.get('questions', []):
            q = Question.objects.create(quiz=quiz, text=q_data.get('text'))
            for a_data in q_data.get('answers', []):
                Answer.objects.create(
                    question=q,
                    text=a_data.get('text'),
                    is_correct=a_data.get('is_correct', False)
                )
                
        return Response(LessonSerializer(lesson, context={'request': request}).data, status=status.HTTP_201_CREATED)


class ToggleLessonProgressView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        lesson = get_object_or_404(Lesson, pk=pk)
        student = request.user
        
        # Ensure student is enrolled
        course = lesson.module.course
        if not Enrollment.objects.filter(student=student, course=course).exists():
            return Response({"error": "You are not enrolled in this course."}, status=status.HTTP_403_FORBIDDEN)

        progress, created = LessonProgress.objects.get_or_create(
            student=student,
            lesson=lesson,
            defaults={'is_completed': False}
        )
        
        # Toggle progress
        progress.is_completed = not progress.is_completed
        progress.save()
        
        update_enrollment_progress(student, course)
        
        return Response({
            "lesson_id": lesson.id,
            "is_completed": progress.is_completed,
            "progress_percentage": Enrollment.objects.get(student=student, course=course).progress_percentage
        }, status=status.HTTP_200_OK)


class QuizSubmitView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        lesson = get_object_or_404(Lesson, pk=pk)
        student = request.user
        
        # Ensure student is enrolled
        course = lesson.module.course
        if not Enrollment.objects.filter(student=student, course=course).exists():
            return Response({"error": "You are not enrolled in this course."}, status=status.HTTP_403_FORBIDDEN)

        quiz = getattr(lesson, 'quiz', None)
        if not quiz:
            return Response({"error": "No quiz associated with this lesson."}, status=status.HTTP_404_NOT_FOUND)

        # Submitted answers format: {question_id: answer_id} or list of answer_ids
        submitted_answers = request.data.get('answers', {}) # expect { "question_id": selected_answer_id }
        
        questions = quiz.questions.all()
        total_questions = questions.count()
        if total_questions == 0:
            return Response({"error": "Quiz has no questions."}, status=status.HTTP_400_BAD_REQUEST)

        correct_count = 0
        details = []

        for q in questions:
            selected_ans_id = submitted_answers.get(str(q.id)) or submitted_answers.get(q.id)
            correct_ans = q.answers.filter(is_correct=True).first()
            is_correct = False
            
            if selected_ans_id and correct_ans and int(selected_ans_id) == correct_ans.id:
                correct_count += 1
                is_correct = True
                
            details.append({
                "question_id": q.id,
                "question_text": q.text,
                "selected_answer_id": selected_ans_id,
                "correct_answer_id": correct_ans.id if correct_ans else None,
                "correct_answer_text": correct_ans.text if correct_ans else "",
                "is_correct": is_correct
            })

        score_percent = round((correct_count / total_questions) * 100, 2)
        passed = score_percent >= quiz.passing_score

        if passed:
            # Mark the lesson as completed!
            progress, created = LessonProgress.objects.get_or_create(
                student=student,
                lesson=lesson,
                defaults={'is_completed': False}
            )
            if not progress.is_completed:
                progress.is_completed = True
                progress.save()
                update_enrollment_progress(student, course)

        return Response({
            "score": score_percent,
            "passing_score": quiz.passing_score,
            "passed": passed,
            "correct_count": correct_count,
            "total_questions": total_questions,
            "details": details
        }, status=status.HTTP_200_OK)


class CertificateDownloadView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        student = request.user
        
        enrollment = get_object_or_404(Enrollment, student=student, course=course)
        
        if not enrollment.is_completed:
            return Response({"error": "Course not completed yet."}, status=status.HTTP_400_BAD_REQUEST)

        # Generate a JSON response simulating a certificate metadata payload. 
        # The React frontend will render this beautifully as a printable canvas/PDF.
        return Response({
            "certificate_id": f"CERT-{student.id:04d}-{course.id:04d}",
            "student_name": f"{student.first_name} {student.last_name}".strip() or student.username,
            "student_email": student.email,
            "course_title": course.title,
            "mentor_name": f"{course.mentor.first_name} {course.mentor.last_name}".strip() or course.mentor.username,
            "completion_date": enrollment.enrolled_at.strftime("%B %d, %Y"), # use enrollment date as simple mock completion date
            "platform_name": "Online Learning Platform Academy",
            "verify_url": f"http://localhost:5173/verify/CERT-{student.id:04d}-{course.id:04d}"
        }, status=status.HTTP_200_OK)


# Admin operations for Courses approval
class AdminCourseApprovalListView(generics.ListAPIView):
    queryset = Course.objects.filter(is_approved=False)
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAdminUser]


class ApproveCourseView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        course.is_approved = True
        course.save()
        
        # Notify mentor
        from notifications.models import Notification
        Notification.objects.create(
            recipient=course.mentor,
            title="Course Approved",
            message=f"Your course '{course.title}' has been approved by the Administrator and is now live.",
            notification_type=Notification.TYPE_ANNOUNCEMENT
        )
        
        return Response({"detail": "Course approved successfully.", "is_approved": True}, status=status.HTTP_200_OK)


class MentorAnalyticsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != User.ROLE_MENTOR:
            return Response({"error": "Only mentors have access to analytics."}, status=status.HTTP_403_FORBIDDEN)
            
        mentor_courses = Course.objects.filter(mentor=request.user)
        total_courses = mentor_courses.count()
        
        # Count actual enrolled students in mentor's courses
        total_students = Enrollment.objects.filter(course__in=mentor_courses).count()
        
        # Calculate actual sales from completed payments
        from payments.models import Payment
        completed_payments = Payment.objects.filter(course__in=mentor_courses, status=Payment.STATUS_COMPLETED)
        total_sales = completed_payments.aggregate(total=models.Sum('amount'))['total'] or 0.00
        
        return Response({
            "total_courses": total_courses,
            "total_students": total_students,
            "total_sales": float(total_sales)
        }, status=status.HTTP_200_OK)


class AdminReviewListView(generics.ListAPIView):
    serializer_class = CourseReviewSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        # Order by reports count descending, then by created_at descending
        return CourseReview.objects.annotate(
            reports_count_ann=models.Count('reports')
        ).order_by('-reports_count_ann', '-created_at')


class ToggleReviewModerationView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        review = get_object_or_404(CourseReview, id=pk)
        review.is_moderated = not review.is_moderated
        review.save()
        return Response({"id": review.id, "is_moderated": review.is_moderated}, status=status.HTTP_200_OK)


class ReportReviewView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        review = get_object_or_404(CourseReview, id=pk)
        
        # Only students can report reviews
        if request.user.role != User.ROLE_STUDENT:
            return Response({"error": "Only students can report reviews."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Ensure student is not reporting their own review
        if review.student == request.user:
            return Response({"error": "You cannot report your own review."}, status=status.HTTP_400_BAD_REQUEST)
            
        reason_text = request.data.get('reason', 'Abusive content').strip()
        if not reason_text:
            reason_text = 'Abusive content'
            
        report, created = ReviewReport.objects.get_or_create(
            review=review,
            reporter=request.user,
            defaults={'reason': reason_text}
        )
        if not created:
            return Response({"error": "You have already reported this review."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Return serialized report with context
        serializer = ReviewReportSerializer(report, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PublicCertificateVerifyView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, cert_id):
        # Format is CERT-YYYY-XXXX where YYYY is student id and XXXX is course id
        parts = cert_id.split('-')
        if len(parts) != 3 or parts[0] != 'CERT':
            return Response({"error": "Invalid certificate format."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            student_id = int(parts[1])
            course_id = int(parts[2])
        except ValueError:
            return Response({"error": "Invalid certificate ID values."}, status=status.HTTP_400_BAD_REQUEST)
            
        enrollment = get_object_or_404(
            Enrollment.objects.select_related('student', 'course', 'course__mentor'),
            student_id=student_id,
            course_id=course_id,
            is_completed=True
        )
        
        student = enrollment.student
        course = enrollment.course
        
        return Response({
            "certificate_id": cert_id,
            "student_name": f"{student.first_name} {student.last_name}".strip() or student.username,
            "student_email": student.email,
            "course_title": course.title,
            "mentor_name": f"{course.mentor.first_name} {course.mentor.last_name}".strip() or course.mentor.username,
            "completion_date": enrollment.enrolled_at.strftime("%B %d, %Y"),
            "platform_name": "Online Learning Platform Academy"
        }, status=status.HTTP_200_OK)

