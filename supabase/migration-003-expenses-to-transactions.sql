-- ══════════════════════════════════════════════════════════════════════
-- Moniz — Phase 4A: Migrate expenses → transactions
-- ══════════════════════════════════════════════════════════════════════
--
-- WHAT THIS DOES
--   Copies every row in public.expenses into public.transactions as a
--   type='expense' transaction, tied to a per-user 'Legacy expenses'
--   account (created automatically, archived by default).
--
-- WHAT THIS DOES NOT DO
--   - Does NOT delete or modify any row in public.expenses
--   - Does NOT change application code (that's Phase 4B)
--   - Does NOT touch existing transactions created during coexistence
--
-- IDEMPOTENCY
--   Safe to run multiple times. Each step uses NOT EXISTS checks or
--   IF NOT EXISTS clauses. Re-running will insert zero new rows if the
--   migration has already completed successfully.
--
-- HOW TO RUN
--   1. Run the PRE-FLIGHT queries (read-only) and note the counts.
--   2. Run the BEGIN...COMMIT migration block.
--   3. Run the POST-FLIGHT queries and confirm counts match.
--   4. If anything looks wrong, run the ROLLBACK block at the bottom.
--
-- ══════════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════════════
-- PRE-FLIGHT QUERIES (read-only — run these first, note the numbers)
-- ══════════════════════════════════════════════════════════════════════

-- How many expenses exist total
SELECT count(*) AS total_expenses FROM public.expenses;

-- How many distinct users have at least one expense
SELECT count(DISTINCT user_id) AS users_with_expenses FROM public.expenses;

-- Are there already any migrated transactions? (should be 0 on first run)
-- SELECT count(*) AS already_migrated
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'transactions'
--   AND column_name = 'migrated_from_expense_id';


-- ══════════════════════════════════════════════════════════════════════
-- MIGRATION (wrapped in a single transaction — all-or-nothing)
-- ══════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Step 1: Add idempotency column to transactions ──
--
-- A nullable uuid column that points back at the source expense row.
-- Existing (user-created) transactions have NULL.
-- Migrated transactions have the source expense.id.
-- A partial unique index prevents the same expense from being migrated twice.

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS migrated_from_expense_id uuid
    REFERENCES public.expenses(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_migrated_from_expense
  ON public.transactions (migrated_from_expense_id);


-- ── Step 2: Create a 'Legacy expenses' account per user with expenses ──
--
-- One archived account per user, type='other', starting_balance=0.
-- Archived by default so it doesn't pollute the active accounts list
-- or dashboard balance total. The account still appears in transaction
-- history with the "· archived" tag (already rendered by the UI).
--
-- Currency falls back to 'USD' if the user profile is missing.

INSERT INTO public.accounts (
  user_id, name, type, starting_balance, currency, archived_at, created_at
)
SELECT DISTINCT
  e.user_id,
  'Legacy expenses',
  'other',
  0,
  COALESCE(p.currency, 'USD'),
  now(),
  now()
FROM public.expenses e
LEFT JOIN public.user_profiles p ON p.id = e.user_id
WHERE NOT EXISTS (
  SELECT 1
  FROM public.accounts a
  WHERE a.user_id = e.user_id
    AND a.name = 'Legacy expenses'
);


-- ── Step 3: Insert one transaction per expense ──
--
-- Skips any expense that has already been migrated (NOT EXISTS check
-- against migrated_from_expense_id). Preserves the original created_at
-- and date so historical ordering is intact.

INSERT INTO public.transactions (
  user_id,
  account_id,
  type,
  amount,
  category,
  currency,
  note,
  date,
  created_at,
  migrated_from_expense_id
)
SELECT
  e.user_id,
  (
    SELECT a.id
    FROM public.accounts a
    WHERE a.user_id = e.user_id
      AND a.name = 'Legacy expenses'
    LIMIT 1
  ) AS account_id,
  'expense',
  e.amount,
  e.category,
  e.currency,
  e.note,
  e.date,
  e.created_at,
  e.id
FROM public.expenses e
WHERE NOT EXISTS (
  SELECT 1
  FROM public.transactions t
  WHERE t.migrated_from_expense_id = e.id
);


COMMIT;


-- ══════════════════════════════════════════════════════════════════════
-- POST-FLIGHT VERIFICATION (run after COMMIT — counts must match)
-- ══════════════════════════════════════════════════════════════════════

-- A) Every expense has exactly one corresponding migrated transaction
--    expected_result: zero rows
-- SELECT e.id, e.user_id, e.amount, e.date
-- FROM public.expenses e
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.transactions t
--   WHERE t.migrated_from_expense_id = e.id
-- );

-- B) Counts match
--    total_expenses should equal migrated_transactions
-- SELECT
--   (SELECT count(*) FROM public.expenses) AS total_expenses,
--   (SELECT count(*) FROM public.transactions WHERE migrated_from_expense_id IS NOT NULL) AS migrated_transactions;

-- C) Every user with expenses has a Legacy account
--    expected_result: zero rows
-- SELECT DISTINCT e.user_id
-- FROM public.expenses e
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.accounts a
--   WHERE a.user_id = e.user_id AND a.name = 'Legacy expenses'
-- );

-- D) Spot-check a few migrated rows side by side
-- SELECT
--   e.id AS expense_id, e.amount AS e_amount, e.category AS e_cat, e.date AS e_date,
--   t.id AS tx_id, t.amount AS t_amount, t.category AS t_cat, t.date AS t_date,
--   t.type AS t_type, t.account_id
-- FROM public.expenses e
-- JOIN public.transactions t ON t.migrated_from_expense_id = e.id
-- ORDER BY e.created_at DESC
-- LIMIT 20;


-- ══════════════════════════════════════════════════════════════════════
-- ROLLBACK (only run if you need to undo the migration)
-- ══════════════════════════════════════════════════════════════════════
--
-- This removes every migrated transaction and every auto-created
-- Legacy expenses account. The expenses table is untouched (it never
-- was modified), so your original data is safe. After rollback you
-- can re-run the migration above.
--
-- BEGIN;
--
-- -- Delete migrated transactions (leaves user-created transactions alone)
-- DELETE FROM public.transactions
-- WHERE migrated_from_expense_id IS NOT NULL;
--
-- -- Delete auto-created Legacy accounts (must be archived AND have no
-- -- remaining transactions pointing at them, which is true after the
-- -- previous DELETE)
-- DELETE FROM public.accounts
-- WHERE name = 'Legacy expenses'
--   AND archived_at IS NOT NULL
--   AND starting_balance = 0
--   AND NOT EXISTS (
--     SELECT 1 FROM public.transactions t WHERE t.account_id = accounts.id
--   );
--
-- -- Optional: remove the idempotency column entirely
-- -- (only do this if you're fully abandoning Phase 4, not just retrying)
-- -- DROP INDEX IF EXISTS public.idx_transactions_migrated_from_expense;
-- -- ALTER TABLE public.transactions DROP COLUMN IF EXISTS migrated_from_expense_id;
--
-- COMMIT;
