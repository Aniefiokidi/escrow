# EscrowNG — Escrow-Based Online Payment System

A production-ready escrow payment platform for the Nigerian digital marketplace.
Final Year Project — Covenant University, CIS Department, 2025.

## Tech Stack
- **Backend:** Python 3.11+ / Django 6.0
- **Database:** PostgreSQL 17
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (no frameworks)
- **Auth:** Django built-in auth + TOTP MFA (pyotp / django-otp)
- **Design:** Deep Navy (#0D1B2A) + Gold (#C9A84C) — custom CSS, fully responsive

## Features
- Role-based accounts: Buyer, Seller, Admin
- Full escrow lifecycle: PENDING → IN_ESCROW → DELIVERED → CONFIRMED → COMPLETED
- Automatic fund release 48h after buyer confirms delivery
- Dispute system with evidence upload, 72h resolution deadline, admin resolution panel
- MFA (TOTP) via QR code setup
- In-app + email notifications for every transaction event
- Admin dashboard with live dispute countdown timers
- Management commands for cron jobs

## Quick Setup

```bash
# 1. Clone and navigate
git clone <repo-url>
cd escrow_project

# 2. Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
copy .env.example .env
# Edit .env with your database credentials and email settings

# 5. Create the PostgreSQL database
# In psql: CREATE DATABASE escrow_db;

# 6. Run migrations
python manage.py migrate

# 7. Seed demo data
python manage.py seed_demo_data

# 8. Collect static files (production)
python manage.py collectstatic --noinput

# 9. Start development server
python manage.py runserver
```

Open http://127.0.0.1:8000 in your browser.

## Demo Credentials (after running seed_demo_data)

| Role   | Email                 | Password       |
|--------|-----------------------|----------------|
| Admin  | admin@escrow.ng       | Admin@123456   |
| Buyer  | buyer1@escrow.ng      | Buyer@123456   |
| Buyer  | buyer2@escrow.ng      | Buyer@123456   |
| Seller | seller1@escrow.ng     | Seller@123456  |
| Seller | seller2@escrow.ng     | Seller@123456  |

## Management Commands (Cron Jobs)

```bash
# Auto-release funds after 48h confirmation (run every 15 minutes)
python manage.py auto_release_funds

# Flag overdue disputes and email admin (run every hour)
python manage.py flag_overdue_disputes
```

**Example crontab:**
```
*/15 * * * * cd /path/to/escrow_project && python manage.py auto_release_funds
0    * * * * cd /path/to/escrow_project && python manage.py flag_overdue_disputes
```

## Key URLs

| URL                              | Description                        |
|----------------------------------|------------------------------------|
| /                                | Redirects to dashboard             |
| /accounts/register/              | User registration                  |
| /accounts/login/                 | Login                              |
| /dashboard/                      | Role-based dashboard               |
| /transactions/                   | List transactions                  |
| /transactions/create/            | Create new transaction (buyer)     |
| /transactions/<uuid>/            | Transaction detail + timeline      |
| /disputes/raise/<uuid>/          | Raise dispute                      |
| /disputes/<uuid>/                | Dispute detail                     |
| /disputes/<uuid>/resolve/        | Resolve dispute (admin)            |
| /notifications/                  | Notification inbox                 |
| /admin/                          | Django admin panel                 |

## Manual Steps After Setup

1. **Email**: Edit `.env` with real SMTP credentials (Gmail App Password recommended)
2. **Production**: Set `DEBUG=False`, `ALLOWED_HOSTS=yourdomain.com`
3. **Media storage**: Configure cloud storage (e.g., AWS S3) for evidence files in production
4. **HTTPS**: Use a reverse proxy (Nginx) with SSL certificate in production
