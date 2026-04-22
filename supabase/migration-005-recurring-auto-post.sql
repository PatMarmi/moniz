-- ══════════════════════════════════════════════════════════════════════
-- Moniz — Phase 5: Recurring auto-post tracking
-- ══════════════════════════════════════════════════════════════════════
--
-- Adds a tracking column to public.transactions so that auto-posted
-- recurring expenses can be linked back to their source template, and
-- a partial unique index that makes it impossible to post the same
-- recurring twice in the same month — even under race conditions.
--
-- IDEMPOTENT: safe to run multiple times. Uses IF NOT EXISTS clauses.
-- ADDITIVE: does not modify or delete any existing row.
-- ══════════════════════════════════════════════════════════════════════

BEGIN;

-- Tracking column on transactions. Nullable: existing transactions
-- (manually entered or migrated from old expenses) have NULL.
-- Auto-posted transactions carry the source recurring_expenses.id.
-- ON DELETE SET NULL: deleting a recurring template does not delete
-- its historical posted transactions — they keep their data, just
-- lose the link.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS posted_from_recurring_id uuid
    REFERENCES public.recurring_expenses(id) ON DELETE SET NULL;

-- Partial unique index: at most one posting per recurring per month.
-- The `WHERE` clause means this constraint applies only to auto-posted
-- rows, leaving manually-entered transactions unconstrained.
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_posted_from_recurring_month
  ON public.transactions (posted_from_recurring_id, month)
  WHERE posted_from_recurring_id IS NOT NULL;

-- Lookup index for "has this recurring posted this month" checks
CREATE INDEX IF NOT EXISTS idx_transactions_user_recurring
  ON public.transactions (user_id, posted_from_recurring_id)
  WHERE posted_from_recurring_id IS NOT NULL;

COMMIT;


-- ══════════════════════════════════════════════════════════════════════
-- VERIFICATION (read-only — run after COMMIT)
-- ══════════════════════════════════════════════════════════════════════
--
-- Column exists?
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'transactions'
--   AND column_name = 'posted_from_recurring_id';
--
-- Indexes exist?
-- SELECT indexname FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND tablename = 'transactions'
--   AND indexname IN (
--     'idx_transactions_posted_from_recurring_month',
--     'idx_transactions_user_recurring'
--   );


-- ══════════════════════════════════════════════════════════════════════
-- ROLLBACK (only run if abandoning the feature entirely)
-- ══════════════════════════════════════════════════════════════════════
--
-- BEGIN;
-- DROP INDEX IF EXISTS public.idx_transactions_user_recurring;
-- DROP INDEX IF EXISTS public.idx_transactions_posted_from_recurring_month;
-- ALTER TABLE public.transactions DROP COLUMN IF EXISTS posted_from_recurring_id;
-- COMMIT;
