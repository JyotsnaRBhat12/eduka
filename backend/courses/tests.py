from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Course, Module, Lesson, Enrollment, LessonProgress
from payments.models import Payment

User = get_user_model()

class PlatformAPITests(APITestCase):
    def setUp(self):
        # Create Student
        self.student = User.objects.create_user(
            username='student',
            email='student@test.com',
            password='testpassword123',
            role=User.ROLE_STUDENT
        )
        
        # Create Mentor
        self.mentor = User.objects.create_user(
            username='mentor',
            email='mentor@test.com',
            password='testpassword123',
            role=User.ROLE_MENTOR
        )
        
        # Approved Course (Free)
        self.free_course = Course.objects.create(
            title='Free Intro Course',
            description='Test description',
            mentor=self.mentor,
            price=0.00,
            is_approved=True
        )
        
        # Approved Course (Paid)
        self.paid_course = Course.objects.create(
            title='Premium Masterclass',
            description='Paid test description',
            mentor=self.mentor,
            price=49.99,
            is_approved=True
        )

    def get_jwt_token(self, email, password):
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {'email': email, 'password': password})
        return response.data['access']

    def test_student_registration(self):
        url = reverse('auth_register')
        data = {
            'email': 'newstudent@test.com',
            'username': 'newstudent',
            'password': 'securepassword',
            'first_name': 'New',
            'last_name': 'Student',
            'role': User.ROLE_STUDENT
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.filter(email='newstudent@test.com').count(), 1)

    def test_mentor_registration_creates_profile(self):
        url = reverse('auth_register')
        data = {
            'email': 'newmentor@test.com',
            'username': 'newmentor',
            'password': 'securepassword',
            'first_name': 'New',
            'last_name': 'Mentor',
            'role': User.ROLE_MENTOR
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email='newmentor@test.com')
        self.assertTrue(hasattr(user, 'mentor_profile'))
        self.assertFalse(user.mentor_profile.is_approved)

    def test_course_browsing_permissions(self):
        # Public listing
        url = reverse('course-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return both free and paid approved courses
        self.assertEqual(len(response.data), 2)

    def test_free_course_enrollment(self):
        token = self.get_jwt_token('student@test.com', 'testpassword123')
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        
        url = reverse('course-enroll', args=[self.free_course.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Enrollment.objects.filter(student=self.student, course=self.free_course).exists())

    def test_paid_course_enrollment_fails_without_payment(self):
        token = self.get_jwt_token('student@test.com', 'testpassword123')
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        
        url = reverse('course-enroll', args=[self.paid_course.id])
        response = self.client.post(url)
        # Should return Payment Required
        self.assertEqual(response.status_code, status.HTTP_402_PAYMENT_REQUIRED)

    def test_paid_course_enrollment_succeeds_with_payment(self):
        token = self.get_jwt_token('student@test.com', 'testpassword123')
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        
        # Log mock payment
        Payment.objects.create(
            student=self.student,
            course=self.paid_course,
            gateway=Payment.GATEWAY_STRIPE,
            transaction_id="stripe_sess_completed_999",
            amount=49.99,
            status=Payment.STATUS_COMPLETED
        )
        
        url = reverse('course-enroll', args=[self.paid_course.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Enrollment.objects.filter(student=self.student, course=self.paid_course).exists())

    def test_create_course_with_tags_and_duration(self):
        token = self.get_jwt_token('mentor@test.com', 'testpassword123')
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        
        url = reverse('course-list')
        data = {
            'title': 'ReactJS Development',
            'description': 'Modern frontend development',
            'price': '9.99',
            'level': 'INTERMEDIATE',
            'language': 'Spanish',
            'duration_hours': 15,
            'tags': ['react', 'web']
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        course = Course.objects.get(title='ReactJS Development')
        self.assertEqual(course.duration_hours, 15)
        self.assertEqual(course.tags.count(), 2)
        self.assertTrue(course.tags.filter(name='react').exists())

    def test_course_filtering_and_custom_duration(self):
        # Update existing courses for testing filters
        self.free_course.duration_hours = 5
        self.free_course.language = 'English'
        self.free_course.level = Course.LEVEL_BEGINNER
        self.free_course.save()

        self.paid_course.duration_hours = 20
        self.paid_course.language = 'French'
        self.paid_course.level = Course.LEVEL_ADVANCED
        self.paid_course.save()

        url = reverse('course-list')
        
        # Test duration filter
        response = self.client.get(url, {'min_duration': 10, 'max_duration': 25})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.paid_course.id)

        # Test price_type free filter
        response = self.client.get(url, {'price_type': 'free'})
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.free_course.id)

    def test_synonym_search_relevance(self):
        # Create a course about JavaScript
        javascript_course = Course.objects.create(
            title='Learn JavaScript from Scratch',
            description='A comprehensive guide to JS coding.',
            mentor=self.mentor,
            price=0.00,
            is_approved=True
        )

        url = reverse('course-list')
        
        # Search by synonym "JS"
        response = self.client.get(url, {'search': 'js'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should return javascript_course because of JS/JavaScript synonym mapping
        course_ids = [c['id'] for c in response.data]
        self.assertIn(javascript_course.id, course_ids)

    def test_autocomplete_endpoint(self):
        # Create tag for lookup
        from .models import Tag
        Tag.objects.create(name='python')

        url = reverse('course-autocomplete')
        response = self.client.get(url, {'q': 'py'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check suggestions structure
        self.assertTrue(any(item['type'] == 'tag' and item['text'] == 'python' for item in response.data))

    def test_weighted_average_rating(self):
        # Create student users
        student_a = User.objects.create_user(
            username='studenta', email='studenta@test.com', password='testpassword123', role=User.ROLE_STUDENT
        )
        student_b = User.objects.create_user(
            username='studentb', email='studentb@test.com', password='testpassword123', role=User.ROLE_STUDENT
        )

        # Enrollments with different progress
        from .models import Enrollment, CourseReview
        Enrollment.objects.create(student=student_a, course=self.free_course, progress_percentage=100.00)
        Enrollment.objects.create(student=student_b, course=self.free_course, progress_percentage=20.00)

        # Reviews: student A rates 5, student B rates 2
        review_a = CourseReview.objects.create(student=student_a, course=self.free_course, rating=5, comment='Great')
        review_b = CourseReview.objects.create(student=student_b, course=self.free_course, rating=2, comment='Poor')

        # Calculations:
        # Student A weight: progress=1.0, recency=1.0 -> weight_a = 1.0
        # Student B weight: progress=0.2, recency=1.0 -> weight_b = 0.2
        # Weighted rating = (5 * 1.0 + 2 * 0.2) / (1.0 + 0.2) = 5.4 / 1.2 = 4.5
        self.assertEqual(self.free_course.average_rating, 4.5)

    def test_report_review_abuse_endpoint(self):
        student_a = User.objects.create_user(
            username='studenta_rep', email='studenta_rep@test.com', password='testpassword123', role=User.ROLE_STUDENT
        )
        student_b = User.objects.create_user(
            username='studentb_rep', email='studentb_rep@test.com', password='testpassword123', role=User.ROLE_STUDENT
        )

        from .models import CourseReview, ReviewReport
        review = CourseReview.objects.create(student=student_b, course=self.free_course, rating=4, comment='Spam comment')

        # Student A reports Student B's review
        token = self.get_jwt_token('studenta_rep@test.com', 'testpassword123')
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

        url = reverse('report_review', args=[review.id])
        response = self.client.post(url, {'reason': 'This is spam'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ReviewReport.objects.filter(review=review, reporter=student_a).count(), 1)

        # Try to report own review
        review_own = CourseReview.objects.create(student=student_a, course=self.free_course, rating=5, comment='My review')
        url_own = reverse('report_review', args=[review_own.id])
        response_own = self.client.post(url_own, {'reason': 'Spam'})
        self.assertEqual(response_own.status_code, status.HTTP_400_BAD_REQUEST)

        # Try to report same review twice
        response_dup = self.client.post(url, {'reason': 'Duplicate report'})
        self.assertEqual(response_dup.status_code, status.HTTP_400_BAD_REQUEST)

    def test_dispute_rollback(self):
        # 1. Create a module and lesson for the paid course
        module = Module.objects.create(
            course=self.paid_course,
            title='Module 1',
            order=1
        )
        lesson = Lesson.objects.create(
            module=module,
            title='Lesson 1',
            content_type=Lesson.TYPE_VIDEO,
            order=1
        )

        # 2. Create payment record for the paid course
        payment = Payment.objects.create(
            student=self.student,
            course=self.paid_course,
            gateway=Payment.GATEWAY_STRIPE,
            transaction_id="stripe_sess_to_dispute_999",
            amount=49.99,
            status=Payment.STATUS_COMPLETED
        )

        # 3. Enroll student and create lesson progress
        enrollment = Enrollment.objects.create(
            student=self.student,
            course=self.paid_course,
            progress_percentage=0.00
        )
        progress = LessonProgress.objects.create(
            student=self.student,
            lesson=lesson,
            is_completed=False
        )

        # Confirm database state before dispute
        self.assertTrue(Enrollment.objects.filter(student=self.student, course=self.paid_course).exists())
        self.assertTrue(LessonProgress.objects.filter(student=self.student, lesson=lesson).exists())

        # 4. Post simulated dispute webhook
        url = reverse('stripe_webhook')
        data = {
            'is_mock_trigger': True,
            'transaction_id': 'stripe_sess_to_dispute_999',
            'action': 'disputed'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 5. Assert rollback took effect
        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.STATUS_DISPUTED)

        # Enrollment and lesson progress should be deleted
        self.assertFalse(Enrollment.objects.filter(student=self.student, course=self.paid_course).exists())
        self.assertFalse(LessonProgress.objects.filter(student=self.student, lesson=lesson).exists())

        # Notifications should be created for both student and mentor
        from notifications.models import Notification
        student_notif = Notification.objects.filter(recipient=self.student, title="Access Suspended (Dispute)")
        self.assertTrue(student_notif.exists())
        mentor_notif = Notification.objects.filter(recipient=self.mentor, title="Enrollment Revoked (Dispute)")
        self.assertTrue(mentor_notif.exists())


