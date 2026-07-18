# eduka - Full-Stack Online Learning Platform

**eduka** is a state-of-the-art, full-stack e-learning platform built with a **React (Vite) frontend** and a **Django REST Framework backend** powered by **MySQL / MariaDB**. Designed for high performance, dynamic responsiveness, glassmorphic UI aesthetics, and enterprise-grade payment fulfillment.

---

## 🌟 Key Features & Ecosystem

### 👥 Multi-Role Authorization & Access Control
- **Student Role:**
  - **Course Discovery & Filtering:** Interactive catalog with category filters, level indicators, and relevance search.
  - **Course Player:** Interactive video streaming, lesson progress tracking, embedded PDF viewing, and end-of-module quizzes.
  - **Learner Dashboard & My Learning:** Track in-progress courses, completed courses, and earned credentials.
  - **Payment History Ledger:** Dedicated student transaction history tab displaying course title, payment gateway, transaction ID, date, amount (in Rs), and status badges.
  - **Verified Certificate Validation:** Public certificate verification engine with unique credential ID validation.
- **Mentor Role:**
  - **Course Builder:** Create, edit, and organize courses, modules, video lessons, and quiz questions.
  - **Analytics Console:** Track total students, course completion rates, total sales, and revenue metrics.
  - **Q&A Moderation:** Moderate student inquiries and discussions live inside course Q&A panels.
- **Admin Console:**
  - **User Administration:** View user directory, toggle active/suspended statuses, and manage role permissions.
  - **Course Approval Workflow:** Moderate and approve mentor-submitted course drafts.
  - **Financial Ledger & Refund Management:** Track system revenue, issue student refunds, and simulate payment dispute resolution.
  - **CSV Export:** One-click automated export of transaction history logs to CSV format.
  - **System Reports:** Live metrics on overall revenue, registered students, mentors, courses, and enrollments.

---

### 💳 Payment Integrations (Stripe & PayPal)
- **Stripe Checkout & Instant Fulfillment:**
  - Seamless redirection to real Stripe Checkout or simulated local developer sandbox.
  - **Instant Synchronous Verification:** Automatically verifies payment status synchronously upon return to the success page, auto-enrolling students in `< 0.1s` without relying solely on asynchronous webhook arrival.
  - **Dynamic `FRONTEND_URL` Redirects:** Dynamically constructs return URLs based on environment settings for both local development and live Railway/Vercel deployments.
  - **Automated Dispute Rollbacks:** Handles dispute webhooks (`charge.dispute.created`) by automatically revoking course access and notifying student & mentor.
- **PayPal Integration:** Sandbox order verification hooks that validate PayPal order IDs before granting course access.

---

### 💬 Real-Time Features & Moderation
- **WebSocket Q&A Rooms:** Course-specific chat rooms powered by Django Channels (`ChatConsumer`) with JWT query parameter authentication.
- **Role-Based WebSocket Security:** Restricted connection handling allowing only enrolled students, course mentors, or admins to join chat channels.
- **Live Notifications:** In-app notification bell dispatches real-time alerts upon course purchases, password resets, refunds, and Q&A replies.

---

### 🔍 Weighted Relevance Search
- **Synonym Expansion:** Intelligently expands common terms (e.g. `js` → `javascript`, `py` → `python`).
- **Relevance Scoring:** SQL-level weighted search matching Title (+10), Tag (+5), Mentor (+3), and Description (+1).
- **Autocomplete Suggestions:** Live instant suggestions for courses, tags, and instructors.

---

## 🛠️ Technology Stack

- **Frontend:** React, Vite, React Router DOM, Lucide Icons, Vanilla CSS (Glassmorphism & Modern Design Tokens).
- **Backend:** Python 3.10+, Django 5.x, Django REST Framework (DRF), SimpleJWT, Django Channels (WebSockets).
- **Database:** MySQL / MariaDB (XAMPP / Railway MySQL).
- **Payment Processing:** Stripe API SDK, PayPal REST SDK.
- **Deployment:** Railway (Backend + MySQL), Vercel / Railway (Frontend).

---

## ⚙️ Development & Local Setup Guide

### 1. Database Setup
1. Start **Apache** and **MySQL** in **XAMPP Control Panel**.
2. Open `phpMyAdmin` (`http://localhost/phpmyadmin`) and create a database named `edustack` (or `railway`).
3. Create or update your root `.env` file:
   ```ini
   DB_NAME="edustack"
   DB_USER="root"
   DB_PASSWORD=""
   DB_HOST="127.0.0.1"
   DB_PORT="3306"
   SECRET_KEY="your-django-secret-key"
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   FRONTEND_URL="http://localhost:5173"
   ```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
..\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install django djangorestframework rest_framework_simplejwt django-cors-headers django-filter mysqlclient python-dotenv channels channels-redis stripe requests

python manage.py migrate
python manage.py runserver
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🚀 Production Deployment Guide (Railway & Vercel)

### Backend Environment Variables (Railway)
In Railway -> Backend Service -> **Variables**:
```env
DB_NAME=railway
DB_USER=root
DB_PASSWORD=your_railway_db_password
DB_HOST=tokaido.proxy.rlwy.net
DB_PORT=53344
SECRET_KEY=your-production-secret-key
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://eduka-frontend-production.up.railway.app
```

### Frontend Environment Variables (Vercel / Railway)
In Frontend Environment Variables:
```env
VITE_API_URL=https://eduka-production-8b66.up.railway.app
VITE_WS_URL=wss://eduka-production-8b66.up.railway.app
```

---

## 📬 API Endpoints Summary

### Authentication & Users
- `POST /api/users/register/` — Register new user
- `POST /api/users/login/` — Authenticate user & retrieve JWT access/refresh tokens
- `GET/PUT /api/users/profile/` — Fetch and update user profile details
- `POST /api/users/password-reset/request/` — Request 6-digit password reset code
- `POST /api/users/password-reset/confirm/` — Verify reset code & update password

### Courses & Learning
- `GET /api/courses/` — List all published courses with enrollment status
- `GET /api/courses/:id/` — Detailed course view with curriculum and modules
- `POST /api/courses/:id/enroll/` — Free course enrollment
- `POST /api/lessons/:id/progress/` — Toggle lesson completion progress

### Payments & Purchases
- `POST /api/payments/stripe/create-checkout-session/` — Generate Stripe Checkout Session URL
- `POST /api/payments/stripe/webhook/` — Asynchronous Stripe event listener
- `GET /api/payments/stripe/status/?session_id=...` — Synchronous status verification & instant fulfillment
- `GET /api/payments/my-history/` — Student transaction history log
- `GET /api/payments/admin/all/` — Admin transaction ledger
- `POST /api/payments/admin/refund/:id/` — Admin refund processor

---

## 🛡️ License

This project is open-source and available under the **MIT License**.
