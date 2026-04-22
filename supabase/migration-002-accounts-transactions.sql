-- ============================================================
-- Moniz — Accounts + Transactions (Phase 2)
-- Run this in Supabase SQL Editor AFTER the original migration.sql
-- This is additive — it does not touch expenses, budgets, recurring_expenses.
-- ============================================================

-- ── 1. accounts ──
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('cash', 'checking', 'savings', 'credit', 'other')),
  starting_balance numeric(12,2) not null default 0,
  currency text not null default 'USD',
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_accounts_user_active on public.accounts (user_id, archived_at);

-- ── 2. transactions ──
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12,2) not null check (amount > 0),
  category text not null,
  currency text not null default 'USD',
  note text,
  date date not null default current_date,
  month date generated always as (date - ((extract(day from date)::int) - 1)) stored,
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_user_date on public.transactions (user_id, date desc);
create index if not exists idx_transactions_user_month on public.transactions (user_id, month);
create index if not exists idx_transactions_account on public.transactions (account_id);
create index if not exists idx_transactions_user_type on public.transactions (user_id, type);


-- ============================================================
-- Row Level Security
-- ============================================================

-- accounts
alter table public.accounts enable row level security;

create policy "Users can view own accounts"
  on public.accounts for select using (auth.uid() = user_id);
create policy "Users can insert own accounts"
  on public.accounts for insert with check (auth.uid() = user_id);
create policy "Users can update own accounts"
  on public.accounts for update using (auth.uid() = user_id);
create policy "Users can delete own accounts"
  on public.accounts for delete using (auth.uid() = user_id);

-- transactions
alter table public.transactions enable row level security;

create policy "Users can view own transactions"
  on public.transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions"
  on public.transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions"
  on public.transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions"
  on public.transactions for delete using (auth.uid() = user_id);
