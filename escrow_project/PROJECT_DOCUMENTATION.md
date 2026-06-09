# EscrowNG — Complete Project Documentation

**Project Title:** Escrow-Based Online Payment System for the Nigerian Digital Marketplace  
**Institution:** Covenant University, Department of Computer & Information Sciences  
**Level:** Final Year Project  
**Server:** http://127.0.0.1:8000  
**Project Directory:** `c:\Users\USER\Desktop\Escrow\escrow_project\`

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Complete File Structure](#4-complete-file-structure)
5. [Database Schema & Models](#5-database-schema--models)
6. [Service Layer (Business Logic)](#6-service-layer-business-logic)
7. [Views & URL Reference](#7-views--url-reference)
8. [Authentication & MFA](#8-authentication--mfa)
9. [Escrow Lifecycle](#9-escrow-lifecycle)
10. [Dispute System](#10-dispute-system)
11. [Notification System](#11-notification-system)
12. [Dashboards](#12-dashboards)
13. [Background Scheduler (Automation)](#13-background-scheduler-automation)
14. [Management Commands](#14-management-commands)
15. [Templates & UI Design](#15-templates--ui-design)
16. [CSS Design System](#16-css-design-system)
17. [Security Configuration](#17-security-configuration)
18. [Settings Reference](#18-settings-reference)
19. [Environment Variables](#19-environment-variables)
20. [Installation & Setup](#20-installation--setup)
21. [Demo Credentials](#21-demo-credentials)
22. [Running the Project](#22-running-the-project)
23. [Complete Source Code](#23-complete-source-code)

---

## 1. PROJECT OVERVIEW

EscrowNG is a full-stack web application that acts as a trusted neutral third party between buyers and sellers in Nigerian digital commerce. When a buyer creates a transaction, their funds are held securely in an escrow account. The seller only receives the funds after the buyer confirms satisfactory delivery. If there is a disagreement, either party can raise a formal dispute which an administrator reviews and resolves.

### Core Value Proposition

- **Trust:** Neither party can lose money to fraud — the buyer cannot claim back funds after confirmed delivery, and the seller cannot receive funds before delivery is confirmed.
- **Transparency:** Every fund movement is immutably logged in an audit trail.
- **Automation:** Confirmed transactions auto-release funds after 1 minute (demo) / configurable window without requiring manual admin intervention.
- **Security:** MFA, Argon2 password hashing, CSRF protection, role-based access control.

### Key Implemented Features

| Feature | Details |
|---|---|
| User registration & login | Email-based, role selection (Buyer/Seller) |
| Two-Factor Authentication (MFA) | TOTP via QR code — Google Authenticator / Authy compatible |
| Transaction lifecycle | Full 8-state machine with enforced transitions |
| Escrow fund holding | EscrowAccount created automatically on transaction initiation |
| Immutable audit log | Every fund movement recorded in EscrowLog |
| Automatic fund release | APScheduler fires every 30s; releases CONFIRMED funds after 1 minute |
| Dispute filing | Evidence file upload (PDF/JPG/PNG, max 5MB) |
| Dispute resolution | Admin panel with 3 resolution options; auto-flags overdue after 2 minutes |
| In-app notifications | Bell icon with unread count; AJAX mark-read |
| Email notifications | Django SMTP for all key events (fail-silently if not configured) |
| Role-based dashboards | Separate views for Buyer, Seller, Admin |
| Admin stats panel | Live dispute countdown timers via JavaScript |
| Django admin panel | Full admin interface at `/admin/` |

---

## 2. TECHNOLOGY STACK

| Layer | Technology | Version |
|---|---|---|
| Language | Python | 3.14.4 |
| Web framework | Django | 6.0.5 |
| Database | PostgreSQL | 17.6 |
| Database adapter | psycopg2-binary | 2.9.12 |
| ORM | Django ORM | built-in |
| Authentication | Django built-in auth | built-in |
| MFA / TOTP | pyotp + django-otp | 2.9.0 / 1.7.0 |
| QR Code generation | qrcode + Pillow | 8.2 / 12.2.0 |
| Password hashing | argon2-cffi | 25.1.0 |
| Background scheduler | APScheduler | 3.11.2 |
| Static file serving | WhiteNoise | 6.12.0 |
| Environment config | python-dotenv | 1.2.2 |
| DB URL parsing | dj-database-url | 3.1.2 |
| Forms helper | django-crispy-forms | 2.6 |
| Frontend | Vanilla HTML5 + CSS3 + JavaScript | (no frameworks) |
| Fonts | Inter (Google Fonts) | via CDN |

---

## 3. SYSTEM ARCHITECTURE

### High-Level Flow

```
Browser
  │
  ▼
Django Middleware Stack
  │  SecurityMiddleware → WhiteNoise → SessionMiddleware → CSRF
  │  AuthenticationMiddleware → OTPMiddleware → MessageMiddleware
  ▼
URL Router (escrow_project/urls.py)
  │
  ├─── /accounts/   → apps.accounts.views
  ├─── /dashboard/  → apps.dashboard.views
  ├─── /transactions/ → apps.transactions.views
  ├─── /escrow/     → apps.escrow.views
  ├─── /disputes/   → apps.disputes.views
  ├─── /notifications/ → apps.notifications.views
  └─── /admin/      → Django admin
  │
  ▼
View Layer (permission checks, form validation)
  │
  ▼
Service Layer (business logic — no ORM in views)
  │  apps.transactions.services
  │  apps.escrow.services
  │  apps.disputes.services
  │  apps.notifications.services
  ▼
Django ORM → PostgreSQL (escrow_db)
  │
  ▼
Templates (templates/) + Static files (static/)
```

### App Dependencies

```
accounts     ← (no app dependencies)
transactions ← accounts
escrow       ← transactions, accounts
disputes     ← transactions, accounts, escrow, notifications
notifications← transactions, accounts
dashboard    ← transactions, disputes, notifications
scheduler    ← transactions.services, disputes.models (runs in background thread)
```

### Background Scheduler Architecture

```
Django startup
  └─ apps.dashboard.apps.DashboardConfig.ready()
       └─ apps.scheduler.start()
            └─ APScheduler BackgroundScheduler (thread)
                 ├─ Job: auto_release_funds  (every 30s)
                 │    └─ transactions.services.auto_release_check()
                 │         └─ escrow.services.release_funds()
                 └─ Job: flag_overdue_disputes (every 30s)
                      └─ disputes.models.Dispute → status = OVERDUE
                           └─ email admins
```

---

## 4. COMPLETE FILE STRUCTURE

```
escrow_project/
│
├── manage.py                          Django management entry point
├── requirements.txt                   Python dependencies
├── .env                               Secrets (not committed)
├── .env.example                       Environment template
├── .gitignore                         Git ignore rules
├── README.md                          Quick-start guide
├── PROJECT_DOCUMENTATION.md          This document
│
├── escrow_project/                    Django project config package
│   ├── __init__.py
│   ├── settings.py                    All Django settings
│   ├── urls.py                        Root URL configuration
│   ├── wsgi.py                        WSGI entry point (production)
│   └── asgi.py                        ASGI entry point (async)
│
├── apps/                              All Django applications
│   ├── __init__.py
│   ├── scheduler.py                   APScheduler background jobs
│   │
│   ├── accounts/                      User management
│   │   ├── __init__.py
│   │   ├── apps.py                    AccountsConfig
│   │   ├── models.py                  CustomUser model
│   │   ├── views.py                   register, login, MFA, profile, logout
│   │   ├── forms.py                   RegisterForm, LoginForm, MFAVerifyForm, ProfileForm
│   │   ├── urls.py                    accounts/ URL patterns
│   │   ├── decorators.py              role_required decorator
│   │   ├── admin.py                   CustomUserAdmin
│   │   └── management/
│   │       └── commands/
│   │           └── seed_demo_data.py  Demo users + transactions
│   │
│   ├── transactions/                  Escrow transaction lifecycle
│   │   ├── __init__.py
│   │   ├── apps.py                    TransactionsConfig
│   │   ├── models.py                  Transaction model + state machine
│   │   ├── views.py                   create, list, detail, deliver, confirm, cancel
│   │   ├── forms.py                   CreateTransactionForm
│   │   ├── urls.py                    transactions/ URL patterns
│   │   ├── services.py                Business logic functions
│   │   ├── admin.py                   TransactionAdmin
│   │   └── management/
│   │       └── commands/
│   │           └── auto_release_funds.py  Manual cron command
│   │
│   ├── escrow/                        Fund holding logic
│   │   ├── __init__.py
│   │   ├── apps.py                    EscrowConfig
│   │   ├── models.py                  EscrowAccount + EscrowLog
│   │   ├── views.py                   Admin manual release/refund
│   │   ├── urls.py                    escrow/ URL patterns
│   │   ├── services.py                initiate, release, refund, partial_release
│   │   └── admin.py                   EscrowAccountAdmin + EscrowLogInline
│   │
│   ├── disputes/                      Dispute filing and resolution
│   │   ├── __init__.py
│   │   ├── apps.py                    DisputesConfig
│   │   ├── models.py                  Dispute model
│   │   ├── views.py                   raise, detail, resolve
│   │   ├── urls.py                    disputes/ URL patterns
│   │   ├── services.py                raise_dispute, resolve_dispute
│   │   ├── admin.py                   DisputeAdmin
│   │   └── management/
│   │       └── commands/
│   │           └── flag_overdue_disputes.py  Manual cron command
│   │
│   ├── notifications/                 In-app + email notifications
│   │   ├── __init__.py
│   │   ├── apps.py                    NotificationsConfig
│   │   ├── models.py                  Notification + NotificationTemplate
│   │   ├── views.py                   list, mark_read, mark_all_read
│   │   ├── urls.py                    notifications/ URL patterns
│   │   ├── services.py                notify() + all event-specific helpers
│   │   ├── context_processors.py      unread_count injected into all templates
│   │   └── admin.py                   NotificationAdmin
│   │
│   └── dashboard/                     Role-based dashboards
│       ├── __init__.py
│       ├── apps.py                    DashboardConfig + scheduler startup
│       ├── views.py                   index, buyer, seller, admin dashboards
│       └── urls.py                    dashboard/ URL patterns
│
├── templates/                         All HTML templates
│   ├── base.html                      Master layout (sidebar + topbar + messages)
│   ├── accounts/
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── mfa_setup.html             QR code setup page
│   │   ├── mfa_verify.html            Login MFA code entry
│   │   └── profile.html
│   ├── transactions/
│   │   ├── create.html
│   │   ├── list.html
│   │   ├── detail.html                Timeline + audit log + action buttons
│   │   └── _table.html                Reusable transaction table partial
│   ├── disputes/
│   │   ├── raise.html                 Dispute filing form
│   │   └── detail.html                Split view + admin resolution panel
│   ├── dashboard/
│   │   ├── buyer.html
│   │   ├── seller.html
│   │   └── admin.html                 Stats + dispute timers
│   └── notifications/
│       └── list.html                  Notification inbox
│
├── static/                            Static assets (source)
│   ├── css/
│   │   └── main.css                   Complete design system (~700 lines)
│   ├── js/
│   │   └── main.js                    Flash auto-dismiss, confirm dialogs
│   └── images/                        (empty — for future use)
│
└── media/                             User-uploaded files (runtime)
    ├── profiles/                      Profile pictures
    └── evidence/                      Dispute evidence files
```

---

## 5. DATABASE SCHEMA & MODELS

### Database: `escrow_db` (PostgreSQL 17)

All tables use `BigAutoField` as the default integer primary key. UUIDs are used for all public-facing identifiers.

---

### 5.1 CustomUser (`accounts_customuser`)

**File:** `apps/accounts/models.py`  
**Extends:** `django.contrib.auth.models.AbstractUser`  
**Login field:** `email` (username removed)

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BigInteger | PK, auto | Internal primary key |
| `email` | VARCHAR(254) | UNIQUE, NOT NULL | Primary login identifier |
| `full_name` | VARCHAR(255) | | Display name |
| `phone_number` | VARCHAR(20) | | Optional contact number |
| `role` | VARCHAR(10) | CHOICES | `BUYER`, `SELLER`, or `ADMIN` |
| `profile_picture` | ImageField | nullable | Stored in `media/profiles/` |
| `is_verified` | BOOLEAN | default `False` | Email verified flag |
| `mfa_enabled` | BOOLEAN | default `False` | TOTP MFA active |
| `mfa_secret` | VARCHAR(64) | | Base32 TOTP secret key |
| `created_at` | TIMESTAMPTZ | auto | Account creation time |
| `updated_at` | TIMESTAMPTZ | auto | Last profile update |
| `is_active` | BOOLEAN | default `True` | Inherited from AbstractUser |
| `is_staff` | BOOLEAN | default `False` | Django admin access |
| `is_superuser` | BOOLEAN | default `False` | Full permissions |
| `last_login` | TIMESTAMPTZ | nullable | Inherited |
| `date_joined` | TIMESTAMPTZ | auto | Inherited |

**Role choices:**
- `BUYER` — Can create transactions, confirm delivery, raise disputes
- `SELLER` — Can mark transactions delivered, raise disputes
- `ADMIN` — Full access; receives dispute alerts; can release/refund funds

**Methods:**
- `get_initials()` — Returns 2-letter initials from `full_name` for avatar display

**Source code:**
```python
class CustomUser(AbstractUser):
    class Role(models.TextChoices):
        BUYER = 'BUYER', 'Buyer'
        SELLER = 'SELLER', 'Seller'
        ADMIN = 'ADMIN', 'Admin'

    username = None
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.BUYER)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']
```

---

### 5.2 Transaction (`transactions_transaction`)

**File:** `apps/transactions/models.py`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BigInteger | PK, auto | Internal PK |
| `transaction_id` | UUID | UNIQUE, auto-generated | Public-facing identifier |
| `reference` | VARCHAR(20) | UNIQUE | Human-readable e.g. `ESC-2026-00001` |
| `buyer_id` | BigInteger | FK → CustomUser | PROTECT on delete |
| `seller_id` | BigInteger | FK → CustomUser | PROTECT on delete |
| `title` | VARCHAR(255) | NOT NULL | Short transaction name |
| `description` | TEXT | NOT NULL | Full details |
| `amount` | DECIMAL(14,2) | NOT NULL | Transaction value |
| `currency` | VARCHAR(3) | default `NGN` | Currency code |
| `status` | VARCHAR(15) | CHOICES | Current lifecycle state |
| `delivery_deadline` | TIMESTAMPTZ | NOT NULL | When seller must deliver by |
| `confirmed_at` | TIMESTAMPTZ | nullable | When buyer confirmed receipt |
| `created_at` | TIMESTAMPTZ | auto | |
| `updated_at` | TIMESTAMPTZ | auto | |
| `completed_at` | TIMESTAMPTZ | nullable | When transaction completed |

**Status values and valid transitions:**

```
PENDING ──────────────────────────────────────► CANCELLED
   │
   ▼ (escrow funded)
IN_ESCROW ──────────────────────────────────► CANCELLED
   │                                                 │
   ▼ (seller marks delivered)              (dispute raised)
DELIVERED ──────────────────────────────────► DISPUTED
   │                                                 │
   ▼ (buyer confirms receipt)                        │
CONFIRMED ──────────────────────────────────► DISPUTED
   │                                                 │
   ▼ (auto-release after 1 min)                     ▼
COMPLETED                          COMPLETED / REFUNDED
                                   (admin resolves dispute)
```

**State machine implementation:**
```python
VALID_TRANSITIONS = {
    Status.PENDING:   [Status.IN_ESCROW, Status.CANCELLED],
    Status.IN_ESCROW: [Status.DELIVERED, Status.DISPUTED, Status.CANCELLED],
    Status.DELIVERED: [Status.CONFIRMED, Status.DISPUTED],
    Status.CONFIRMED: [Status.COMPLETED, Status.DISPUTED],
    Status.COMPLETED: [],
    Status.DISPUTED:  [Status.COMPLETED, Status.REFUNDED],
    Status.REFUNDED:  [],
    Status.CANCELLED: [],
}
```

**Reference generation:** Auto-generates `ESC-{YEAR}-{NNNNN}` on first save.

**`status_index` property:** Returns 0–4 for the 5-step progress bar steps (`PENDING`, `IN_ESCROW`, `DELIVERED`, `CONFIRMED`, `COMPLETED`), returns -1 for off-path states.

---

### 5.3 EscrowAccount (`escrow_escrowaccount`)

**File:** `apps/escrow/models.py`  
**Relationship:** OneToOne with Transaction

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BigInteger | PK, auto | |
| `transaction_id` | BigInteger | OneToOne FK | PROTECT |
| `held_amount` | DECIMAL(14,2) | NOT NULL | Amount in escrow |
| `currency` | VARCHAR(3) | default `NGN` | |
| `release_status` | VARCHAR(10) | CHOICES | `HOLDING`, `RELEASED`, `REFUNDED`, `PARTIAL` |
| `held_at` | TIMESTAMPTZ | auto | When funds entered escrow |
| `released_at` | TIMESTAMPTZ | nullable | When funds left escrow |

---

### 5.4 EscrowLog (`escrow_escrowlog`)

**File:** `apps/escrow/models.py`  
**Purpose:** Immutable audit trail — every fund movement recorded here.  
**Ordering:** Chronological (`timestamp` ascending)

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BigInteger | PK, auto | |
| `escrow_account_id` | BigInteger | FK | PROTECT |
| `action` | VARCHAR(100) | NOT NULL | e.g. `ESCROW_INITIATED`, `FUNDS_RELEASED`, `REFUND_ISSUED`, `PARTIAL_RELEASE` |
| `performed_by_id` | BigInteger | FK → CustomUser | PROTECT |
| `timestamp` | TIMESTAMPTZ | auto | Immutable timestamp |
| `notes` | TEXT | | Human-readable description of the action |

**Action values in use:**
- `ESCROW_INITIATED` — funds entered escrow
- `FUNDS_RELEASED` — funds sent to seller
- `REFUND_ISSUED` — funds returned to buyer
- `PARTIAL_RELEASE` — 50% to seller, 50% to buyer

---

### 5.5 Dispute (`disputes_dispute`)

**File:** `apps/disputes/models.py`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BigInteger | PK, auto | |
| `dispute_id` | UUID | UNIQUE, auto | Public identifier |
| `transaction_id` | BigInteger | FK | PROTECT |
| `raised_by_id` | BigInteger | FK → CustomUser | PROTECT |
| `reason` | TEXT | NOT NULL | Dispute description |
| `evidence_file` | FileField | nullable | Stored in `media/evidence/` |
| `status` | VARCHAR(15) | CHOICES | `OPEN`, `UNDER_REVIEW`, `RESOLVED`, `OVERDUE` |
| `resolution` | VARCHAR(10) | CHOICES | `RELEASE`, `REFUND`, `PARTIAL` (set when resolved) |
| `resolution_notes` | TEXT | | Admin's explanation |
| `raised_at` | TIMESTAMPTZ | auto | |
| `resolution_deadline` | TIMESTAMPTZ | auto-set | `raised_at + 2 minutes` (demo) |
| `resolved_at` | TIMESTAMPTZ | nullable | |
| `resolved_by_id` | BigInteger | FK → CustomUser | SET NULL, nullable |

**Auto deadline:** On first save, `resolution_deadline = now() + timedelta(minutes=2)`.

**Properties:**
- `hours_remaining` — minutes remaining until deadline (returns 0 if past)
- `is_overdue` — True if deadline passed and status is not RESOLVED

---

### 5.6 Notification (`notifications_notification`)

**File:** `apps/notifications/models.py`  
**Ordering:** Most recent first

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BigInteger | PK, auto | |
| `recipient_id` | BigInteger | FK → CustomUser | CASCADE |
| `title` | VARCHAR(255) | NOT NULL | Notification heading |
| `message` | TEXT | NOT NULL | Full notification body |
| `channel` | VARCHAR(10) | CHOICES | `EMAIL`, `IN_APP`, `BOTH` |
| `is_read` | BOOLEAN | default `False` | Read status |
| `sent_at` | TIMESTAMPTZ | auto | |
| `related_transaction_id` | BigInteger | FK nullable | SET NULL |

---

### 5.7 NotificationTemplate (`notifications_notificationtemplate`)

**File:** `apps/notifications/models.py`  
**Purpose:** Stores subject/body templates for each event type (admin-editable via Django admin)

| Column | Type | Description |
|---|---|---|
| `id` | BigInteger | PK |
| `event_type` | VARCHAR(30) | UNIQUE — one of 7 event types |
| `subject_template` | VARCHAR(255) | Email subject |
| `body_template` | TEXT | Email body |

**Event types:** `TRANSACTION_CREATED`, `FUNDS_DEPOSITED`, `DELIVERY_CONFIRMED`, `DISPUTE_RAISED`, `DISPUTE_RESOLVED`, `FUNDS_RELEASED`, `REFUND_ISSUED`

---

## 6. SERVICE LAYER (BUSINESS LOGIC)

All business logic lives in `services.py` files — never inside views. Views only handle HTTP concerns (form validation, permission checks, redirects).

---

### 6.1 `apps/escrow/services.py`

#### `initiate_escrow(transaction, performed_by)`
- Creates an `EscrowAccount` with `HOLDING` status
- Writes `ESCROW_INITIATED` to `EscrowLog`
- Calls `transaction.transition_to(IN_ESCROW)`
- Sends "funds in escrow" notification to both parties
- **Returns:** `EscrowAccount` instance

#### `release_funds(transaction, performed_by)`
- Sets `escrow.release_status = RELEASED`, `released_at = now()`
- Writes `FUNDS_RELEASED` to `EscrowLog`
- Calls `transaction.transition_to(COMPLETED)`
- Sends "funds released" notification to both parties
- **Returns:** `EscrowAccount` instance

#### `refund_buyer(transaction, performed_by)`
- Sets `escrow.release_status = REFUNDED`, `released_at = now()`
- Writes `REFUND_ISSUED` to `EscrowLog`
- Calls `transaction.transition_to(REFUNDED)`
- Sends "refund issued" notification to both parties
- **Returns:** `EscrowAccount` instance

#### `partial_release(transaction, release_amount, performed_by)`
- Sets `escrow.release_status = PARTIAL`, `released_at = now()`
- Writes `PARTIAL_RELEASE` to `EscrowLog` with split amounts
- Calls `transaction.transition_to(COMPLETED)`
- Sends both "funds released" and "refund issued" notifications
- **Returns:** `EscrowAccount` instance

---

### 6.2 `apps/transactions/services.py`

#### `create_transaction(buyer, seller_email, title, description, amount, delivery_deadline)`
- Validates seller exists, is active, and has role `SELLER` or `ADMIN`
- Validates buyer ≠ seller
- Creates `Transaction` with `PENDING` status
- Triggers `notify_transaction_created()`
- **Raises:** `ValueError` for invalid seller; `ValueError` for self-dealing

#### `confirm_delivery(transaction, buyer)`
- Validates caller is the buyer
- Validates transaction is `IN_ESCROW`
- Transitions → `DELIVERED`
- Triggers `notify_delivered()` to buyer
- **Note:** Despite the name, this is actually called by the **seller** to mark delivery — see `views.py:mark_delivered`

#### `buyer_confirm_receipt(transaction, buyer)`
- Validates caller is the buyer
- Validates transaction is `DELIVERED`
- Transitions → `CONFIRMED`, sets `confirmed_at = now()`
- Triggers `notify_delivery_confirmed()` to seller
- Starts the 1-minute auto-release countdown

#### `cancel_transaction(transaction, user)`
- Only works on `PENDING` transactions
- Accessible by buyer, seller, or staff
- Transitions → `CANCELLED`

#### `auto_release_check()` — called by scheduler every 30 seconds
- Finds all `CONFIRMED` transactions where `confirmed_at <= now() - 1 minute`
- Excludes any with an open/under-review dispute
- Calls `release_funds()` for each eligible transaction using the first superuser as `performed_by`
- **Returns:** list of released reference numbers

---

### 6.3 `apps/disputes/services.py`

#### `raise_dispute(transaction, raised_by, reason, evidence_file=None)`
- Validates transaction is not already closed (COMPLETED/REFUNDED/CANCELLED)
- Validates caller is the buyer or seller
- Validates no open dispute already exists
- Creates `Dispute` with `OPEN` status and 2-minute auto-deadline
- Sets `transaction.status = DISPUTED` (bypasses state machine to allow from any active state)
- Triggers `notify_dispute_raised()` to the other party + all admins
- **Returns:** `Dispute` instance

#### `resolve_dispute(dispute, admin, resolution, notes='')`
- Validates dispute is not already resolved
- Sets `dispute.resolution`, `notes`, `status=RESOLVED`, `resolved_by`, `resolved_at`
- Executes the financial decision:
  - `RELEASE` → calls `release_funds()`
  - `REFUND` → calls `refund_buyer()`
  - `PARTIAL` → calls `partial_release()` at 50% split
- Triggers `notify_dispute_resolved()` to both parties
- **Returns:** `Dispute` instance

---

### 6.4 `apps/notifications/services.py`

#### `notify(recipient, title, message, transaction=None, channel=BOTH)`
- Creates `Notification` record
- If channel includes EMAIL, calls Django's `send_mail()` with `fail_silently=True`

#### Event-specific helpers (each calls `notify()` internally):
- `notify_transaction_created(transaction)` — buyer + seller
- `notify_funds_in_escrow(transaction)` — buyer + seller
- `notify_delivered(transaction)` — buyer only
- `notify_delivery_confirmed(transaction)` — seller only
- `notify_dispute_raised(transaction, dispute)` — other party + all ADMINs
- `notify_dispute_resolved(transaction, dispute)` — buyer + seller
- `notify_funds_released(transaction)` — seller + buyer
- `notify_refund_issued(transaction)` — buyer + seller

---

## 7. VIEWS & URL REFERENCE

### Complete URL Map

| Method | URL | View Function | Access | Description |
|---|---|---|---|---|
| GET | `/` | lambda redirect | Public | Redirects to `/dashboard/` |
| **ACCOUNTS** | | | | |
| GET/POST | `/accounts/register/` | `accounts.views.register` | Unauthenticated | User registration |
| GET/POST | `/accounts/login/` | `accounts.views.user_login` | Unauthenticated | Email/password login |
| POST | `/accounts/logout/` | `accounts.views.user_logout` | Authenticated | Logout + redirect to login |
| GET/POST | `/accounts/mfa/setup/` | `accounts.views.mfa_setup` | Authenticated | TOTP QR code setup |
| GET/POST | `/accounts/mfa/verify/` | `accounts.views.mfa_verify` | Session (MFA pending) | 6-digit code entry |
| GET/POST | `/accounts/profile/` | `accounts.views.profile` | Authenticated | Edit profile + view security |
| **DASHBOARD** | | | | |
| GET | `/dashboard/` | `dashboard.views.index` | Authenticated | Role-based redirect |
| GET | `/dashboard/buyer/` | `dashboard.views.buyer_dashboard` | Authenticated | Buyer stats + transactions |
| GET | `/dashboard/seller/` | `dashboard.views.seller_dashboard` | Authenticated | Seller stats + earned |
| GET | `/dashboard/admin/` | `dashboard.views.admin_dashboard` | Admin/Superuser | Global stats + disputes |
| **TRANSACTIONS** | | | | |
| GET/POST | `/transactions/create/` | `transactions.views.create` | BUYER only | New escrow transaction |
| GET | `/transactions/` | `transactions.views.list_transactions` | Authenticated | Own transactions (admin sees all) |
| GET | `/transactions/<uuid>/` | `transactions.views.detail` | Parties + Admin | Detail + timeline + logs |
| POST | `/transactions/<uuid>/deliver/` | `transactions.views.mark_delivered` | Seller only | Mark transaction delivered |
| POST | `/transactions/<uuid>/confirm-receipt/` | `transactions.views.confirm_receipt` | Buyer only | Confirm receipt |
| POST | `/transactions/<uuid>/cancel/` | `transactions.views.cancel` | Buyer/Seller/Staff | Cancel PENDING transaction |
| **ESCROW** | | | | |
| POST | `/escrow/<uuid>/release/` | `escrow.views.manual_release` | Admin only | Manual fund release |
| POST | `/escrow/<uuid>/refund/` | `escrow.views.manual_refund` | Admin only | Manual refund |
| **DISPUTES** | | | | |
| GET/POST | `/disputes/raise/<uuid>/` | `disputes.views.raise_dispute_view` | Buyer or Seller | File a dispute |
| GET | `/disputes/<uuid>/` | `disputes.views.dispute_detail` | Parties + Admin | Dispute detail |
| POST | `/disputes/<uuid>/resolve/` | `disputes.views.resolve_dispute_view` | Admin only | Resolve dispute |
| **NOTIFICATIONS** | | | | |
| GET | `/notifications/` | `notifications.views.notification_list` | Authenticated | Notification inbox |
| POST | `/notifications/<id>/read/` | `notifications.views.mark_read` | Authenticated | Mark one as read (AJAX) |
| POST | `/notifications/read-all/` | `notifications.views.mark_all_read` | Authenticated | Mark all as read (AJAX) |
| **DJANGO ADMIN** | | | | |
| GET | `/admin/` | Django admin | Staff/Superuser | Full database admin |

---

## 8. AUTHENTICATION & MFA

### Login Flow

```
1. User POSTs email + password to /accounts/login/
2. Django's AuthenticationForm validates credentials
3. If user.mfa_enabled == True:
     a. Store user.pk in session['mfa_user_id']
     b. Redirect to /accounts/mfa/verify/
     c. User enters 6-digit TOTP code
     d. pyotp.TOTP(user.mfa_secret).verify(token) checked
     e. If valid: login(request, user); redirect to dashboard
4. If MFA not enabled: login immediately, redirect to dashboard
```

### MFA Setup Flow

```
1. User visits /accounts/mfa/setup/
2. If no mfa_secret: generate via pyotp.random_base32()
3. Build TOTP provisioning URI: totp.provisioning_uri(email, issuer='EscrowNG')
4. Generate QR code PNG via qrcode library → base64 encode → embed in <img>
5. User scans QR code with Google Authenticator / Authy
6. User submits 6-digit token to confirm setup
7. If valid: user.mfa_enabled = True; save
```

### Password Security

- **Hashing:** Argon2 (primary), PBKDF2, BCrypt as fallbacks
- **Minimum length:** 10 characters
- **Validators:** Similarity check, common password check, numeric-only check
- Passwords never stored in plaintext

### Role-Based Access Control

The `@role_required` decorator in `apps/accounts/decorators.py`:

```python
def role_required(*roles):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return redirect('accounts:login')
            if request.user.role not in roles and not request.user.is_superuser:
                messages.error(request, "You do not have permission to access that page.")
                return redirect('dashboard:index')
            return view_func(request, *args, **kwargs)
        return _wrapped
    return decorator
```

Usage: `@role_required('BUYER')`, `@role_required('ADMIN')`, `@role_required('BUYER', 'SELLER')`

---

## 9. ESCROW LIFECYCLE

### Complete Flow Step-by-Step

```
STEP 1 — BUYER creates transaction
  View:    POST /transactions/create/
  Service: create_transaction() → Transaction(status=PENDING)
           + initiate_escrow() → EscrowAccount(status=HOLDING)
  Status:  Transaction.PENDING → Transaction.IN_ESCROW
  Notify:  Buyer: "Transaction created"
           Seller: "New escrow request — please confirm"

STEP 2 — SELLER does the work
  (No action required in system — seller simply works)

STEP 3 — SELLER marks delivery complete
  View:    POST /transactions/<uuid>/deliver/
  Service: confirm_delivery()
  Status:  Transaction.IN_ESCROW → Transaction.DELIVERED
  Notify:  Buyer: "Delivery marked — please confirm receipt"

STEP 4a — BUYER confirms receipt
  View:    POST /transactions/<uuid>/confirm-receipt/
  Service: buyer_confirm_receipt()
  Status:  Transaction.DELIVERED → Transaction.CONFIRMED
  Action:  confirmed_at = now()
  Notify:  Seller: "Delivery confirmed — funds releasing in 1 minute"

STEP 4b — BUYER raises dispute instead
  View:    POST /disputes/raise/<uuid>/
  Service: raise_dispute()
  Status:  Transaction.DELIVERED → Transaction.DISPUTED
  Action:  Dispute created with 2-minute deadline
  Notify:  Other party + all admins (URGENT)

STEP 5a — AUTO RELEASE (no dispute)
  Trigger: APScheduler every 30 seconds
  Service: auto_release_check() → release_funds()
  Condition: confirmed_at <= now() - 1 minute AND no open dispute
  Status:  Transaction.CONFIRMED → Transaction.COMPLETED
           EscrowAccount.HOLDING → EscrowAccount.RELEASED
  Notify:  Seller: "Funds released"
           Buyer: "Transaction complete"

STEP 5b — ADMIN resolves dispute
  View:    POST /disputes/<uuid>/resolve/
  Service: resolve_dispute()
  Decision RELEASE → release_funds() → COMPLETED
  Decision REFUND  → refund_buyer()  → REFUNDED
  Decision PARTIAL → partial_release() → COMPLETED
  Notify:  Both parties with outcome
```

---

## 10. DISPUTE SYSTEM

### Filing a Dispute

- Either buyer or seller may file
- Cannot file on COMPLETED, REFUNDED, or CANCELLED transactions
- Only one open dispute per transaction at a time
- Evidence file: optional, max 5MB, PDF/JPG/PNG only
- Deadline auto-set to `raised_at + 2 minutes` (configurable — change `timedelta` in `disputes/models.py`)

### Admin Resolution Options

| Option | Code | Effect |
|---|---|---|
| Release funds to seller | `RELEASE` | Calls `release_funds()` → COMPLETED |
| Refund buyer | `REFUND` | Calls `refund_buyer()` → REFUNDED |
| Partial (50/50 split) | `PARTIAL` | Calls `partial_release(amount/2)` → COMPLETED |

### Overdue Dispute Flagging

- APScheduler runs `_job_flag_overdue_disputes()` every 30 seconds
- Finds disputes where `status IN (OPEN, UNDER_REVIEW)` AND `resolution_deadline < now()`
- Sets `status = OVERDUE`
- Emails all ADMIN users immediately

### Admin Dashboard Dispute Panel

- Shows all open/under-review disputes sorted by deadline (soonest first)
- Deadline timer updates live via JavaScript (`setInterval` every 30 seconds)
- Row turns red when `hours_remaining < 24` (minutes in demo mode)

---

## 11. NOTIFICATION SYSTEM

### How Notifications Work

1. A service function (e.g. `notify_dispute_raised`) calls `notify(user, title, message, transaction)`
2. `notify()` creates a `Notification` database record
3. `notify()` also calls Django's `send_mail()` if channel includes EMAIL (fails silently if SMTP not configured)
4. The `unread_notifications` context processor injects `unread_count` into every template
5. The notification bell in the topbar shows the unread count
6. The `/notifications/` inbox lists all notifications with mark-read buttons
7. AJAX endpoints (`/notifications/<id>/read/` and `/read-all/`) update `is_read` without page reload

### Notification Triggers

| Event | Recipients | Trigger Function |
|---|---|---|
| Transaction created | Buyer + Seller | `notify_transaction_created()` |
| Funds in escrow | Buyer + Seller | `notify_funds_in_escrow()` |
| Seller marks delivered | Buyer | `notify_delivered()` |
| Buyer confirms receipt | Seller | `notify_delivery_confirmed()` |
| Dispute raised | Other party + All Admins | `notify_dispute_raised()` |
| Dispute resolved | Buyer + Seller | `notify_dispute_resolved()` |
| Funds released | Seller + Buyer | `notify_funds_released()` |
| Refund issued | Buyer + Seller | `notify_refund_issued()` |

---

## 12. DASHBOARDS

### Buyer Dashboard (`/dashboard/buyer/`)

**Stats cards:**
- Pending transactions count
- In Escrow transactions count
- Completed transactions count

**Alert panel:** Shows any transactions in DELIVERED state that need buyer confirmation

**Table:** 10 most recent transactions with status badges and "View" links

---

### Seller Dashboard (`/dashboard/seller/`)

**Stats cards:**
- Pending, In Escrow, Completed counts
- Total Earned (sum of COMPLETED transaction amounts)

**Table:** 10 most recent sales

---

### Admin Dashboard (`/dashboard/admin/`)

**Stats cards:**
- Total transactions (all)
- Total held in escrow (₦ sum of IN_ESCROW transactions)
- Open disputes count (red border if > 0)
- Registered users count

**Dispute panel:** All OPEN/UNDER_REVIEW disputes with:
- Transaction reference + reason excerpt
- Who raised it
- Live countdown timer (JavaScript)
- Red highlight if < 24 minutes remaining

**Transaction table:** Last 20 transactions with filter/search controls
- Filter by status dropdown
- Search by reference, title, or email

---

## 13. BACKGROUND SCHEDULER (AUTOMATION)

### Implementation

**File:** `apps/scheduler.py`  
**Library:** APScheduler 3.11.2 `BackgroundScheduler`  
**Timezone:** `Africa/Lagos`

### Startup Mechanism

The scheduler starts automatically when Django boots via `DashboardConfig.ready()`:

```python
# apps/dashboard/apps.py
def ready(self):
    import sys
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'runserver':
        if '--noreload' not in sys.argv and os.environ.get('RUN_MAIN') != 'true':
            return  # Skip the outer reloader process
    elif cmd:
        return  # Skip management commands (migrate, seed, etc.)
    from apps import scheduler
    scheduler.start()
```

**Why this matters:** Django's dev server with auto-reload forks a subprocess. `RUN_MAIN=true` marks the actual serving subprocess. The scheduler only starts there — not in the watcher process — preventing duplicate job execution.

### Job 1: `auto_release_funds` (every 30 seconds)

```python
def _job_auto_release():
    from apps.transactions.services import auto_release_check
    released = auto_release_check()
    # auto_release_check() finds CONFIRMED transactions where
    # confirmed_at <= now() - 1 minute AND no open dispute exists
    # For each: calls release_funds() → COMPLETED + notify both parties
```

### Job 2: `flag_overdue_disputes` (every 30 seconds)

```python
def _job_flag_overdue_disputes():
    # Finds OPEN/UNDER_REVIEW disputes where resolution_deadline < now()
    # Sets status = OVERDUE
    # Emails all ADMIN users with count + dashboard link
```

### Timing Summary

| Setting | Value | Change to modify |
|---|---|---|
| Auto-release window | 1 minute after CONFIRMED | `transactions/services.py` line 67: `timedelta(minutes=1)` |
| Dispute deadline | 2 minutes after raised | `disputes/models.py` line 52: `timedelta(minutes=2)` |
| Scheduler check interval | Every 30 seconds | `scheduler.py` lines 71+79: `IntervalTrigger(seconds=30)` |

---

## 14. MANAGEMENT COMMANDS

### `python manage.py seed_demo_data`

**File:** `apps/accounts/management/commands/seed_demo_data.py`

Creates demo data if it doesn't already exist (safe to run multiple times):

**Users created:**
| Email | Password | Role |
|---|---|---|
| admin@escrow.ng | Admin@123456 | ADMIN + superuser |
| buyer1@escrow.ng | Buyer@123456 | BUYER |
| buyer2@escrow.ng | Buyer@123456 | BUYER |
| seller1@escrow.ng | Seller@123456 | SELLER |
| seller2@escrow.ng | Seller@123456 | SELLER |

**Transactions created:**
| Reference | Title | Amount | Status |
|---|---|---|---|
| ESC-2026-00001 | Logo Design Project | ₦45,000 | COMPLETED |
| ESC-2026-00002 | E-commerce Website Development | ₦250,000 | IN_ESCROW |
| ESC-2026-00003 | Social Media Management | ₦75,000 | COMPLETED (auto-released) |
| ESC-2026-00004 | Mobile App UI Design | ₦120,000 | DISPUTED |
| ESC-2026-00005 | Content Writing Package | ₦30,000 | PENDING |

---

### `python manage.py auto_release_funds`

**File:** `apps/transactions/management/commands/auto_release_funds.py`

Manual version of the scheduler job. Finds eligible CONFIRMED transactions and releases them. Designed for cron execution when not using the in-process scheduler.

```bash
# Example crontab (every 15 minutes)
*/15 * * * * cd /path/to/escrow_project && python manage.py auto_release_funds
```

---

### `python manage.py flag_overdue_disputes`

**File:** `apps/disputes/management/commands/flag_overdue_disputes.py`

Manual version of the scheduler job. Flags OPEN disputes past their deadline and emails admins.

```bash
# Example crontab (every hour)
0 * * * * cd /path/to/escrow_project && python manage.py flag_overdue_disputes
```

---

### `python manage.py migrate`

Applies all database migrations. Must be run before first use and after any model change.

### `python manage.py makemigrations`

Generates new migration files after model changes.

### `python manage.py createsuperuser`

Creates a superuser interactively (alternative to using seed_demo_data).

### `python manage.py collectstatic`

Copies all static files to `staticfiles/` for production serving.

---

## 15. TEMPLATES & UI DESIGN

### Template Hierarchy

```
base.html
├── accounts/login.html       (uses auth_content block — no sidebar)
├── accounts/register.html    (uses auth_content block — no sidebar)
├── accounts/mfa_verify.html  (uses auth_content block — no sidebar)
├── accounts/mfa_setup.html   (uses content block — with sidebar)
├── accounts/profile.html     (uses content block)
├── dashboard/buyer.html      (uses content block)
├── dashboard/seller.html     (uses content block)
├── dashboard/admin.html      (uses content block + extra_js)
├── transactions/create.html  (uses content block)
├── transactions/list.html    (uses content block)
├── transactions/detail.html  (uses content block + extra_js)
├── disputes/raise.html       (uses content block)
├── disputes/detail.html      (uses content block + extra_js)
└── notifications/list.html   (uses content block + extra_js)

Partials (included with {% include %}):
└── transactions/_table.html  (reusable transaction table)
```

### base.html Structure

```html
<body>
  <div class="layout">         <!-- authenticated layout -->
    <aside class="sidebar">   <!-- role-aware nav links -->
    <div class="main-wrap">
      <header class="topbar"> <!-- user chip + notification bell -->
      <main class="content">
        {% if messages %}
        <div class="flash-area">  <!-- success/error/warning banners -->
        {% block content %}{% endblock %}
      </main>
      <footer class="page-footer">
  </div>
  <div class="auth-layout">   <!-- unauthenticated layout (login/register) -->
    {% block auth_content %}{% endblock %}
  </div>
</body>
```

### Transaction Detail Page Sections

1. **Status Timeline Bar** — 5-step visual progress indicator (PENDING → COMPLETED) with current step highlighted in gold, completed steps in green
2. **Transaction Summary Card** — All fields in a definition list
3. **Escrow Status Card** — Held amount, release status, timestamps
4. **Action Buttons Card** — Shows only applicable actions based on `user.role` and `transaction.status`
5. **Disputes Section** — Lists all disputes with status badge and "View" link
6. **Audit Log** — Chronological EscrowLog entries with action, actor, timestamp, notes

### Dispute Detail Page Sections

1. **Dispute Info Card** — ID, status, raiser, timestamps, live countdown timer
2. **Transaction Summary Card** — Reference, amount, both parties
3. **Reason Text** — Full dispute reason
4. **Evidence Viewer** — Image preview or PDF link if evidence uploaded
5. **Admin Resolution Panel** — Radio buttons (RELEASE/REFUND/PARTIAL) + notes textarea — visible only to ADMIN/superuser
6. **Resolution Display** — Shown post-resolution for all parties

---

## 16. CSS DESIGN SYSTEM

**File:** `static/css/main.css` (~700 lines)

### Color Palette (CSS Variables)

```css
--navy:       #0D1B2A   /* Primary dark background */
--navy-mid:   #1A2D42   /* Sidebar hover */
--navy-light: #243B55   /* Sidebar active item */
--gold:       #C9A84C   /* Accent — active nav, amounts, gold cards */
--gold-light: #E2C46A   /* Gold hover state */
--gold-dark:  #A8882E   /* Gold text on light backgrounds */
--white:      #FFFFFF
--grey-50:    #F8F9FA   /* Page background */
--grey-100:   #F1F3F5   /* Card hover, code blocks */
--grey-200:   #E9ECEF   /* Borders */
--grey-400:   #ADB5BD   /* Muted text */
--grey-600:   #6C757D   /* Secondary text */
--grey-800:   #343A40   /* Body text */
--danger:     #DC3545   /* Errors, danger buttons, dispute alerts */
--success:    #28A745   /* Completed status, verified badge */
--warning:    #FFC107   /* Pending status, alert cards */
```

### Typography

- **UI font:** `Inter` (Google Fonts) — weights 300, 400, 500, 600, 700
- **Monospace:** `Courier New` — used for transaction references, amounts, OTP inputs

### Component Classes

| Class | Usage |
|---|---|
| `.btn--primary` | Navy background, white text |
| `.btn--gold` | Gold background, navy text |
| `.btn--danger` | Red background |
| `.btn--outline` | Transparent, navy border |
| `.btn--ghost` | Transparent, grey border |
| `.btn--full` | Full-width button |
| `.btn--sm` | Smaller padding |
| `.status-badge` | Pill badge for transaction/dispute status |
| `.stat-card` | Dashboard metric card |
| `.stat-card--gold` | Gold left border accent |
| `.stat-card--alert` | Red left border for urgent metrics |
| `.timeline-bar` | Transaction progress timeline |
| `.timeline-step--active` | Gold dot + label |
| `.timeline-step--done` | Green dot + label |
| `.audit-log` | EscrowLog display |
| `.log-entry` | Single audit log row |
| `.resolution-panel` | Gold top border, admin only |
| `.notif-item--unread` | Blue background notification |
| `.deadline-timer` | Countdown timer text |
| `.deadline--red` | Urgent red countdown |

### Responsive Breakpoints

```css
@media (max-width: 900px) {
    /* Sidebar collapses to off-canvas, toggled by ☰ button */
    /* Detail grid stacks to single column */
}
@media (max-width: 600px) {
    /* Stats cards: 2-column grid */
    /* Reduced padding */
}
```

---

## 17. SECURITY CONFIGURATION

### Settings (`escrow_project/settings.py`)

| Setting | Dev Value | Prod Value | Purpose |
|---|---|---|---|
| `DEBUG` | `True` | `False` | Never show stack traces in production |
| `SECRET_KEY` | From `.env` | Random 50-char string | Django's cryptographic signing key |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Your domain | Prevent host header injection |
| `SESSION_COOKIE_SECURE` | `False` | `True` | HTTPS-only session cookies |
| `CSRF_COOKIE_SECURE` | `False` | `True` | HTTPS-only CSRF cookies |
| `X_FRAME_OPTIONS` | `DENY` | `DENY` | Block iframe embedding (clickjacking) |
| `SECURE_BROWSER_XSS_FILTER` | `True` | `True` | Browser XSS protection header |
| `SECURE_CONTENT_TYPE_NOSNIFF` | `True` | `True` | Prevent MIME sniffing |
| `SECURE_HSTS_SECONDS` | `0` | `31536000` | 1-year HSTS header |
| `SECURE_SSL_REDIRECT` | `False` | `True` | Force HTTPS |

### Password Security

```python
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',   # Primary
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',   # Fallback
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]

AUTH_PASSWORD_VALIDATORS = [
    UserAttributeSimilarityValidator,
    MinimumLengthValidator(min_length=10),
    CommonPasswordValidator,
    NumericPasswordValidator,
]
```

### File Upload Security

```python
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024  # 5MB limit
ALLOWED_EVIDENCE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']
```

Extension validation in `disputes/views.py`:
```python
ext = os.path.splitext(evidence.name)[1].lower()
if ext not in settings.ALLOWED_EVIDENCE_EXTENSIONS:
    messages.error(request, "Evidence must be PDF, JPG, or PNG.")
```

### View-Level Security

- Every view uses `@login_required`
- Sensitive views use `@role_required('ADMIN')` or `@role_required('BUYER')`
- Destructive actions use `@require_POST` (no GET-based state changes)
- Transaction detail: user must be buyer, seller, or admin
- Dispute detail: user must be a party to the transaction or admin
- All forms include `{% csrf_token %}`
- No integer PKs exposed in URLs — all use UUIDs

### SQL Injection Prevention

- Django ORM used exclusively — no raw SQL
- All user input passes through Django's parameterised query interface

---

## 18. SETTINGS REFERENCE

**File:** `escrow_project/settings.py`

```python
# Key settings summary

BASE_DIR = Path(__file__).resolve().parent.parent

# Loaded from .env file
SECRET_KEY     = os.environ.get('SECRET_KEY')
DEBUG          = os.environ.get('DEBUG', 'True') == 'True'
ALLOWED_HOSTS  = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Custom user model
AUTH_USER_MODEL = 'accounts.CustomUser'

# Database (parsed from DATABASE_URL env var)
DATABASES = {'default': dj_database_url.parse(os.environ.get('DATABASE_URL'))}

# Authentication
LOGIN_URL             = '/accounts/login/'
LOGIN_REDIRECT_URL    = '/dashboard/'
LOGOUT_REDIRECT_URL   = '/accounts/login/'

# Timezone
TIME_ZONE = 'Africa/Lagos'
USE_TZ    = True

# Static files
STATIC_URL        = '/static/'
STATIC_ROOT       = BASE_DIR / 'staticfiles'
STATICFILES_DIRS  = [BASE_DIR / 'static']

# Media (user uploads)
MEDIA_URL  = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Email
EMAIL_BACKEND      = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST         = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT         = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS      = True
EMAIL_HOST_USER    = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD= os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('EMAIL_HOST_USER', 'noreply@escrow.ng')
```

---

## 19. ENVIRONMENT VARIABLES

**File:** `.env` (not committed to git)  
**Template:** `.env.example`

```ini
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=postgres://postgres:postgres@localhost:5432/escrow_db
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your@email.com
EMAIL_HOST_PASSWORD=your-app-password
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Setting up Gmail SMTP

1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account → Security → App Passwords
3. Generate an app password for "Mail"
4. Use that 16-character password as `EMAIL_HOST_PASSWORD`
5. Use your Gmail address as `EMAIL_HOST_USER`

---

## 20. INSTALLATION & SETUP

### Prerequisites

- Python 3.11+ (tested on 3.14.4)
- PostgreSQL 17 (any 12+ should work)
- Git

### Step-by-Step Installation

```bash
# 1. Navigate to the project directory
cd "c:\Users\USER\Desktop\Escrow\escrow_project"

# 2. (Recommended) Create a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

# 3. Install all dependencies
pip install -r requirements.txt

# 4. Set up environment variables
copy .env.example .env
# Open .env and set DATABASE_URL, SECRET_KEY, and optionally email settings

# 5. Create the PostgreSQL database
# Open psql and run:
#   CREATE DATABASE escrow_db;
# Or using createdb:
createdb -U postgres escrow_db

# 6. Run database migrations
python manage.py migrate

# 7. Seed demo data (optional but recommended)
python manage.py seed_demo_data

# 8. Start the development server
python manage.py runserver
```

Open http://127.0.0.1:8000 in your browser.

### Production Deployment Checklist

```ini
# In .env for production:
DEBUG=False
SECRET_KEY=<generate a 50-character random key>
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgres://user:password@host:5432/escrow_db
EMAIL_HOST_USER=your@email.com
EMAIL_HOST_PASSWORD=your-app-password
```

```bash
# Production steps:
python manage.py collectstatic --noinput
python manage.py migrate
gunicorn escrow_project.wsgi:application --workers 4 --bind 0.0.0.0:8000
```

---

## 21. DEMO CREDENTIALS

These are created by `python manage.py seed_demo_data`.

| Role | Email | Password | Access |
|---|---|---|---|
| Admin | admin@escrow.ng | Admin@123456 | All pages, dispute resolution, fund release/refund |
| Buyer | buyer1@escrow.ng | Buyer@123456 | Create transactions, confirm delivery, raise disputes |
| Buyer | buyer2@escrow.ng | Buyer@123456 | Same as above |
| Seller | seller1@escrow.ng | Seller@123456 | Mark transactions delivered, raise disputes |
| Seller | seller2@escrow.ng | Seller@123456 | Same as above |

### Demo Transaction States

| Reference | Title | Buyer | Seller | Amount | Status |
|---|---|---|---|---|---|
| ESC-2026-00001 | Logo Design Project | buyer1 | seller1 | ₦45,000 | COMPLETED |
| ESC-2026-00002 | E-commerce Website | buyer1 | seller2 | ₦250,000 | IN_ESCROW |
| ESC-2026-00003 | Social Media Mgmt | buyer2 | seller1 | ₦75,000 | COMPLETED |
| ESC-2026-00004 | Mobile App UI Design | buyer2 | seller2 | ₦120,000 | DISPUTED |
| ESC-2026-00005 | Content Writing | buyer1 | seller2 | ₦30,000 | PENDING |

---

## 22. RUNNING THE PROJECT

### Start the Server

```bash
cd "c:\Users\USER\Desktop\Escrow\escrow_project"
python manage.py runserver
```

The server starts at **http://127.0.0.1:8000**

The background scheduler starts automatically with the server and runs every 30 seconds.

### Testing the Automation

**Test auto-release (1 minute window):**
1. Log in as `buyer1@escrow.ng`
2. View ESC-2026-00002 (IN_ESCROW)
3. Log out, log in as `seller2@escrow.ng`
4. Mark the transaction as Delivered
5. Log out, log in as `buyer1@escrow.ng`
6. Confirm Receipt on the transaction
7. Wait 1 minute — the scheduler will auto-complete it

**Test dispute auto-flagging (2 minute window):**
1. Raise a dispute on any active transaction
2. Do NOT resolve it
3. Wait 2 minutes — the scheduler flags it OVERDUE

### Run Management Commands Manually

```bash
python manage.py auto_release_funds      # Release eligible transactions
python manage.py flag_overdue_disputes   # Flag + email overdue disputes
python manage.py seed_demo_data          # (Re-)seed demo data
python manage.py check                   # Verify Django configuration
python manage.py check --deploy          # Check production security
python manage.py migrate                 # Apply migrations
python manage.py makemigrations          # Generate new migrations
python manage.py createsuperuser         # Create admin user interactively
python manage.py collectstatic           # Gather static files for production
```

---

## 23. COMPLETE SOURCE CODE

### `escrow_project/settings.py`
```python
import os
from pathlib import Path
import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-change-me-in-production')
DEBUG = os.environ.get('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_otp',
    'django_otp.plugins.otp_totp',
    'crispy_forms',
    'apps.accounts',
    'apps.transactions',
    'apps.escrow',
    'apps.disputes',
    'apps.notifications',
    'apps.dashboard',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django_otp.middleware.OTPMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'escrow_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'apps.notifications.context_processors.unread_notifications',
            ],
        },
    },
]

WSGI_APPLICATION = 'escrow_project.wsgi.application'

_db_url = os.environ.get('DATABASE_URL', 'postgres://postgres:postgres@localhost:5432/escrow_db')
DATABASES = {'default': dj_database_url.parse(_db_url, conn_max_age=600)}

AUTH_USER_MODEL = 'accounts.CustomUser'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 10}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Lagos'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

LOGIN_URL = '/accounts/login/'
LOGIN_REDIRECT_URL = '/dashboard/'
LOGOUT_REDIRECT_URL = '/accounts/login/'

SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
X_FRAME_OPTIONS = 'DENY'
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 0 if DEBUG else 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_SSL_REDIRECT = not DEBUG

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('EMAIL_HOST_USER', 'noreply@escrow.ng')

CRISPY_TEMPLATE_PACK = 'bootstrap4'

FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024
DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024
ALLOWED_EVIDENCE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']
```

---

### `apps/accounts/models.py`
```python
from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    class Role(models.TextChoices):
        BUYER = 'BUYER', 'Buyer'
        SELLER = 'SELLER', 'Seller'
        ADMIN = 'ADMIN', 'Admin'

    username = None
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.BUYER)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    def __str__(self):
        return f"{self.email} ({self.role})"

    def get_initials(self):
        parts = self.full_name.split()
        if len(parts) >= 2:
            return f"{parts[0][0]}{parts[1][0]}".upper()
        return self.email[0].upper()
```

---

### `apps/transactions/models.py`
```python
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class Transaction(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        IN_ESCROW = 'IN_ESCROW', 'In Escrow'
        DELIVERED = 'DELIVERED', 'Delivered'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        COMPLETED = 'COMPLETED', 'Completed'
        DISPUTED = 'DISPUTED', 'Disputed'
        REFUNDED = 'REFUNDED', 'Refunded'
        CANCELLED = 'CANCELLED', 'Cancelled'

    VALID_TRANSITIONS = {
        Status.PENDING:   [Status.IN_ESCROW, Status.CANCELLED],
        Status.IN_ESCROW: [Status.DELIVERED, Status.DISPUTED, Status.CANCELLED],
        Status.DELIVERED: [Status.CONFIRMED, Status.DISPUTED],
        Status.CONFIRMED: [Status.COMPLETED, Status.DISPUTED],
        Status.COMPLETED: [],
        Status.DISPUTED:  [Status.COMPLETED, Status.REFUNDED],
        Status.REFUNDED:  [],
        Status.CANCELLED: [],
    }

    transaction_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    reference = models.CharField(max_length=20, unique=True, blank=True)
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='purchases')
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='sales')
    title = models.CharField(max_length=255)
    description = models.TextField()
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=3, default='NGN')
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    delivery_deadline = models.DateTimeField()
    confirmed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.reference:
            year = timezone.now().year
            last = Transaction.objects.filter(reference__startswith=f'ESC-{year}-').count()
            self.reference = f'ESC-{year}-{last + 1:05d}'
        super().save(*args, **kwargs)

    def can_transition_to(self, new_status):
        return new_status in self.VALID_TRANSITIONS.get(self.status, [])

    def transition_to(self, new_status):
        if not self.can_transition_to(new_status):
            raise ValueError(f"Cannot transition from {self.status} to {new_status}")
        self.status = new_status
        if new_status == self.Status.CONFIRMED:
            self.confirmed_at = timezone.now()
        if new_status == self.Status.COMPLETED:
            self.completed_at = timezone.now()
        self.save()

    @property
    def status_index(self):
        steps = ['PENDING', 'IN_ESCROW', 'DELIVERED', 'CONFIRMED', 'COMPLETED']
        return steps.index(self.status) if self.status in steps else -1
```

---

### `apps/escrow/models.py`
```python
from django.db import models
from django.conf import settings


class EscrowAccount(models.Model):
    class ReleaseStatus(models.TextChoices):
        HOLDING  = 'HOLDING',  'Holding'
        RELEASED = 'RELEASED', 'Released'
        REFUNDED = 'REFUNDED', 'Refunded'
        PARTIAL  = 'PARTIAL',  'Partial Release'

    transaction = models.OneToOneField(
        'transactions.Transaction', on_delete=models.PROTECT, related_name='escrow_account'
    )
    held_amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=3, default='NGN')
    release_status = models.CharField(max_length=10, choices=ReleaseStatus.choices, default=ReleaseStatus.HOLDING)
    held_at = models.DateTimeField(auto_now_add=True)
    released_at = models.DateTimeField(null=True, blank=True)


class EscrowLog(models.Model):
    escrow_account = models.ForeignKey(EscrowAccount, on_delete=models.PROTECT, related_name='logs')
    action = models.CharField(max_length=100)
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='escrow_actions')
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['timestamp']
```

---

### `apps/disputes/models.py`
```python
import uuid
from datetime import timedelta
from django.db import models
from django.conf import settings
from django.utils import timezone


class Dispute(models.Model):
    class Status(models.TextChoices):
        OPEN         = 'OPEN',         'Open'
        UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
        RESOLVED     = 'RESOLVED',     'Resolved'
        OVERDUE      = 'OVERDUE',      'Overdue'

    class Resolution(models.TextChoices):
        RELEASE = 'RELEASE', 'Release to Seller'
        REFUND  = 'REFUND',  'Refund to Buyer'
        PARTIAL = 'PARTIAL', 'Partial Release'

    dispute_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    transaction = models.ForeignKey('transactions.Transaction', on_delete=models.PROTECT, related_name='disputes')
    raised_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='raised_disputes')
    reason = models.TextField()
    evidence_file = models.FileField(upload_to='evidence/', blank=True, null=True)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.OPEN)
    resolution = models.CharField(max_length=10, choices=Resolution.choices, blank=True)
    resolution_notes = models.TextField(blank=True)
    raised_at = models.DateTimeField(auto_now_add=True)
    resolution_deadline = models.DateTimeField(blank=True, null=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='resolved_disputes'
    )

    class Meta:
        ordering = ['-raised_at']

    def save(self, *args, **kwargs):
        if not self.resolution_deadline and not self.pk:
            self.resolution_deadline = timezone.now() + timedelta(minutes=2)
        super().save(*args, **kwargs)

    @property
    def hours_remaining(self):
        if self.resolution_deadline:
            delta = self.resolution_deadline - timezone.now()
            return max(0, delta.total_seconds() / 60)  # returns minutes (demo mode)
        return 0

    @property
    def is_overdue(self):
        return (self.resolution_deadline and timezone.now() > self.resolution_deadline
                and self.status not in [self.Status.RESOLVED])
```

---

### `apps/notifications/models.py`
```python
from django.db import models
from django.conf import settings


class Notification(models.Model):
    class Channel(models.TextChoices):
        EMAIL  = 'EMAIL',  'Email'
        IN_APP = 'IN_APP', 'In-App'
        BOTH   = 'BOTH',   'Both'

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    channel = models.CharField(max_length=10, choices=Channel.choices, default=Channel.BOTH)
    is_read = models.BooleanField(default=False)
    sent_at = models.DateTimeField(auto_now_add=True)
    related_transaction = models.ForeignKey(
        'transactions.Transaction', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='notifications'
    )

    class Meta:
        ordering = ['-sent_at']


class NotificationTemplate(models.Model):
    class EventType(models.TextChoices):
        TRANSACTION_CREATED = 'TRANSACTION_CREATED', 'Transaction Created'
        FUNDS_DEPOSITED     = 'FUNDS_DEPOSITED',     'Funds Deposited'
        DELIVERY_CONFIRMED  = 'DELIVERY_CONFIRMED',  'Delivery Confirmed'
        DISPUTE_RAISED      = 'DISPUTE_RAISED',      'Dispute Raised'
        DISPUTE_RESOLVED    = 'DISPUTE_RESOLVED',    'Dispute Resolved'
        FUNDS_RELEASED      = 'FUNDS_RELEASED',      'Funds Released'
        REFUND_ISSUED       = 'REFUND_ISSUED',        'Refund Issued'

    event_type = models.CharField(max_length=30, choices=EventType.choices, unique=True)
    subject_template = models.CharField(max_length=255)
    body_template = models.TextField()
```

---

### `apps/escrow/services.py`
```python
from django.utils import timezone
from .models import EscrowAccount, EscrowLog
from apps.transactions.models import Transaction


def _log(escrow_account, action, performed_by, notes=''):
    EscrowLog.objects.create(
        escrow_account=escrow_account, action=action,
        performed_by=performed_by, notes=notes
    )


def initiate_escrow(transaction, performed_by):
    escrow = EscrowAccount.objects.create(
        transaction=transaction, held_amount=transaction.amount,
        currency=transaction.currency, release_status=EscrowAccount.ReleaseStatus.HOLDING
    )
    _log(escrow, 'ESCROW_INITIATED', performed_by,
         f'₦{transaction.amount:,.2f} placed in escrow for {transaction.reference}')
    transaction.transition_to(Transaction.Status.IN_ESCROW)
    from apps.notifications.services import notify_funds_in_escrow
    notify_funds_in_escrow(transaction)
    return escrow


def release_funds(transaction, performed_by):
    escrow = transaction.escrow_account
    escrow.release_status = EscrowAccount.ReleaseStatus.RELEASED
    escrow.released_at = timezone.now()
    escrow.save()
    _log(escrow, 'FUNDS_RELEASED', performed_by,
         f'Full amount ₦{escrow.held_amount:,.2f} released to seller')
    transaction.transition_to(Transaction.Status.COMPLETED)
    from apps.notifications.services import notify_funds_released
    notify_funds_released(transaction)
    return escrow


def refund_buyer(transaction, performed_by):
    escrow = transaction.escrow_account
    escrow.release_status = EscrowAccount.ReleaseStatus.REFUNDED
    escrow.released_at = timezone.now()
    escrow.save()
    _log(escrow, 'REFUND_ISSUED', performed_by,
         f'Full amount ₦{escrow.held_amount:,.2f} refunded to buyer')
    transaction.transition_to(Transaction.Status.REFUNDED)
    from apps.notifications.services import notify_refund_issued
    notify_refund_issued(transaction)
    return escrow


def partial_release(transaction, release_amount, performed_by):
    escrow = transaction.escrow_account
    remainder = escrow.held_amount - release_amount
    escrow.release_status = EscrowAccount.ReleaseStatus.PARTIAL
    escrow.released_at = timezone.now()
    escrow.save()
    _log(escrow, 'PARTIAL_RELEASE', performed_by,
         f'₦{release_amount:,.2f} released to seller; ₦{remainder:,.2f} refunded to buyer')
    transaction.transition_to(Transaction.Status.COMPLETED)
    from apps.notifications.services import notify_funds_released
    notify_funds_released(transaction)
    return escrow
```

---

### `apps/transactions/services.py`
```python
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Transaction

User = get_user_model()


def create_transaction(buyer, seller_email, title, description, amount, delivery_deadline):
    try:
        seller = User.objects.get(email=seller_email, is_active=True)
    except User.DoesNotExist:
        raise ValueError(f"No active user with email {seller_email} found.")
    if seller == buyer:
        raise ValueError("Buyer and seller cannot be the same user.")
    if seller.role not in ('SELLER', 'ADMIN'):
        raise ValueError("The specified user is not registered as a seller.")
    transaction = Transaction.objects.create(
        buyer=buyer, seller=seller, title=title, description=description,
        amount=amount, currency='NGN', status=Transaction.Status.PENDING,
        delivery_deadline=delivery_deadline,
    )
    from apps.notifications.services import notify_transaction_created
    notify_transaction_created(transaction)
    return transaction


def confirm_delivery(transaction, buyer):
    if transaction.buyer != buyer:
        raise PermissionError("Only the buyer can confirm delivery.")
    if transaction.status != Transaction.Status.IN_ESCROW:
        raise ValueError(f"Cannot confirm delivery for a transaction in '{transaction.status}' status.")
    transaction.transition_to(Transaction.Status.DELIVERED)
    from apps.notifications.services import notify_delivered
    notify_delivered(transaction)
    return transaction


def buyer_confirm_receipt(transaction, buyer):
    if transaction.buyer != buyer:
        raise PermissionError("Only the buyer can confirm receipt.")
    if transaction.status != Transaction.Status.DELIVERED:
        raise ValueError(f"Cannot confirm receipt for a transaction in '{transaction.status}' status.")
    transaction.transition_to(Transaction.Status.CONFIRMED)
    from apps.notifications.services import notify_delivery_confirmed
    notify_delivery_confirmed(transaction)
    return transaction


def cancel_transaction(transaction, user):
    if transaction.status != Transaction.Status.PENDING:
        raise ValueError("Only PENDING transactions can be cancelled.")
    if user not in (transaction.buyer, transaction.seller) and not user.is_staff:
        raise PermissionError("You are not authorised to cancel this transaction.")
    transaction.transition_to(Transaction.Status.CANCELLED)
    return transaction


def auto_release_check():
    from apps.escrow.services import release_funds
    from apps.disputes.models import Dispute
    cutoff = timezone.now() - timezone.timedelta(minutes=1)
    eligible = Transaction.objects.filter(
        status=Transaction.Status.CONFIRMED,
        confirmed_at__lte=cutoff,
    ).exclude(disputes__status__in=[Dispute.Status.OPEN, Dispute.Status.UNDER_REVIEW])
    released = []
    for txn in eligible:
        try:
            system_user = User.objects.filter(is_superuser=True).first()
            release_funds(txn, performed_by=system_user)
            released.append(txn.reference)
        except Exception:
            pass
    return released
```

---

### `apps/disputes/services.py`
```python
from django.utils import timezone
from .models import Dispute
from apps.transactions.models import Transaction


def raise_dispute(transaction, raised_by, reason, evidence_file=None):
    if transaction.status in (Transaction.Status.COMPLETED, Transaction.Status.REFUNDED, Transaction.Status.CANCELLED):
        raise ValueError("Cannot raise a dispute on a closed transaction.")
    if raised_by not in (transaction.buyer, transaction.seller):
        raise PermissionError("Only the buyer or seller can raise a dispute.")
    existing = Dispute.objects.filter(
        transaction=transaction, status__in=[Dispute.Status.OPEN, Dispute.Status.UNDER_REVIEW]
    ).first()
    if existing:
        raise ValueError("An open dispute already exists for this transaction.")
    dispute = Dispute.objects.create(
        transaction=transaction, raised_by=raised_by, reason=reason,
        evidence_file=evidence_file, status=Dispute.Status.OPEN,
    )
    transaction.status = Transaction.Status.DISPUTED
    transaction.save(update_fields=['status', 'updated_at'])
    from apps.notifications.services import notify_dispute_raised
    notify_dispute_raised(transaction, dispute)
    return dispute


def resolve_dispute(dispute, admin, resolution, notes=''):
    from apps.escrow.services import release_funds, refund_buyer, partial_release
    if dispute.status == Dispute.Status.RESOLVED:
        raise ValueError("This dispute is already resolved.")
    dispute.resolution = resolution
    dispute.resolution_notes = notes
    dispute.status = Dispute.Status.RESOLVED
    dispute.resolved_by = admin
    dispute.resolved_at = timezone.now()
    dispute.save()
    transaction = dispute.transaction
    if resolution == Dispute.Resolution.RELEASE:
        release_funds(transaction, performed_by=admin)
    elif resolution == Dispute.Resolution.REFUND:
        refund_buyer(transaction, performed_by=admin)
    elif resolution == Dispute.Resolution.PARTIAL:
        partial_release(transaction, transaction.amount / 2, performed_by=admin)
    from apps.notifications.services import notify_dispute_resolved
    notify_dispute_resolved(transaction, dispute)
    return dispute
```

---

### `apps/scheduler.py`
```python
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from django.conf import settings

logger = logging.getLogger(__name__)
_scheduler = None


def _job_auto_release():
    try:
        from apps.transactions.services import auto_release_check
        released = auto_release_check()
        if released:
            logger.info("[scheduler] Auto-released: %s", ", ".join(released))
    except Exception as exc:
        logger.exception("[scheduler] auto_release error: %s", exc)


def _job_flag_overdue_disputes():
    try:
        from django.utils import timezone
        from apps.disputes.models import Dispute
        from django.contrib.auth import get_user_model
        from django.core.mail import send_mail
        User = get_user_model()
        overdue = Dispute.objects.filter(
            status__in=[Dispute.Status.OPEN, Dispute.Status.UNDER_REVIEW],
            resolution_deadline__lt=timezone.now(),
        )
        count = 0
        for dispute in overdue:
            dispute.status = Dispute.Status.OVERDUE
            dispute.save(update_fields=['status'])
            count += 1
            logger.warning("[scheduler] Dispute overdue: %s — %s",
                           dispute.dispute_id, dispute.transaction.reference)
        if count:
            admins = User.objects.filter(role='ADMIN', is_active=True)
            admin_emails = list(admins.values_list('email', flat=True))
            if admin_emails:
                send_mail(
                    subject=f'[EscrowNG] {count} Overdue Dispute(s) — Immediate Action Required',
                    message=(f'{count} dispute(s) passed their 2-minute resolution window.\n'
                             f'Log in now: http://localhost:8000/dashboard/admin/'),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=admin_emails, fail_silently=True,
                )
            logger.warning("[scheduler] Flagged %d overdue dispute(s).", count)
    except Exception as exc:
        logger.exception("[scheduler] flag_overdue error: %s", exc)


def start():
    global _scheduler
    if _scheduler and _scheduler.running:
        return
    _scheduler = BackgroundScheduler(timezone='Africa/Lagos')
    _scheduler.add_job(_job_auto_release, IntervalTrigger(seconds=30),
                       id='auto_release_funds', replace_existing=True, max_instances=1)
    _scheduler.add_job(_job_flag_overdue_disputes, IntervalTrigger(seconds=30),
                       id='flag_overdue_disputes', replace_existing=True, max_instances=1)
    _scheduler.start()
    logger.info("[scheduler] Started — auto-release every 30s, overdue-flag every 30s")
```

---

### `apps/dashboard/apps.py`
```python
import os
from django.apps import AppConfig


class DashboardConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.dashboard'
    label = 'dashboard'

    def ready(self):
        import sys
        cmd = sys.argv[1] if len(sys.argv) > 1 else ''
        if cmd == 'runserver':
            # Auto-reloader forks subprocess; RUN_MAIN=true marks the serving process.
            # Start scheduler there only (or when --noreload skips forking).
            if '--noreload' not in sys.argv and os.environ.get('RUN_MAIN') != 'true':
                return
        elif cmd:
            return  # Management commands — skip
        # cmd == '' → WSGI/ASGI — always start
        from apps import scheduler
        scheduler.start()
```

---

*Document generated: 2026-05-26*  
*Project: EscrowNG — Covenant University Final Year Project*  
*Author: David Olowolaye*
