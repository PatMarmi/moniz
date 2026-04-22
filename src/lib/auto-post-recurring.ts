import { createClient } from "@/lib/supabase/client";
import { monthStart } from "@/lib/months";
import type { RecurringExpense } from "@/types/database";

export interface AutoPostResult {
  posted: number;
  skipped_no_account: boolean;
  /** Postgres error message if the insert failed for a reason other than a race-condition duplicate */
  error?: string;
}

/**
 * Last day of the month for a given Date.
 * Used to cap due_day for short months (e.g. due_day=31 in February).
 */
function getLastDayOfMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/**
 * Format a Date + day-of-month into a YYYY-MM-DD string in local time.
 */
function formatDate(d: Date, day: number): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Auto-post recurring expenses that are due in the current month and haven't
 * been posted yet.
 *
 * Idempotency: enforced at the DB level by a partial UNIQUE index on
 * (posted_from_recurring_id, month). Even if this function is called from
 * multiple browser tabs simultaneously, at most one row per recurring per
 * month is ever inserted. The race-loser sees a 23505 unique_violation
 * which we ignore silently.
 *
 * Account selection: posts to the user's oldest active (non-archived)
 * account. If the user has no active accounts, the entire batch is skipped
 * — we never auto-create accounts on the user's behalf.
 *
 * Date assignment: each posted transaction is dated for the recurring's
 * due_day in the current month, capped at the last day for short months
 * (so due_day=31 in February becomes the 28th or 29th).
 */
export async function autoPostRecurring(
  userId: string,
  currency: string
): Promise<AutoPostResult> {
  const supabase = createClient();
  const month = monthStart();
  const today = new Date();
  const todayDay = today.getDate();
  const lastDay = getLastDayOfMonth(today);

  const [recRes, accRes, postedRes] = await Promise.all([
    supabase
      .from("recurring_expenses")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true),
    supabase
      .from("accounts")
      .select("id")
      .eq("user_id", userId)
      .is("archived_at", null)
      .order("created_at", { ascending: true })
      .limit(1),
    supabase
      .from("transactions")
      .select("posted_from_recurring_id")
      .eq("user_id", userId)
      .eq("month", month)
      .not("posted_from_recurring_id", "is", null),
  ]);

  const recurring: RecurringExpense[] = recRes.data ?? [];
  const accounts = accRes.data ?? [];
  const alreadyPosted = new Set(
    (postedRes.data ?? [])
      .map((p) => p.posted_from_recurring_id as string | null)
      .filter((id): id is string => id !== null)
  );

  // No recurring? Nothing to do.
  if (recurring.length === 0) {
    return { posted: 0, skipped_no_account: false };
  }

  // No active account? Skip the whole batch — we don't silently create
  // an account on the user's behalf for an automated post.
  if (accounts.length === 0) {
    return { posted: 0, skipped_no_account: true };
  }

  const accountId = accounts[0].id;

  // Filter to recurring items that are (a) due this month and (b) not yet posted.
  const toPost = recurring.filter((r) => {
    if (alreadyPosted.has(r.id)) return false;
    if (r.due_day > todayDay) return false;
    return true;
  });

  if (toPost.length === 0) {
    return { posted: 0, skipped_no_account: false };
  }

  const rows = toPost.map((r) => ({
    user_id: userId,
    account_id: accountId,
    type: "expense" as const,
    amount: r.amount,
    category: r.category,
    currency,
    note: r.name,
    date: formatDate(today, Math.min(r.due_day, lastDay)),
    posted_from_recurring_id: r.id,
  }));

  const { data, error } = await supabase
    .from("transactions")
    .insert(rows)
    .select("id");

  if (error) {
    // 23505 = unique_violation. Happens if another tab/request beat us
    // to posting one of the same recurrings. Safe to ignore — the row
    // exists exactly once thanks to the UNIQUE index.
    if (error.code === "23505") {
      return { posted: 0, skipped_no_account: false };
    }
    console.error("[auto-post-recurring] insert failed:", error);
    return { posted: 0, skipped_no_account: false, error: error.message };
  }

  return { posted: data?.length ?? 0, skipped_no_account: false };
}
