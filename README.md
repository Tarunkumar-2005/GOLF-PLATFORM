# ⛳ GolfGives — Golf Subscription Platform

> Play. Win. Give. — A full-stack golf subscription platform with Stableford score tracking, monthly prize draws, and charity donations.

---

## 🏗️ Tech Stack

| Layer       | Technology                               |
|-------------|------------------------------------------|
| Frontend    | React + Vite, Tailwind CSS, Shadcn/ui    |
| Backend     | Node.js + Express (deployed on Vercel)   |
| Database    | Supabase (PostgreSQL + Auth + RLS)       |
| Payments    | Stripe Subscriptions + Webhooks          |
| Email       | Nodemailer (SMTP)                        |
| Deployment  | Vercel (frontend + backend)              |

---

## 📁 Project Structure

```
golf-platform/
├── frontend/               # Vite + React app
│   ├── src/
│   │   ├── components/     # UI + layout components
│   │   ├── pages/          # Route pages
│   │   ├── context/        # Auth context
│   │   ├── lib/            # Supabase client, utils
│   │   └── styles/         # Global CSS
│   └── vercel.json
│
├── backend/                # Express API
│   ├── src/
│   │   ├── config/         # Supabase + Stripe clients
│   │   ├── middleware/      # Auth middleware
│   │   ├── routes/         # payments, draws, admin
│   │   └── services/       # drawService, emailService
│   └── vercel.json
│
└── supabase-schema.sql     # Full DB schema + RLS + seed data
```

---

## 🚀 Setup Guide

### 1. Supabase Setup

1. Create a **new** Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase-schema.sql` (in project root)
3. Copy your credentials from **Settings → API**:
   - `Project URL` → `VITE_SUPABASE_URL` / `SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. In **Products**, create a new product:
   - Name: `GolfGives Monthly`
   - Price: `£9.99 / month` (recurring)
   - Copy the **Price ID** → `STRIPE_PRICE_ID`
3. Go to **Developers → API Keys**:
   - Publishable key → `VITE_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`
4. Go to **Developers → Webhooks** → Add endpoint:
   - URL: `https://your-backend.vercel.app/api/payments/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
```

### 4. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
```

---

## 🌍 Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
# Push to GitHub, import repo to vercel.com
# Set environment variables in Vercel dashboard
```

### Backend → Vercel

```bash
cd backend
# Push to GitHub, import repo to vercel.com
# Set environment variables in Vercel dashboard
# Set FRONTEND_URL to your deployed frontend URL
```

---

## 🛡️ Admin Setup

After deploying, promote a user to admin via Supabase SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE id = 'your-user-uuid';
```

Or use the Admin API endpoint (requires existing admin):

```
PATCH /api/admin/users/:userId/role
Body: { "role": "admin" }
```

---

## 🎰 Draw System

### How draws work

1. Admin schedules a draw with a date and prize pool
2. On draw day, admin clicks **Run Draw** in the Admin Panel
3. The backend:
   - Generates 5 random winning numbers (1–50)
   - For each subscriber, generates entry numbers seeded by their top 3 scores
   - Counts matches and awards prizes:
     - **5 match** → Jackpot (40% of prize pool)
     - **4 match** → £1,200 tier (35% of prize pool)
     - **3 match** → £300 tier (25% of prize pool)
   - Sends email notifications to all subscribers
4. Admin verifies each winner, triggering a verification email

### Score → Entry Number Logic

Users who play better golf get better entry numbers. Scores are mapped to number ranges (1–50) to create 5 unique entry numbers. Subscribers who log 0 scores still get random entries.

---

## 💳 Subscription Split

| Component         | Percentage |
|-------------------|-----------|
| Prize pool        | 60%       |
| Platform costs    | 30%       |
| Charity donation  | 10%       |

---

## 📧 Email Notifications

The platform sends automated emails for:
- Welcome on signup
- Subscription confirmed
- Draw results (win or no win)
- Winner verification confirmed

Configure SMTP in `backend/.env` using Gmail App Password or any SMTP provider.

---

## 🔐 Environment Variables

### Frontend (`frontend/.env`)

| Variable                    | Description                    |
|-----------------------------|-------------------------------|
| `VITE_SUPABASE_URL`         | Supabase project URL           |
| `VITE_SUPABASE_ANON_KEY`    | Supabase anon/public key       |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key       |
| `VITE_API_URL`              | Backend URL (e.g. localhost:5000) |

### Backend (`backend/.env`)

| Variable                   | Description                       |
|----------------------------|----------------------------------|
| `SUPABASE_URL`             | Supabase project URL              |
| `SUPABASE_SERVICE_ROLE_KEY`| Supabase service role (admin) key |
| `STRIPE_SECRET_KEY`        | Stripe secret key                 |
| `STRIPE_WEBHOOK_SECRET`    | Stripe webhook signing secret     |
| `STRIPE_PRICE_ID`          | Stripe Price ID for subscription  |
| `FRONTEND_URL`             | Deployed frontend URL             |
| `EMAIL_HOST`               | SMTP host (e.g. smtp.gmail.com)   |
| `EMAIL_PORT`               | SMTP port (587)                   |
| `EMAIL_USER`               | SMTP username                     |
| `EMAIL_PASS`               | SMTP password / app password      |

---

## 🧪 Testing Locally

Use Stripe test cards:
- ✅ Success: `4242 4242 4242 4242`
- ❌ Decline: `4000 0000 0000 0002`
- 🔐 3DS:    `4000 0025 0000 3155`

For webhook testing locally, use [Stripe CLI](https://stripe.com/docs/stripe-cli):
```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

---

## 📋 Pages Overview

| Route         | Description                          | Auth Required |
|---------------|--------------------------------------|--------------|
| `/`           | Landing / marketing page             | No           |
| `/signup`     | Create account                       | No           |
| `/login`      | Sign in                              | No           |
| `/charities`  | Browse & select charities            | No           |
| `/dashboard`  | Personal stats & score chart         | Yes          |
| `/scores`     | Log & view Stableford scores         | Yes          |
| `/draw`       | View upcoming draw & entry history   | Yes          |
| `/subscribe`  | Stripe subscription checkout         | Yes          |
| `/winners`    | Public winners board                 | Yes          |
| `/admin`      | Admin panel (draws, users, charities)| Admin only   |
