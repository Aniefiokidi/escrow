# EscrowNG — User Manual

EscrowNG is a secure escrow payment platform for Nigerian digital marketplaces. It holds funds safely between buyers and sellers until a transaction is confirmed, protecting both parties from fraud.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [User Roles](#2-user-roles)
3. [Registration & Login](#3-registration--login)
4. [Two-Factor Authentication (MFA)](#4-two-factor-authentication-mfa)
5. [Dashboards](#5-dashboards)
6. [Creating a Transaction (Buyer)](#6-creating-a-transaction-buyer)
7. [Transaction Lifecycle](#7-transaction-lifecycle)
8. [Marking Delivery (Seller)](#8-marking-delivery-seller)
9. [Confirming Receipt (Buyer)](#9-confirming-receipt-buyer)
10. [Raising a Dispute](#10-raising-a-dispute)
11. [Resolving a Dispute (Admin)](#11-resolving-a-dispute-admin)
12. [Cancelling a Transaction](#12-cancelling-a-transaction)
13. [Notifications](#13-notifications)
14. [Profile Management](#14-profile-management)
15. [Admin Panel](#15-admin-panel)
16. [Transaction Reference Numbers](#16-transaction-reference-numbers)
17. [Frequently Asked Questions](#17-frequently-asked-questions)

---

## 1. Getting Started

### System Requirements
- A modern web browser (Chrome, Firefox, Edge, Safari)
- A valid email address
- An authenticator app (Google Authenticator, Authy) if you enable MFA

### Demo Credentials (Development/Testing)

| Role   | Email               | Password      |
|--------|---------------------|---------------|
| Admin  | admin@escrow.ng     | Admin@123456  |
| Buyer  | buyer1@escrow.ng    | Buyer@123456  |
| Seller | seller1@escrow.ng   | Seller@123456 |

> These credentials are for testing only. In production, register your own account.

---

## 2. User Roles

EscrowNG has three roles. You select your role at registration and it determines what actions you can perform.

| Role   | What they can do |
|--------|-----------------|
| **Buyer** | Create transactions, fund escrow, confirm receipt, raise disputes, cancel pending transactions |
| **Seller** | View assigned transactions, mark goods/services as delivered, raise disputes |
| **Admin** | View all transactions and users, resolve disputes, access the admin panel |

> A user cannot be both a Buyer and a Seller simultaneously. Create separate accounts if you need both roles.

---

## 3. Registration & Login

### Registering an Account

1. Go to the home page and click **Register**.
2. Fill in:
   - **Full Name** — your real name
   - **Email Address** — will be your login username
   - **Password** — must be strong (mixed case, numbers, symbols)
   - **Role** — choose Buyer or Seller
3. Click **Create Account**.
4. You will be redirected to the login page.

### Logging In

1. Go to `/accounts/login/`.
2. Enter your **email** and **password**.
3. Click **Login**.
4. If MFA is enabled on your account, you will be prompted for a 6-digit code (see Section 4).
5. After successful login you are taken to your role-based dashboard.

### Logging Out

Click your name or avatar in the top navigation bar and select **Logout**, or navigate to `/accounts/logout/`.

---

## 4. Two-Factor Authentication (MFA)

MFA adds an extra layer of security using a time-based one-time password (TOTP).

### Enabling MFA

1. Log in to your account.
2. Go to **Profile** > **Security** or navigate to `/accounts/mfa-setup/`.
3. A QR code is displayed.
4. Open your authenticator app (Google Authenticator, Authy, etc.) and scan the QR code.
   - Alternatively, manually enter the secret key shown below the QR code.
5. Enter the **6-digit code** shown in your authenticator app into the verification field.
6. Click **Enable MFA**.

From this point on, every login will require both your password and a fresh 6-digit code from your authenticator app.

### Logging In with MFA

1. Enter your email and password as normal.
2. A **MFA Verification** screen appears.
3. Open your authenticator app and enter the current 6-digit code.
4. Click **Verify**. Codes expire every 30 seconds — if it fails, wait for the next code.

> **Important:** If you lose access to your authenticator app, contact your system administrator to reset MFA.

---

## 5. Dashboards

After login you are automatically directed to the dashboard for your role.

### Buyer Dashboard

Shows a summary of:
- Transactions pending payment confirmation
- Funds currently held in escrow
- Completed transactions
- Items awaiting your delivery confirmation

### Seller Dashboard

Shows:
- Transactions assigned to you
- Funds currently in escrow (pending your delivery)
- Total earnings from completed transactions

### Admin Dashboard

Shows:
- Platform-wide totals: users, transactions, funds in escrow
- All open disputes sorted by resolution deadline
- Full transaction list with search and status filter

---

## 6. Creating a Transaction (Buyer)

Only users with the **Buyer** role can create transactions.

1. From your dashboard, click **New Transaction** or go to `/transactions/create/`.
2. Fill in the form:

   | Field | Description |
   |-------|-------------|
   | **Seller Email** | The registered email of the seller you are transacting with |
   | **Title** | A short name for what you are buying (e.g. "Logo Design") |
   | **Description** | Full details of the goods or services |
   | **Amount (NGN)** | The agreed price in Nigerian Naira |
   | **Delivery Deadline** | The date and time by which the seller must deliver |

3. Click **Create & Fund Escrow**.
4. The system immediately:
   - Creates the transaction with a reference number (e.g. `ESC-2026-00001`)
   - Locks the funds in an escrow account
   - Notifies the seller
5. You are redirected to the transaction detail page.

> The seller must already have a registered account on EscrowNG. The transaction cannot be created with an unregistered email.

---

## 7. Transaction Lifecycle

Every transaction follows a strict sequence of statuses:

```
PENDING → IN_ESCROW → DELIVERED → CONFIRMED → COMPLETED
                   ↘ DISPUTED ↗
                   ↘ CANCELLED
                              ↘ REFUNDED
```

| Status | Meaning |
|--------|---------|
| **PENDING** | Transaction created, awaiting escrow funding |
| **IN_ESCROW** | Funds locked; seller should now deliver goods/service |
| **DELIVERED** | Seller has marked the order as delivered |
| **CONFIRMED** | Buyer confirmed receipt; 48-hour hold before funds release |
| **COMPLETED** | Funds released to seller — transaction closed |
| **DISPUTED** | A dispute has been raised; admin will arbitrate |
| **REFUNDED** | Admin ruled in buyer's favour; funds returned |
| **CANCELLED** | Transaction cancelled before completion |

The transaction detail page (`/transactions/<id>/`) shows a step-by-step progress tracker and the full escrow audit log.

---

## 8. Marking Delivery (Seller)

When you have delivered the goods or completed the service:

1. Go to **My Transactions** and open the relevant transaction (status must be `IN_ESCROW`).
2. Click **Mark as Delivered**.
3. The status changes to `DELIVERED` and the buyer is notified to confirm receipt.

> Only the **Seller** can mark a transaction as delivered. You cannot mark delivery if the status is not `IN_ESCROW`.

---

## 9. Confirming Receipt (Buyer)

When you have received the goods or service:

1. Open the transaction (status must be `DELIVERED`).
2. Click **Confirm Receipt**.
3. The status changes to `CONFIRMED`.
4. Funds are held for **48 hours** to give you time to raise a dispute if something is wrong.
5. After 48 hours with no dispute, funds are automatically released to the seller (`COMPLETED`).

> If you are satisfied, you can also allow the automatic release — no further action is needed after confirming receipt.

---

## 10. Raising a Dispute

Either the **Buyer** or **Seller** can raise a dispute when there is a problem with a transaction. Disputes can be raised when the transaction status is `IN_ESCROW`, `DELIVERED`, or `CONFIRMED`.

### How to Raise a Dispute

1. Open the transaction detail page.
2. Click **Raise Dispute**.
3. Fill in:
   - **Reason** — clearly explain the problem (e.g. item not received, wrong item, service not rendered)
   - **Evidence File** (optional) — attach supporting proof (PDF, JPG, or PNG; max 5 MB)
4. Click **Submit Dispute**.
5. The transaction status changes to `DISPUTED`.
6. An admin will review and resolve the dispute within **72 hours**.
7. You will be given a dispute reference ID for tracking.

### Dispute Statuses

| Status | Meaning |
|--------|---------|
| **OPEN** | Dispute submitted, awaiting admin review |
| **UNDER REVIEW** | Admin is reviewing evidence |
| **RESOLVED** | Admin has issued a resolution |
| **OVERDUE** | 72-hour resolution window has passed without a decision |

---

## 11. Resolving a Dispute (Admin)

Only **Admin** users can resolve disputes.

1. Log in as Admin and go to the Admin Dashboard.
2. Open disputes are listed sorted by deadline (most urgent first).
3. Click a dispute to view details, the reason, and any evidence file.
4. Choose a resolution:

   | Resolution | Effect |
   |------------|--------|
   | **Release to Seller** | Funds are released to the seller (transaction → COMPLETED) |
   | **Refund to Buyer** | Funds are returned to the buyer (transaction → REFUNDED) |
   | **Partial Release** | A portion is released; admin provides notes on the split |

5. Add **Resolution Notes** explaining the decision.
6. Click **Resolve Dispute**.
7. Both parties are notified of the outcome.

---

## 12. Cancelling a Transaction

A transaction can be cancelled by the **Buyer** or **Admin** when the status is `PENDING` or `IN_ESCROW`.

1. Open the transaction detail page.
2. Click **Cancel Transaction**.
3. Confirm the action.
4. The status changes to `CANCELLED` and any escrowed funds are returned.

> Transactions that have already been marked `DELIVERED` or `CONFIRMED` cannot be cancelled — raise a dispute instead.

---

## 13. Notifications

EscrowNG sends in-app notifications for all key events:

- Transaction created / funded
- Delivery marked by seller
- Receipt confirmed by buyer
- Dispute raised or resolved
- Funds released

Notifications appear in the top navigation bar. Click the bell icon to view all notifications. You can mark them as read individually.

---

## 14. Profile Management

Go to **Profile** (`/accounts/profile/`) to:

- Update your **Full Name** and **Phone Number**
- Upload a **Profile Picture**
- Enable or manage **Two-Factor Authentication** (see Section 4)

Click **Save Changes** after editing.

---

## 15. Admin Panel

The Django admin panel is available at `/admin/` for superusers. It provides direct database access for:

- Managing user accounts (activate/deactivate, change roles)
- Viewing and editing all transactions, escrow accounts, and audit logs
- Reviewing dispute records

> Regular buyers and sellers do not have access to `/admin/`. Use the main dashboard instead.

---

## 16. Transaction Reference Numbers

Every transaction is assigned a unique reference in the format:

```
ESC-YYYY-NNNNN
```

Examples: `ESC-2026-00001`, `ESC-2026-00042`

Use this reference when communicating with support or searching for a transaction in the dashboard.

---

## 17. Frequently Asked Questions

**Q: Can I use EscrowNG without an account?**
No. Both the buyer and seller must have registered accounts.

**Q: What currency does EscrowNG use?**
All transactions are in Nigerian Naira (NGN).

**Q: When do funds get released to the seller?**
Funds are released automatically 48 hours after the buyer confirms receipt, provided no dispute is raised during that window.

**Q: What happens if the seller misses the delivery deadline?**
The buyer can raise a dispute. The admin will review and can issue a refund.

**Q: Can I change my role after registration?**
No. Role changes must be done by an Admin through the admin panel.

**Q: Can a seller create a transaction?**
No. Only buyers can initiate transactions. The seller simply receives a notification and fulfils the order.

**Q: What file types are accepted as dispute evidence?**
PDF, JPG, and PNG files up to 5 MB.

**Q: How long does dispute resolution take?**
Admins aim to resolve disputes within 72 hours of the dispute being raised.

**Q: What is MFA and do I have to use it?**
MFA (Multi-Factor Authentication) is optional but strongly recommended. It requires a second verification step during login, protecting your account even if your password is compromised.

**Q: Who do I contact if I have a problem?**
Contact your platform administrator or raise a dispute through the system for transaction-related issues.

---

*EscrowNG — Secure. Transparent. Trusted.*
