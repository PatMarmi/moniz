"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Check, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { rateLimit } from "@/lib/rate-limit";

interface ExportDataSheetProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export default function ExportDataSheet({
  open,
  onClose,
  userId,
}: ExportDataSheetProps) {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (exporting) return;
    setDone(false);
    setError(null);
    onClose();
  }

  async function handleExport() {
    setError(null);

    const limited = rateLimit("exportData");
    if (limited) { setError(limited); return; }

    setExporting(true);

    try {
      const supabase = createClient();

      // Phase 4B cutover: export is now centered on accounts + transactions.
      // The legacy `expenses` key is dropped — all that data now lives in
      // `transactions` (migrated rows have a non-null migrated_from_expense_id).
      const [
        profileRes,
        accountsRes,
        transactionsRes,
        budgetsRes,
        recurringRes,
      ] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("*")
          .eq("id", userId)
          .single(),
        supabase
          .from("accounts")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false }),
        supabase
          .from("budgets")
          .select("*")
          .eq("user_id", userId)
          .order("month", { ascending: false }),
        supabase
          .from("recurring_expenses")
          .select("*")
          .eq("user_id", userId),
      ]);

      const transactions = transactionsRes.data ?? [];
      const accounts = accountsRes.data ?? [];
      const budgets = budgetsRes.data ?? [];
      const recurring = recurringRes.data ?? [];

      const exportData = {
        exported_at: new Date().toISOString(),
        schema_version: 2,
        profile: profileRes.data,
        accounts,
        transactions,
        budgets,
        recurring_expenses: recurring,
        summary: {
          total_accounts: accounts.length,
          total_transactions: transactions.length,
          total_income_transactions: transactions.filter(
            (t) => t.type === "income"
          ).length,
          total_expense_transactions: transactions.filter(
            (t) => t.type === "expense"
          ).length,
          total_budgets: budgets.length,
          total_recurring: recurring.length,
        },
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `moniz-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-brand-dark/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-brand-beige border-t border-brand-dark/5 shadow-2xl"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-brand-dark/10" />
            </div>

            <div className="px-5 pb-8 pt-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-brand-dark">
                  Export my data
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 -mr-2 rounded-xl text-brand-dark/30 hover:text-brand-dark/60 hover:bg-brand-dark/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-brand-dark/5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-dark/5 flex items-center justify-center shrink-0">
                      <Download size={18} className="text-brand-dark/40" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-brand-dark">
                        Download your data as JSON
                      </h3>
                      <p className="text-sm text-brand-dark/40 mt-1.5 leading-relaxed">
                        This includes your profile, accounts, transactions,
                        budgets, and recurring bills. The file will be saved
                        to your device.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {[
                      "Profile",
                      "Accounts",
                      "Transactions",
                      "Budgets",
                      "Recurring bills",
                    ].map((item) => (
                      <div
                        key={item}
                        className="text-[11px] font-medium text-brand-dark/30 bg-brand-dark/[0.03] px-3 py-1.5 rounded-lg text-center"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="bg-brand-accent/10 text-brand-accent text-sm px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleExport}
                  disabled={exporting || done}
                  className={`w-full flex items-center justify-center gap-2 font-semibold py-3.5 rounded-2xl transition-all text-sm active:scale-[0.98] disabled:cursor-not-allowed ${
                    done
                      ? "bg-brand-green text-brand-beige"
                      : "bg-brand-accent text-white hover:bg-brand-accent/90 disabled:opacity-50"
                  }`}
                >
                  {done ? (
                    <>
                      <Check size={18} strokeWidth={2.5} />
                      Downloaded
                    </>
                  ) : exporting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Exporting…
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Export data
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="h-[env(safe-area-inset-bottom)]" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
