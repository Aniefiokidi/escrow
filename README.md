# Escrow-Based Online Payment System

Full-stack escrow platform built with React, Node.js/Express, and MongoDB.

## Tech Stack

- Frontend: React + Vite, functional components, hooks, Axios, Context API
- Backend: Node.js + Express (MVC structure)
- Database: MongoDB with Mongoose ODM
- Auth: JWT + bcrypt password hashing
- Dispute AI: Rule-based recommendation engine

## Core Features Implemented

- Authentication and role-based users (buyer, seller, admin)
- User profiles with trust score and review stats
- Escrow transactions lifecycle:
  - Pending
  - In Escrow
  - In Progress
  - Delivered
  - Completed
  - Disputed
- Milestone-based escrow release (Pending -> Approved -> Released)
- Trust/reputation scoring (0-100) based on completed transactions, disputes, late deliveries, and ratings
- Bidirectional user ratings (1-5 stars + review text)
- Dispute system with evidence (text + file upload) and admin resolution
- AI-assisted dispute recommendation shown to admin panel

## Project Structure

```text
Escrow/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
      app.js
      server.js
    uploads/
    .env.example
  frontend/
    src/
      api/
      components/
      context/
      pages/
      styles/
      App.jsx
      main.jsx
    .env.example
```

## Backend Setup

1. Go to backend folder:

```powershell
cd backend
```

2. Create env file:

```powershell
copy .env.example .env
```

3. Install dependencies:

```powershell
npm install
```

4. Start backend:

```powershell
npm run dev
```

Backend runs on `http://localhost:5000` by default.

## Frontend Setup

1. Go to frontend folder:

```powershell
cd frontend
```

2. Create env file:

```powershell
copy .env.example .env
```

3. Install dependencies:

```powershell
npm install
```

4. Start frontend:

```powershell
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## Key API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/me`

### Transactions
- `POST /api/transactions`
- `GET /api/transactions`
- `GET /api/transactions/:id`
- `PATCH /api/transactions/:id/respond`
- `PATCH /api/transactions/:id/status`

### Milestones
- `POST /api/milestones/transaction/:transactionId`
- `GET /api/milestones/transaction/:transactionId`
- `PATCH /api/milestones/:id/approve`
- `PATCH /api/milestones/:id/release`

### Reviews
- `POST /api/reviews`
- `GET /api/reviews/user/:userId`

### Disputes
- `POST /api/disputes/upload`
- `POST /api/disputes`
- `GET /api/disputes`
- `PATCH /api/disputes/:id/resolve` (admin)

### Trust Score
- `PATCH /api/trust/:userId/recalculate` (admin)

## Rule-Based AI Logic (Current)

Implemented in backend service:
- If no delivery proof/evidence -> favor buyer
- If delivery confirmed + strong seller trust + low seller dispute history -> favor seller
- If mixed weak signals -> flag for admin review

Admin receives:
- Predicted winner (`buyer`, `seller`, `admin`)
- Confidence score
- Explanation text

## Notes

- Admin has final authority on dispute outcome.
- Evidence files are stored in `backend/uploads` and served via `/uploads`.
- Trust score updates automatically from rating and transaction/dispute behavior.

The system can be extended using machine learning (e.g., Logistic Regression via Python FastAPI).
