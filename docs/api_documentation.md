# API Documentation - Online Learning Platform

This document describes the REST API endpoints and WebSocket channels available on the platform. All REST endpoints prefix with `/api/` (except auth URLs which prefix with `/api/users/`).

---

## 1. Authentication Endpoints

### Register User
* **URL:** `/api/users/register/`
* **Method:** `POST`
* **Payload:**
  ```json
  {
    "email": "student@example.com",
    "username": "student1",
    "password": "securepassword123",
    "first_name": "John",
    "last_name": "Doe",
    "role": "STUDENT" // or "MENTOR"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "email": "student@example.com",
    "username": "student1",
    "first_name": "John",
    "last_name": "Doe",
    "role": "STUDENT"
  }
  ```

### Login / Obtain JWT
* **URL:** `/api/users/login/`
* **Method:** `POST`
* **Payload:**
  ```json
  {
    "email": "student@example.com",
    "password": "securepassword123"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "access": "eyJhbGci...",
    "refresh": "eyJhbGci...",
    "user": {
      "id": 1,
      "email": "student@example.com",
      "username": "student1",
      "first_name": "John",
      "last_name": "Doe",
      "role": "STUDENT"
    }
  }
  ```

---

## 2. Course & Learning Endpoints

### List / Search Courses
* **URL:** `/api/courses/`
* **Method:** `GET`
* **Query Parameters:**
  * `search`: Searches titles & descriptions
  * `level`: `BEGINNER`, `INTERMEDIATE`, or `ADVANCED`
  * `price_type`: `free` or `paid`
  * `min_rating`: `4` or `4.5` (returns courses matching or exceeding this value)
* **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "title": "Introduction to Python & Django",
      "description": "Learn Django from absolute scratch...",
      "mentor": {
        "id": 2,
        "username": "mentor1",
        "email": "mentor@example.com"
      },
      "price": "0.00",
      "level": "BEGINNER",
      "language": "English",
      "average_rating": 4.8,
      "is_enrolled": true,
      "enrollment_progress": 25.00
    }
  ]
  ```

### Enroll in Course
* **URL:** `/api/courses/{course_id}/enroll/`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <JWT_ACCESS_TOKEN>`
* **Response (210 Created):**
  ```json
  {
    "id": 1,
    "student": 1,
    "course": 1,
    "enrolled_at": "2026-06-16T10:30:00Z",
    "progress_percentage": "0.00",
    "is_completed": false,
    "certificate_url": null
  }
  ```

### Submit Quiz
* **URL:** `/api/lessons/{lesson_id}/quiz/submit/`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <JWT_ACCESS_TOKEN>`
* **Payload:**
  ```json
  {
    "answers": {
      "14": 42, // question_id: answer_id
      "15": 45
    }
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "score": 100.0,
    "passing_score": 70,
    "passed": true,
    "correct_count": 2,
    "total_questions": 2
  }
  ```

---

## 3. WebSockets Channels

### Q&A Chat Room
* **URL:** `ws://localhost:8000/ws/chat/{course_id}/?token=<JWT_ACCESS_TOKEN>`
* **Actions:**
  * **Send message:**
    ```json
    {
      "action": "message",
      "content": "Is Django Channels compatible with Redis cluster?",
      "parent_id": null // or message_id for threads
    }
    ```
  * **Moderate message (Mentors / Admins only):**
    ```json
    {
      "action": "moderate",
      "message_id": 4
    }
    ```

### Notifications Feed
* **URL:** `ws://localhost:8000/ws/notifications/?token=<JWT_ACCESS_TOKEN>`
* **Actions:**
  * **Dismiss Notification:**
    ```json
    {
      "action": "mark_read",
      "notification_id": 12
    }
    ```

---

## 4. Payment Integrations

### Create Stripe Checkout Session
* **URL:** `/api/payments/stripe/create-checkout-session/`
* **Method:** `POST`
* **Payload:** `{"course_id": 2}`
* **Response (200 OK):**
  ```json
  {
    "url": "http://localhost:5173/payment/mock-stripe-checkout?course_id=2&transaction_id=stripe_sess_1_2",
    "is_mock": true
  }
  ```
