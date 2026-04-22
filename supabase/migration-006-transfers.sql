-- ══════════════════════════════════════════════════════════════════════
-- Moniz — Phase 6: Account-to-account transfers
-- ══════════════════════════════════════════════════════════════════════
--
-- WHAT THIS DOES
--   Extends public.transactions to support transfers between the user's
--   own accounts via paired ledger rows:
--     - transfer_out: money leaving an account (account_id = source)
--     - transfer_in:  money entering an account (account_id = destination)
--   Both rows share a transfer_group_id so they stay linked for
--   edit / delete operations.
--
-- IDEMPOTENT: safe to run multiple times.
-- ADDITIVE: does not modify or delete any existing row.
-- ══════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Step 1: Allow new type values ──
-- Drop and re-add the CHECK constraint to include the two new transfer types.
ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_type_check
    CHECK (type IN ('income', 'expense', 'transfer_in', 'transfer_out'));


-- ── Step 2: Add transfer linkage columns ──
-- transfer_group_id: shared between the two paired rows of a single transfer.
-- paired_account_id: the OTHER account in the pair (so display can show
--   "Checking → Savings" without an extra join).
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS transfer_group_id uuid;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS paired_account_id uuid
    REFERENCES public.accounts(id) ON DELETE SET NULL;


-- ── Step 3: Indexes for transfer lookups ──
-- Group lookup: finding both rows of a transfer for edit/delete
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_group
  ON public.transactions (transfer_group_id)
  WHERE transfer_group_id IS NOT NULL;

-- Type filter: speeds up the "exclude transfers from totals" queries
-- (already covered by existing user_id+month+type queries, this is a backup)
CREATE INDEX IF NOT EXISTS idx_transactions_user_type_month
  ON public.transactions (user_id, type, month);


-- ── Step 4: Defensive integrity check ──
-- A row with transfer_group_id MUST also have paired_account_id, and
-- type MUST be one of the transfer values. This prevents malformed data.
ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_transfer_consistency;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_transfer_consistency CHECK (
    (transfer_group_id IS NULL AND paired_account_id IS NULL
       AND type IN ('income', 'expense'))
    OR
    (transfer_group_id IS NOT NULL AND paired_account_id IS NOT NULL
       AND type IN ('transfer_in', 'transfer_out'))
  );


COMMIT;


-- ══════════════════════════════════════════════════════════════════════
-- VERIFICATION (read-only — run after COMMIT)
-- ══════════════════════════════════════════════════════════════════════
--
-- Type CHECK includes all four values?
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint
-- WHERE conname = 'transactions_type_check';
--
-- New columns exist?
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'transactions'
--   AND column_name IN ('transfer_group_id', 'paired_account_id');
--
-- Indexes exist?
-- SELECT indexname FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND tablename = 'transactions'
--   AND indexname IN ('idx_transactions_transfer_group', 'idx_transactions_user_type_month');


-- ══════════════════════════════════════════════════════════════════════
-- ROLLBACK (only run if abandoning the feature entirely)
-- ══════════════════════════════════════════════════════════════════════
--
-- WARNING: deleting transfer transactions before rollback is recommended
-- so the type CHECK constraint shrink doesn't fail.
--
-- BEGIN;
-- -- Optional: clean up transfer rows first
-- -- DELETE FROM public.transactions WHERE type IN ('transfer_in', 'transfer_out');
--
-- ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_transfer_consistency;
-- DROP INDEX IF EXISTS public.idx_transactions_user_type_month;
-- DROP INDEX IF EXISTS public.idx_transactions_transfer_group;
-- ALTER TABLE public.transactions DROP COLUMN IF EXISTS paired_account_id;
-- ALTER TABLE public.transactions DROP COLUMN IF EXISTS transfer_group_id;
-- ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
-- ALTER TABLE public.transactions
--   ADD CONSTRAINT transactions_type_check CHECK (type IN ('income', 'expense'));
-- COMMIT;
