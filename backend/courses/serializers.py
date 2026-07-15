from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Tag, Course, Module, Lesson, Quiz, Question, Answer, Enrollment, LessonProgress, CourseReview, ReviewReport
from chat.models import QAMessage

User = get_user_model()

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']

class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ['id', 'text', 'is_correct']
        extra_kwargs = {'is_correct': {'write_only': True}} # hide in public API, except when taking the quiz? Wait, let's hide it from students during lessons, but let's check. Yes, write_only is perfect or we can strip it in views!


class QuestionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'answers']


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'passing_score', 'questions']


class LessonSerializer(serializers.ModelSerializer):
    quiz = QuizSerializer(read_only=True)
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'content_type', 'video_url', 'pdf_file', 'document_content', 'duration_minutes', 'order', 'quiz', 'is_completed']

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return LessonProgress.objects.filter(student=request.user, lesson=obj, is_completed=True).exists()
        return False


class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ['id', 'title', 'order', 'lessons']


class MentorMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class CourseReviewSerializer(serializers.ModelSerializer):
    student_email = serializers.ReadOnlyField(source='student.email')
    student_name = serializers.SerializerMethodField()
    reports_count = serializers.SerializerMethodField()
    has_reported = serializers.SerializerMethodField()

    class Meta:
        model = CourseReview
        fields = ['id', 'student', 'student_email', 'student_name', 'rating', 'comment', 'is_moderated', 'reports_count', 'has_reported', 'created_at']
        read_only_fields = ['student', 'is_moderated']

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip() or obj.student.username

    def get_reports_count(self, obj):
        return obj.reports.count()

    def get_has_reported(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.reports.filter(reporter=request.user).exists()
        return False


class ReviewReportSerializer(serializers.ModelSerializer):
    reporter_email = serializers.ReadOnlyField(source='reporter.email')

    class Meta:
        model = ReviewReport
        fields = ['id', 'review', 'reporter', 'reporter_email', 'reason', 'created_at']
        read_only_fields = ['reporter']

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['reporter'] = request.user
        return super().create(validated_data)


class CourseSerializer(serializers.ModelSerializer):
    mentor = MentorMinimalSerializer(read_only=True)
    modules = ModuleSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    average_rating = serializers.ReadOnlyField()
    is_enrolled = serializers.SerializerMethodField()
    enrollment_progress = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'mentor', 'price', 'language', 
            'level', 'duration_hours', 'thumbnail', 'tags', 'is_approved', 
            'average_rating', 'is_enrolled', 'enrollment_progress', 
            'modules', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'mentor', 'is_approved', 'average_rating', 'created_at', 'updated_at']

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Enrollment.objects.filter(student=request.user, course=obj).exists()
        return False

    def get_enrollment_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            enrollment = Enrollment.objects.filter(student=request.user, course=obj).first()
            return enrollment.progress_percentage if enrollment else 0.00
        return 0.00


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(child=serializers.CharField(), required=False, write_only=True)

    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'price', 'language', 'level', 'duration_hours', 'thumbnail', 'tags']

    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        request = self.context.get('request')
        validated_data['mentor'] = request.user
        validated_data['is_approved'] = False # Needs admin approval
        course = super().create(validated_data)
        for tag_name in tags_data:
            tag, _ = Tag.objects.get_or_create(name=tag_name.strip())
            course.tags.add(tag)
        return course

    def update(self, instance, validated_data):
        tags_data = validated_data.pop('tags', None)
        course = super().update(instance, validated_data)
        if tags_data is not None:
            course.tags.clear()
            for tag_name in tags_data:
                tag, _ = Tag.objects.get_or_create(name=tag_name.strip())
                course.tags.add(tag)
        return course

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['tags'] = [tag.name for tag in instance.tags.all()]
        return ret


class EnrollmentSerializer(serializers.ModelSerializer):
    course_title = serializers.ReadOnlyField(source='course.title')
    course_thumbnail = serializers.ImageField(source='course.thumbnail', read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'course', 'course_title', 'course_thumbnail', 'enrolled_at', 'progress_percentage', 'is_completed', 'certificate_url']
        read_only_fields = ['student', 'enrolled_at', 'progress_percentage', 'is_completed', 'certificate_url']


class QAMessageSenderSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']


class QAMessageSerializer(serializers.ModelSerializer):
    sender = QAMessageSenderSerializer(read_only=True)
    parent_id = serializers.ReadOnlyField(source='parent_message_id')

    class Meta:
        model = QAMessage
        fields = ['id', 'content', 'parent_id', 'sender', 'is_moderated', 'created_at']

