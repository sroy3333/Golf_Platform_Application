# Digital Heroes — Level 1 Build

A Next.js + Supabase implementation of the Digital Heroes PRD (golf performance
tracking, monthly draw engine, and charity giving).

## Stack
- **Frontend/Backend:** Next.js 14 (App Router, TypeScript) — pages + API routes in one deployable
- **Database/Auth:** Supabase (Postgres, Row Level Security, Auth)
- **Payments:** Razorpay (checkout stubbed — see below). PRD §04 allows
  "Stripe or equivalent PCI-compliant provider" — Razorpay is used here
  since Stripe requires an invite for India-based accounts.
- **Styling:** Tailwind CSS
- **Target host:** Vercel (new account, per PRD §15.1)

## Setup
```bash
npm install
cp .env.example .env.local   # fill in Supabase + Stripe keys
```

1. Create a **new** Supabase project (not personal/existing, per PRD §15.1).
2. Run `supabase/schema.sql` in the Supabase SQL editor — this creates every
   table, the score rolling-window trigger, prize tiers, and RLS policies.
3. In Supabase Auth settings, enable email/password sign-in.
4. Create a Razorpay account (open signup, no invite needed for India) and
   grab the test-mode Key ID / Key Secret from Settings → API Keys.
5. `npm run dev` to run locally, then deploy to a **new** Vercel project and
   add the same env vars there.

## What's fully implemented
- Score entry with the 5-score rolling window rule, enforced at both the
  application layer (`lib/scoreLogic.ts`) and the database layer (Postgres
  trigger in `schema.sql`) — one date per score, oldest dropped automatically.
- Draw engine (`lib/drawEngine.ts`): random and score-weighted algorithmic
  modes, 40/35/25 pool split across 5/4/3-number matches, equal split among
  tied winners, 5-number jackpot rollover, and a simulate-before-publish path.
- Charity contribution math (`lib/charityLogic.ts`): enforced 10% minimum,
  voluntary top-ups, and a ledger table for admin reporting.
- Winner verification state machine: pending → approved/rejected → paid.
- Row Level Security so subscribers can only ever read/write their own rows.

## What's intentionally stubbed for this sample
- **Razorpay webhook** (`/api/razorpay/webhook`): `/api/subscribe` activates a
  subscription directly so the flow is demoable without a live payment
  gateway. In production, replace that direct activation with a Razorpay
  Order + Checkout widget, and move activation into a webhook listening for
  `payment.captured` (one-off) or `subscription.charged` (recurring).
- **Winner proof upload UI**: the `winners` table and API support it
  (`proof_url` via Supabase Storage); the admin screen currently takes a
  winner ID directly rather than a full inbox view, to keep the sample
  scoped.
- **`/api/admin/users`**: referenced by the admin users page but not
  included — a two-line Supabase join (see comment in
  `app/admin/users/page.tsx`).

## Why these choices (for the interview)
- **Trigger + app-layer duplication for the rolling window:** the trigger is
  the correctness guarantee (works even if a future feature bypasses the API);
  the app-layer check gives a clean error message without a second query.
- **Deterministic seeded RNG for algorithmic draws:** makes a "why did I get
  these numbers" support question auditable and reproducible, instead of a
  black box.
- **Ledger table for charity contributions** rather than deriving totals from
  subscriptions on the fly: keeps admin reporting fast and correct even if
  contribution percentages change after the fact.
