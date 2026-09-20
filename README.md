# ⛳ Golf Platform Application — Digital Heroes

![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge)

---

## 📖 Project Description

**Golf Platform Application — Digital Heroes** is a full-stack, production-grade golf performance and community platform built as a **Next.js 14 App Router + Supabase** implementation of the Digital Heroes PRD. It combines golf score tracking, a sophisticated draw engine, and a built-in charity giving system into a single, type-safe TypeScript codebase deployable to Vercel in minutes.

The platform is designed for golf club communities: subscribers track their scores using a **5-score rolling window rule** enforced at both the application layer and the PostgreSQL database layer, participate in **monthly prize draws** with algorithmic and random modes, and contribute to charity through an auditable **10% minimum giving ledger**. Admin tools provide full draw simulation, winner verification, and payout workflows — all backed by Supabase Row Level Security that guarantees subscribers can only ever access their own data.

---

## ✨ Features

- 🏌️ **Golf Score Entry & Tracking** — Log scores with the PRD-compliant 5-score rolling window rule; oldest score auto-dropped, one entry per date enforced at both the app and database trigger layers
- 🎰 **Monthly Draw Engine** — Full draw engine supporting random and **score-weighted algorithmic** modes, 40/35/25 pool split across 5/4/3-number matches, jackpot rollover for unmatched 5-number draws, and equal split among tied winners
- 🔍 **Simulate Before Publish** — Admins can run a full draw simulation and review results before officially publishing — preventing irreversible mistakes
- 🎗️ **Charity Contribution System** — Enforced 10% minimum charity contribution per subscription, voluntary top-ups, and an immutable ledger table for transparent admin reporting
- ✅ **Winner Verification State Machine** — Structured `pending → approved/rejected → paid` flow with proof upload support via Supabase Storage
- 🔐 **Auth & Row Level Security** — Supabase email/password auth with PostgreSQL RLS policies — subscribers can only read/write their own rows, even at the database level
- 💳 **Razorpay Payment Integration** — Subscription checkout flow via Razorpay (PCI-compliant, no Stripe invite required for India); production-ready webhook path documented
- 🛡️ **Auditable & Reproducible Draws** — Deterministic seeded RNG for algorithmic draws makes every result auditable and reproducible for support queries
- 📊 **Admin Dashboard** — Draw management, winner approval, charity ledger reporting, and subscriber overview
- 🚀 **Vercel-Ready Deployment** — Single-command deploy to a new Vercel project with environment variables

---

## 🛠️ Tech Stack

### Language & Framework

| Technology | Role |
|---|---|
| TypeScript | End-to-end type safety across frontend, backend, and lib layer |
| Next.js 14 (App Router) | Frontend pages + API routes in a single deployable — server and client components |
| React 18 | UI component layer with Server Components and Client Components |
| Tailwind CSS | Utility-first responsive styling |

### Backend & Database

| Technology | Role |
|---|---|
| Supabase (PostgreSQL) | Primary database — tables, triggers, RLS policies, Supabase Auth, Storage |
| @supabase/supabase-js | JS client for all Supabase database and auth operations |
| @supabase/ssr | Server-side Supabase client for Next.js App Router (cookies-based session) |
| PostgreSQL Triggers | Score rolling-window enforcement at the database layer — correctness guarantee independent of the API |
| Row Level Security (RLS) | Policy-enforced data isolation per subscriber at the Postgres level |

### Payments & External Services

| Technology | Role |
|---|---|
| Razorpay | Payment gateway for subscription checkout (PCI-compliant, India-friendly) |

### Dev & Build Tools

| Tool | Role |
|---|---|
| PostCSS + Autoprefixer | CSS processing pipeline for Tailwind |
| ESLint (next lint) | Code quality and Next.js-specific linting rules |
| TypeScript Compiler (tsc) | Static type checking |
| Vercel | Hosting and CI/CD deployment target |

---

## 📁 Project Structure

```
Golf_Platform_Application/
│
├── app/                          # Next.js 14 App Router — pages and API routes
│   ├── layout.tsx                # Root layout — global styles, auth session provider
│   ├── page.tsx                  # Landing / home page
│   ├── (auth)/                   # Auth route group
│   │   ├── login/page.tsx        # Login page
│   │   └── register/page.tsx     # Registration page
│   ├── dashboard/                # Subscriber dashboard
│   │   └── page.tsx              # Score entry, history, draw status
│   ├── admin/                    # Admin-only pages
│   │   ├── draw/page.tsx         # Draw simulation and publish
│   │   ├── winners/page.tsx      # Winner verification and payout
│   │   ├── charity/page.tsx      # Charity ledger reporting
│   │   └── users/page.tsx        # Subscriber management
│   └── api/                      # Next.js API routes (server-side handlers)
│       ├── scores/route.ts        # Score submission and retrieval
│       ├── draw/route.ts          # Draw execution and simulation
│       ├── subscribe/route.ts     # Subscription activation
│       ├── winners/route.ts       # Winner verification state transitions
│       └── razorpay/
│           └── webhook/route.ts   # Razorpay payment webhook handler
│
├── components/                   # Reusable React components
│   ├── ScoreForm.tsx             # Score entry form with validation
│   ├── ScoreHistory.tsx          # Rolling score display with window logic
│   ├── DrawResult.tsx            # Draw result card — matches, pool splits, winners
│   ├── WinnerCard.tsx            # Winner verification UI
│   ├── CharityLedger.tsx         # Charity contribution table
│   └── ui/                       # Shared UI primitives (buttons, inputs, modals)
│
├── lib/                          # Core business logic (framework-independent)
│   ├── scoreLogic.ts             # 5-score rolling window enforcement, date validation
│   ├── drawEngine.ts             # Random + score-weighted draw, pool splits, jackpot rollover
│   ├── charityLogic.ts           # 10% minimum enforcement, top-up calculation, ledger writes
│   └── supabaseClient.ts         # Supabase client factory (browser and server variants)
│
├── supabase/
│   └── schema.sql                # Complete DB schema — tables, triggers, prize tiers, RLS policies
│
├── .env.example                  # Environment variable template
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.js             # PostCSS configuration
├── tsconfig.json                 # TypeScript compiler config
└── package.json                  # Project metadata and dependencies
```

---

## ⚙️ Installation Steps

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) v9 or higher
- A **new** [Supabase](https://supabase.com/) project (do not reuse an existing project — per PRD §15.1)
- A [Razorpay](https://razorpay.com/) account (open signup for India — no invite needed)
- A **new** [Vercel](https://vercel.com/) account/project for deployment (per PRD §15.1)

### 1. Clone the Repository

```bash
git clone https://github.com/sroy3333/Golf_Platform_Application.git
cd Golf_Platform_Application
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Supabase

1. Create a **new** Supabase project at [supabase.com](https://supabase.com/)
2. In the Supabase dashboard, open the **SQL Editor**
3. Run the full schema file to create all tables, triggers, prize tiers, and RLS policies:

```sql
-- Paste and run the contents of supabase/schema.sql
```

4. In **Authentication → Providers**, enable **Email/Password** sign-in

### 4. Configure Environment Variables

```bash
cp .env.example .env.local
```

Fill in your values:

```env
# Supabase — from your project's Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Service Role — for server-side admin operations
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Razorpay — from Settings → API Keys in your Razorpay dashboard
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

> ⚠️ **Never commit `.env.local` to version control.** The `.env.example` file uses placeholder values — replace all of them with your own project credentials.

---

## ▶️ How to Run the Project Locally

### Development Mode

```bash
npm run dev
```

The app starts at **`http://localhost:3000`**

### Build for Production

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

### Key Pages

| Page | URL | Access |
|---|---|---|
| Home / Landing | `http://localhost:3000/` | Public |
| Register | `http://localhost:3000/register` | Public |
| Login | `http://localhost:3000/login` | Public |
| Subscriber Dashboard | `http://localhost:3000/dashboard` | Authenticated |
| Admin — Draw | `http://localhost:3000/admin/draw` | Admin only |
| Admin — Winners | `http://localhost:3000/admin/winners` | Admin only |
| Admin — Charity Ledger | `http://localhost:3000/admin/charity` | Admin only |

---

## 🎰 Draw Engine — How It Works

The draw engine (`lib/drawEngine.ts`) implements the full PRD §06 specification:

```
Monthly Draw Flow
─────────────────────────────────────────────────────
1.  Pool split:   40% → 5-number match jackpot
                  35% → 4-number match pool
                  25% → 3-number match pool

2.  Modes:        RANDOM  — uniform random selection
                  WEIGHTED — score-based probability weighting
                             (better scorers get higher draw weight)

3.  Jackpot:      5-number match → full 40% pool
                  No match → rolls over to next month's 40% pool

4.  Ties:         Prize split equally among all tied winners

5.  Audit:        Deterministic seeded RNG — every draw is
                  reproducible from its seed for support queries

6.  Simulate:     Admin runs simulation → reviews results →
                  publishes officially (irreversible after publish)
```

---

## 📐 Score Rolling Window — How It Works

Score logic (`lib/scoreLogic.ts`) enforces the PRD §03 5-score rolling window:

```
Rules enforced at BOTH application layer AND database trigger:
──────────────────────────────────────────────────────────────
• Maximum 5 scores in the active window at any time
• One score per calendar date — no duplicate dates allowed
• When a 6th score is submitted → oldest score auto-dropped
• App layer:  clean error message to the user (no extra DB query)
• DB trigger: correctness guarantee even if a future feature
              bypasses the API layer directly
```

---

## 🎗️ Charity Contribution System

Charity logic (`lib/charityLogic.ts`) implements PRD §08:

```
Per subscription:
─────────────────────────────────────────────────────────
• Minimum 10% of subscription amount → charity (enforced, not optional)
• Voluntary top-up → subscriber can contribute more
• Every contribution → immutable row in the charity_ledger table
• Admin reporting → fast queries against ledger (not derived on the fly)
• Percentages stored at write time → correct even if rates change later
```

---

## 🚀 Deployment to Vercel

1. Push your repository to GitHub
2. Create a **new** Vercel project and import the repository
3. In Vercel → **Settings → Environment Variables**, add all five keys from `.env.example` with your real values
4. Deploy — Vercel auto-detects Next.js and runs `npm run build`

> For production: replace the direct subscription activation in `/api/subscribe` with a proper Razorpay Order + Checkout widget, and move activation into the `/api/razorpay/webhook` handler listening for `payment.captured` (one-off) or `subscription.charged` (recurring).

---

## 🗄️ Database Schema (Overview)

All tables, triggers, prize tiers, and RLS policies are defined in `supabase/schema.sql`.

**Core Tables**

| Table | Purpose |
|---|---|
| `users` | Managed by Supabase Auth; extended with `is_admin`, `is_premium` flags |
| `scores` | Player score entries — rolling window enforced by trigger |
| `subscriptions` | Active subscriber records with payment reference |
| `draws` | Monthly draw records — mode, seed, status, published flag |
| `draw_entries` | Individual number selections per subscriber per draw |
| `winners` | Winner records with verification state (`pending/approved/rejected/paid`) and `proof_url` |
| `charity_ledger` | Immutable charity contribution log — one row per payment |
| `prize_tiers` | Configurable prize tier definitions (match count → pool percentage) |

---

## 📄 License

This project is proprietary. All rights reserved by the author.

Unauthorised copying, distribution, or use of this codebase or any part of it is not permitted without explicit written permission.

---

<div align="center">
  <p>Built by <a href="https://github.com/sroy3333">Sukanya Roy</a></p>
  <p>Next.js · Supabase · Razorpay · Vercel · TypeScript · Tailwind CSS</p>
  <p>
    <a href="https://github.com/sroy3333/Golf_Platform_Application/issues">Report a Bug</a> ·
    <a href="https://github.com/sroy3333/Golf_Platform_Application/issues">Request a Feature</a> ·
    <a href="https://github.com/sroy3333/Golf_Platform_Application">View Repository</a>
  </p>
</div>
