-- ============================================================
-- Moniz — Database Schema Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── 1. user_profiles ──
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  monthly_income numeric(10,2) check (monthly_income >= 0),
  rent_amount numeric(10,2) check (rent_amount >= 0),
  savings_goal numeric(10,2) check (savings_goal >= 0),
  currency text not null default 'USD',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── 2. expenses ──
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  category text not null,
  currency text not null default 'USD',
  note text,
  date date not null default current_date,
  month date generated always as (date - ((extract(day from date)::int) - 1)) stored,
  created_at timestamptz not null default now()
);

create index if not exists idx_expenses_user_date on public.expenses (user_id, date desc);
create index if not exists idx_expenses_user_month on public.expenses (user_id, month);
create index if not exists idx_expenses_user_category on public.expenses (user_id, category);

-- ── 3. budgets ──
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  limit_amount numeric(10,2) not null check (limit_amount > 0),
  month date not null,
  created_at timestamptz not null default now(),
  unique (user_id, category, month)
);

create index if not exists idx_budgets_user_month on public.budgets (user_id, month);

-- ── 4. recurring_expenses ──
create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(10,2) not null check (amount > 0),
  due_day integer not null check (due_day between 1 and 31),
  category text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_recurring_user_active on public.recurring_expenses (user_id, is_active);


-- ============================================================
-- Row Level Security
-- ============================================================

-- user_profiles
alter table public.user_profiles enable row level security;

create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

-- expenses
alter table public.expenses enable row level security;

create policy "Users can view own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert own expenses"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own expenses"
  on public.expenses for update
  using (auth.uid() = user_id);

create policy "Users can delete own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- budgets
alter table public.budgets enable row level security;

create policy "Users can view own budgets"
  on public.budgets for select
  using (auth.uid() = user_id);

create policy "Users can insert own budgets"
  on public.budgets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own budgets"
  on public.budgets for update
  using (auth.uid() = user_id);

create policy "Users can delete own budgets"
  on public.budgets for delete
  using (auth.uid() = user_id);

-- recurring_expenses
alter table public.recurring_expenses enable row level security;

create policy "Users can view own recurring expenses"
  on public.recurring_expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert own recurring expenses"
  on public.recurring_expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own recurring expenses"
  on public.recurring_expenses for update
  using (auth.uid() = user_id);

create policy "Users can delete own recurring expenses"
  on public.recurring_expenses for delete
  using (auth.uid() = user_id);


-- ============================================================
-- Triggers
-- ============================================================

-- Auto-create user_profiles row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.user_profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

-- Drop trigger if it exists (idempotent)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at on user_profiles changes
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_user_profile_updated on public.user_profiles;
create trigger on_user_profile_updated
  before update on public.user_profiles
  for each row execute function public.handle_updated_at();
