"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { autoPostRecurring } from "@/lib/auto-post-recurring";
import { monthStart } from "@/lib/months";

/**
 * Run autoPostRecurring at most once per (user, month) per browser session.
 *
 * The dedup key is stored in sessionStorage so:
 *   - Re-rendering the hosting component does NOT re-run posting
 *   - Visiting another page that uses this hook does NOT re-run posting
 *   - Closing the tab and reopening WILL re-run (new session)
 *   - A new month rolling over WILL re-run (key changes)
 *
 * The `onPosted` callback fires only when at least one transaction was
 * actually inserted, so callers can refetch their data to show it.
 *
 * The hook is intentionally fire-and-forget — it never blocks page render
 * and silently swallows errors (the underlying helper handles UNIQUE
 * conflicts and missing accounts cleanly).
 */
export function useAutoPostRecurring(onPosted?: () => void) {
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user) return;

    const month = monthStart();
    const key = `moniz:autopost:${user.id}:${month}`;

    if (sessionStorage.getItem(key)) return;

    // Mark the key BEFORE running so concurrent renders don't double-fire.
    // Even if the await fails, we still skip retries this session — the
    // user can refresh the tab to retry.
    sessionStorage.setItem(key, "1");

    autoPostRecurring(user.id, profile?.currency || "USD")
      .then((result) => {
        if (result.posted > 0 && onPosted) onPosted();
      })
      .catch(() => {
        // Already swallowed inside autoPostRecurring; nothing to do here.
      });
  }, [user, profile, onPosted]);
}
