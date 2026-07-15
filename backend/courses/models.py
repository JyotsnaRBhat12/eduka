from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Course(models.Model):
    LEVEL_BEGINNER = 'BEGINNER'
    LEVEL_INTERMEDIATE = 'INTERMEDIATE'
    LEVEL_ADVANCED = 'ADVANCED'
    
    LEVEL_CHOICES = [
        (LEVEL_BEGINNER, 'Beginner'),
        (LEVEL_INTERMEDIATE, 'Intermediate'),
        (LEVEL_ADVANCED, 'Advanced'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_courses',
        limit_choices_to={'role': 'MENTOR'}
    )
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    language = models.CharField(max_length=50, default='English')
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default=LEVEL_BEGINNER)
    duration_hours = models.PositiveIntegerField(default=0)
    thumbnail = models.ImageField(upload_to='thumbnails/', null=True, blank=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name='courses')
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    @property
    def average_rating(self):
        from django.utils import timezone
        reviews = self.reviews.filter(is_moderated=False)
        if not reviews.exists():
            return 0.0
        
        total_weight = 0.0
        weighted_sum = 0.0
        
        for r in reviews:
            progress_factor = 1.0
            enrollment = self.enrollments.filter(student=r.student).first()
            if enrollment:
                progress_factor = max(float(enrollment.progress_percentage) / 100.0, 0.2)
            
            age_days = (timezone.now() - r.created_at).days
            if age_days <= 30:
                recency_factor = 1.0
            elif age_days <= 90:
                recency_factor = 0.7
            else:
                recency_factor = 0.4
                
            weight = progress_factor * recency_factor
            weighted_sum += r.rating * weight
            total_weight += weight
            
        if total_weight == 0.0:
            return 0.0
            
        return round(weighted_sum / total_weight, 1)


class Module(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.course.title} - {self.title}"


class Lesson(models.Model):
    TYPE_VIDEO = 'VIDEO'
    TYPE_PDF = 'PDF'
    TYPE_DOCUMENT = 'DOCUMENT'
    
    TYPE_CHOICES = [
        (TYPE_VIDEO, 'Video'),
        (TYPE_PDF, 'PDF'),
        (TYPE_DOCUMENT, 'Document'),
    ]

    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    content_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_VIDEO)
    video_url = models.URLField(blank=True, null=True)  # YouTube / Vimeo / S3 url
    pdf_file = models.FileField(upload_to='lessons/pdfs/', blank=True, null=True)
    document_content = models.TextField(blank=True, null=True)  # Rich text/Markdown
    duration_minutes = models.PositiveIntegerField(default=0)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.module.title} - {self.title}"


class Quiz(models.Model):
    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name='quiz')
    title = models.CharField(max_length=200)
    passing_score = models.PositiveIntegerField(default=70, help_text="Passing percentage (e.g. 70)")

    def __str__(self):
        return f"Quiz: {self.title} ({self.lesson.title})"


class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()

    def __str__(self):
        return self.text


class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.text} (Correct: {self.is_correct})"


class Enrollment(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enrollments',
        limit_choices_to={'role': 'STUDENT'}
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    is_completed = models.BooleanField(default=False)
    certificate_url = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        unique_together = ('student', 'course')

    def __str__(self):
        return f"{self.student.email} enrolled in {self.course.title}"


class LessonProgress(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='progress')
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'lesson')

    def __str__(self):
        return f"{self.student.email} - {self.lesson.title} (Completed: {self.is_completed})"


class CourseReview(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews',
        limit_choices_to={'role': 'STUDENT'}
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    is_moderated = models.BooleanField(default=False)  # Admin moderation flag for abuse
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'course')

    def __str__(self):
        return f"Review by {self.student.email} on {self.course.title} ({self.rating}/5)"


class ReviewReport(models.Model):
    review = models.ForeignKey(CourseReview, on_delete=models.CASCADE, related_name='reports')
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('review', 'reporter')

    def __str__(self):
        return f"Report on review {self.review.id} by {self.reporter.email}"


# Signal to create notifications for students when a new lesson is added
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Lesson)
def notify_students_new_lesson(sender, instance, created, **kwargs):
    if created:
        from notifications.models import Notification
        course = instance.module.course
        # Get all enrolled students
        enrollments = Enrollment.objects.filter(course=course)
        for enrollment in enrollments:
            # Create lesson progress dynamically for this new lesson
            LessonProgress.objects.get_or_create(
                student=enrollment.student,
                lesson=instance,
                defaults={'is_completed': False}
            )
            # Send Notification
            Notification.objects.create(
                recipient=enrollment.student,
                title="New Lesson Published",
                message=f"A new lesson '{instance.title}' has been added to module '{instance.module.title}' in the course '{course.title}'. Check it out!",
                notification_type=Notification.TYPE_LESSON
            )
