-- ============================================================================
-- DIGITAL HEROES — DATABASE SCHEMA
-- Target: Supabase (Postgres + Row Level Security)
-- ============================================================================

-- ---------- EXTENSIONS ----------
create extension if not exists "uuid-ossp";

-- ---------- ENUMS ----------
create type subscription_plan as enum ('monthly', 'yearly');
create type subscription_status as enum ('active', 'inactive', 'cancelled', 'lapsed');
create type draw_mode as enum ('random', 'algorithmic');
create type draw_status as enum ('draft', 'simulated', 'published');
create type match_tier as enum ('3_number', '4_number', '5_number');
create type payout_status as enum ('pending', 'paid');
create type user_role as enum ('subscriber', 'admin');

-- ---------- PROFILES (extends Supabase auth.users) ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'subscriber',
  charity_id uuid references charities(id),
  charity_contribution_pct numeric(5,2) not null default 10.00
    check (charity_contribution_pct >= 10.00 and charity_contribution_pct <= 100.00),
  created_at timestamptz not null default now()
);

-- ---------- CHARITIES ----------
create table charities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  image_url text,
  is_spotlight boolean not null default false,
  upcoming_events jsonb default '[]'::jsonb, -- [{title, date, location}]
  created_at timestamptz not null default now()
);

alter table profiles
  add constraint profiles_charity_fk foreign key (charity_id) references charities(id);

-- ---------- SUBSCRIPTIONS ----------
create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan subscription_plan not null,
  status subscription_status not null default 'inactive',
  razorpay_customer_id text,
  razorpay_subscription_id text,
  current_period_end timestamptz,
  amount_cents integer not null, -- fee actually charged this period
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_subscriptions_user on subscriptions(user_id);
create index idx_subscriptions_status on subscriptions(status);

-- ---------- SCORES ----------
-- Business rule: exactly one score per user per date; only the latest 5 rows
-- per user are ever retained (enforced in application layer via scoreLogic.ts,
-- trigger below is the DB-level backstop).
create table scores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  score integer not null check (score between 1 and 45), -- Stableford points
  played_on date not null,
  created_at timestamptz not null default now(),
  unique (user_id, played_on)
);
create index idx_scores_user_date on scores(user_id, played_on desc);

-- Trigger: after insert, delete any rows beyond the most recent 5 for that user
create or replace function enforce_score_rolling_window()
returns trigger as $$
begin
  delete from scores
  where user_id = new.user_id
    and id not in (
      select id from scores
      where user_id = new.user_id
      order by played_on desc, created_at desc
      limit 5
    );
  return new;
end;
$$ language plpgsql;

create trigger trg_score_rolling_window
after insert on scores
for each row execute function enforce_score_rolling_window();

-- ---------- DRAWS ----------
create table draws (
  id uuid primary key default uuid_generate_v4(),
  period text not null, -- e.g. '2026-04'
  mode draw_mode not null default 'random',
  status draw_status not null default 'draft',
  total_pool_cents integer not null default 0,
  winning_numbers int[] not null default '{}', -- 5 numbers drawn
  jackpot_rollover_cents integer not null default 0,
  simulated_at timestamptz,
  published_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (period)
);

-- ---------- DRAW ENTRIES ----------
-- One entry per active subscriber per draw period, numbers auto-generated
-- from their subscription (kept simple & deterministic for auditability).
create table draw_entries (
  id uuid primary key default uuid_generate_v4(),
  draw_id uuid not null references draws(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  numbers int[] not null,
  matched_count integer not null default 0,
  tier match_tier,
  prize_cents integer not null default 0,
  created_at timestamptz not null default now(),
  unique (draw_id, user_id)
);
create index idx_draw_entries_draw on draw_entries(draw_id);

-- ---------- WINNERS ----------
create table winners (
  id uuid primary key default uuid_generate_v4(),
  draw_entry_id uuid not null references draw_entries(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  proof_url text, -- screenshot upload (Supabase Storage)
  admin_reviewed_by uuid references profiles(id),
  admin_decision text check (admin_decision in ('approved','rejected')),
  payout_status payout_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  paid_at timestamptz
);

-- ---------- CHARITY CONTRIBUTIONS (ledger) ----------
create table charity_contributions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id),
  charity_id uuid not null references charities(id),
  subscription_id uuid references subscriptions(id),
  amount_cents integer not null,
  source text not null default 'subscription' check (source in ('subscription','voluntary')),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table scores enable row level security;
alter table draws enable row level security;
alter table draw_entries enable row level security;
alter table winners enable row level security;
alter table charity_contributions enable row level security;
alter table charities enable row level security;

-- Subscribers see/manage only their own rows; admins see everything.
create policy "own profile" on profiles for select using (auth.uid() = id or exists (
  select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "own scores rw" on scores for all using (
  user_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "own subscription r" on subscriptions for select using (
  user_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "own draw entries r" on draw_entries for select using (
  user_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "charities public read" on charities for select using (true);
create policy "draws public read published" on draws for select using (
  status = 'published' or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "winners public read" on winners for select using (true);
create policy "admin manage everything" on charities for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
