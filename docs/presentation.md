# Project Presentation - Online Learning Platform

## Slide 1: Title & Overview
- **Project Name:** EduStack Online Academy
- **Objective:** Full-Stack online learning platform enabling Student subscription, Mentor monetization, and Admin content/financial governance.
- **Tech Stack:**
  - **Frontend:** React + Vite (Vanilla CSS custom themes, Lucide icons, native WebSockets API)
  - **Backend:** Python + Django REST Framework + Django Channels
  - **Database:** SQLite (local development) / PostgreSQL (production ready configuration)
  - **Payment Gateways:** Stripe & PayPal sandbox checkout integrations

---

## Slide 2: System Architecture
- **API Architecture:** RESTful REST APIs with JWT session tokens (access + refresh rotation).
- **Real-Time Channels:** Django Channels utilizing ASGI server (Daphne). Matches per-course websocket chat rooms and user notifications feed.
- **Dynamic CSS Aesthetic:** Out-of-the-box responsive design system styling features glassmorphic widgets, glow highlights, harmonious colors (indigo/rose), and CSS animations.

---

## Slide 3: Database & ER Diagram
- **Custom User Model:** Handles authentication with unique email addresses, incorporating three primary roles: `STUDENT`, `MENTOR`, and `ADMIN`.
- **Course & Lesson Modules:** Dynamic modular curriculum structure support (Modules, Lessons, Quizzes with automatic pass/fail grading).
- **Ledger Audit trail:** Payments tracking links students to courses, maintaining status: `PENDING`, `COMPLETED`, `REFUNDED`, `DISPUTED`.

---

## Slide 4: Real-time Communication
- **Course Q&A Chat:**
  - Dynamic course rooms ensuring students only chat in courses they pay for.
  - Supports threaded replies (discussions) and post history persistence.
  - Moderator controls: Mentors can moderate message nodes instantly, masking flagged text.
- **System-wide Notifications:**
  - In-app notification bell synced via post-save django signals.
  - Instant pushes for approvals, purchases, chat activity, and refunds.

---

## Slide 5: Payment Integrations
- **Stripe Session Checkout:**
  - Creates Checkout session redirect.
  - Webhook listener triggers automatic enrollment and lessons progress list instantiation upon successful billing events.
  - Simulated fallback sandbox page replicates Stripe flow, allowing complete validation of webhooks, purchases, and successes locally.
- **Entitlement Rollback (Refunds):**
  - Admins can refund completed payments.
  - Instantly deletes enrollment and progress logs, removing access to course player resources.
