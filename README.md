# eduka - Full-Stack Online Learning Platform

eduka is a premium, full-stack online learning platform built with a **React (Vite) frontend** and a **Django REST Framework backend**, utilizing **MySQL** as the primary datastore. It is fully optimized for speed, responsive design, and local developer sandbox execution.

---

## 🚀 Key Features

### 👥 Roles & Access Control
- **Student:** Browse courses, enroll via sandbox checkouts, view lessons (Videos/PDFs/Markdown), track progress, ask/answer Q&A, rate/review modules, and verify certificates.
- **Mentor:** Create/edit courses, build lesson modules, set pricing, view financial sales metrics, and moderate course Q&A.
- **Admin:** Approve mentor verification requests, verify/approve draft courses, manage user flags, refund transactions, and export CSV ledger logs.

### 🛡️ Authentication & Security
- **JWT Authentication:** Dual-token (`access` + `refresh`) architecture for REST API calls.
- **WebSocket JWT Auth Middleware:** A custom connection-level `JWTAuthMiddleware` that extracts and decodes the JWT parameter from socket query strings to securely authenticate WebSocket connections.
- **Password Reset Wizard:** State-driven reset console integrated directly on the Login screen, dispatching secure 6-digit verification keys.
- **Autofill Protection:** Implements fake field interception to override browser credentials autofill, keeping placeholders pristine.

### 💳 Payment Integrations (Stripe & PayPal)
- **Stripe Session Checkout:** Real Stripe session redirection + developer-simulated Stripe checkout view.
- **Stripe Webhooks:** Dynamic event listeners (`checkout.session.completed`, dispute notifications) with automated database rollback handlers to revoke course access upon disputes.
- **PayPal Verification:** Sandbox capture hooks verifying order IDs before enrolling students.

### 💬 Real-Time Q&A, Moderation & In-App Alerts
- **WebSocket Rooms:** Course-specific real-time chat rooms powered by Django Channels (`ChatConsumer`).
- **Role-Based WebSocket Guard:** Prevents unauthorized connection access. Only course mentors, enrolled students, or administrators are permitted to connect.
- **Threaded Replies & Live Alerts:** Parent-message linking supports threaded Q&A replies. Sending a threaded reply triggers an automated Django signal to create a database `Notification` and dispatch real-time alerts.
- **Real-Time Moderation Console:** Allows course mentors and administrators to moderate Q&A messages. Moderate actions broadcast instantly to all connected WebSocket clients, masking the message content live.
- **In-App Notifications:** Real-time bell dropdown alerts powered by `NotificationConsumer` matching mail dispatches.

### 🔍 Weighted Relevance Search
- **Synonym Expansion:** Tokenizes search terms, expanding short synonyms (e.g. `js` -> `javascript`, `py` -> `python`).
- **Relevance Scoring:** SQL-level conditional scoring weighting Title matches (+10), Tag matches (+5), Mentors (+3), and Descriptions (+1).
- **Autocomplete:** Dropdown suggestion provider for courses, tags, and mentors.

### 📱 Responsive Docked Layout
- Full-height docked sidebar aligning borders with page headers.
- Auto-collapsing drawers below `768px` viewports, featuring blurred glass backdrops.
- Modulo-balanced Unsplash stock image pools loading unique thumbnails per course title.

---

## 🛠️ Technical Stack
- **Frontend:** React, Vite, Lucide Icons, Vanilla CSS Design System.
- **Backend:** Django, Django REST Framework, Django Channels (WebSockets).
- **Database:** MySQL / MariaDB (configured dynamically for XAMPP versions).

---

## ⚙️ Local Setup Guide

### 1. Database Configuration
1. Open **XAMPP Control Panel** and start **Apache** and **MySQL**.
2. Create a database named `edustack` in `phpMyAdmin`.
3. Check configuration settings in [.env](file:///d:/Internship/Week%2021/.env) inside the workspace root:
   ```ini
   DB_NAME="edustack"
   DB_USER="root"
   DB_PASSWORD=""
   DB_HOST="127.0.0.1"
   DB_PORT="3306"
   ```

### 2. Backend Installation & Migrations
1. Open a terminal in the `backend` folder:
   ```bash
   cd backend
   ```
2. Activate your virtual environment and install dependencies:
   ```bash
   ..\venv\Scripts\activate
   pip install django djangorestframework rest_framework_simplejwt django-cors-headers django-filter mysqlclient python-dotenv channels channels-redis stripe requests
   ```
3. Run database migrations:
   ```bash
   python manage.py migrate
   ```
4. Load the initial development database snapshot:
   ```bash
   python manage.py loaddata datadump.json
   ```
5. Start the ASGI developmental server:
   ```bash
   python manage.py runserver
   ```

### 3. Frontend Installation
1. Open a new terminal in the `frontend` folder:
   ```bash
   cd frontend
   npm install
   ```
2. Run the hot-reloading development server:
   ```bash
   npm run dev
   ```

### 4. Local Webhook Forwarding (Stripe CLI)
To forward Stripe events locally to your webhook receiver:
```bash
stripe listen --forward-to localhost:8000/api/payments/stripe/webhook/
```

---

## 📬 Development Emails, Password Reset & SMTP Verification
Since `EMAIL_BACKEND` is configured to output to the console during development, you can retrieve generated password reset verification codes by reading the terminal logs of your running `python manage.py runserver` terminal. Look for a block similar to:
```text
Subject: [eduka] Password Reset Verification Code
To: user@example.com

Hello,
Your password reset verification code is: XXXXXX
```
Copy and paste this code to proceed with the password reset wizard.

### 🧪 Verifying Real SMTP Setup
To verify that real SMTP server settings are correctly configured in production or custom development environments:
1. Authenticate with an active user account.
2. Send a `POST` request to:
   ```http
   POST /api/users/test-email/
   ```
3. The server will dispatch a test email verification directly to your authenticated email address.
