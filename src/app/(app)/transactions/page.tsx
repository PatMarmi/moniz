"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Receipt, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import {
  getAnyCategoryByValue,
  DEFAULT_ACCOUNT,
} from "@/lib/constants";
import MonthSelector from "@/components/month-selector";
import { monthStart, formatMonth } from "@/lib/months";
import { useAutoPostRecurring } from "@/lib/use-auto-post-recurring";
import AddTransactionSheet from "@/components/add-transaction-sheet";
import type { Account, Transaction } from "@/types/database";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const vp = { once: true, margin: "-40px" as const };

function formatDayHeader(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function TransactionsPage() {
  const { user, profile } = useAuth();
  const [month, setMonth] = useState(() => monthStart());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  /** All accounts for this user (active + archived), used to resolve names */
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(
    null
  );
  const [creatingDefault, setCreatingDefault] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();

    const [txRes, accRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("month", month)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
    ]);

    setTransactions(txRes.data ?? []);
    setAllAccounts(accRes.data ?? []);
    setLoading(false);
  }, [user, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Post any due recurring expenses for the current month, then refetch.
  // Idempotent and capped at once per session by the hook.
  useAutoPostRecurring(fetchData);

  if (!user) return null;

  const activeAccounts = allAccounts.filter((a) => !a.archived_at);

  /**
   * Accounts to show in the sheet's picker.
   * If editing a transaction tied to an archived account, include that
   * archived account so editing still works without forcing a reassignment.
   */
  const sheetAccounts = editTransaction
    ? [
        ...activeAccounts,
        ...allAccounts.filter(
          (a) =>
            a.archived_at &&
            a.id === editTransaction.account_id &&
            !activeAccounts.find((x) => x.id === a.id)
        ),
      ]
    : activeAccounts;

  // Month totals
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  const net = totalIncome - totalExpense;

  // Group by date
  const byDate: Record<string, Transaction[]> = {};
  transactions.forEach((t) => {
    byDate[t.date] = byDate[t.date] || [];
    byDate[t.date].push(t);
  });
  const sortedDates = Object.keys(byDate).sort((a, b) => (a < b ? 1 : -1));

  // Account name lookup
  const accountById: Record<string, Account> = Object.fromEntries(
    allAccounts.map((a) => [a.id, a])
  );

  async function openAdd() {
    setEditTransaction(null);

    // Auto-create a default Cash account if user has none
    if (activeAccounts.length === 0) {
      setCreatingDefault(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("accounts")
        .insert({
          user_id: user!.id,
          name: DEFAULT_ACCOUNT.name,
          type: DEFAULT_ACCOUNT.type,
          starting_balance: DEFAULT_ACCOUNT.starting_balance,
          currency: profile?.currency || "USD",
        })
        .select()
        .single();

      if (error || !data) {
        setCreatingDefault(false);
        return;
      }

      setAllAccounts((prev) => [...prev, data]);
      setCreatingDefault(false);
    }

    setSheetOpen(true);
  }

  function openEdit(t: Transaction) {
    setEditTransaction(t);
    setSheetOpen(true);
  }

  // Empty state
  if (!loading && transactions.length === 0) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="flex justify-center">
          <MonthSelector value={month} onChange={setMonth} />
        </div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={vp}
          variants={fadeUp}
          custom={0}
          className="bg-brand-dark rounded-2xl p-8 sm:p-12 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-brand-accent/15 flex items-center justify-center mx-auto mb-5">
            <Receipt size={28} className="text-brand-accent" />
          </div>
          <h2 className="text-xl font-bold text-brand-beige">
            No transactions in {formatMonth(month)}
          </h2>
          <p className="text-sm text-brand-beige/40 mt-2 max-w-sm mx-auto leading-relaxed">
            Log income and expenses to track your real money flow. Each
            transaction updates your account balance automatically.
          </p>
          <button
            onClick={openAdd}
            disabled={creatingDefault}
            className="mt-8 inline-flex items-center gap-2 bg-brand-accent text-white font-semibold px-6 py-3 rounded-full hover:bg-brand-accent/90 transition-colors text-sm disabled:opacity-50"
          >
            {creatingDefault ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Setting up…
              </>
            ) : (
              <>
                <Plus size={16} strokeWidth={2.2} />
                Add first transaction
              </>
            )}
          </button>
        </motion.div>

        <AddTransactionSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onSaved={fetchData}
          userId={user.id}
          accounts={sheetAccounts}
          defaultCurrency={profile?.currency || "USD"}
          editTransaction={editTransaction}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex justify-center">
        <MonthSelector value={month} onChange={setMonth} />
      </div>

      {/* Header: month totals */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={vp}
        variants={fadeUp}
        custom={0}
        className="flex items-end justify-between"
      >
        <div>
          <p className="text-xs text-brand-dark/40 font-medium uppercase tracking-wider">
            Net this month
          </p>
          <p
            className={`text-3xl font-bold mt-1 tracking-tight ${
              net >= 0 ? "text-brand-dark" : "text-brand-accent"
            }`}
          >
            {net >= 0 ? "+" : "-"}${Math.abs(net).toFixed(2)}
          </p>
          <p className="text-xs text-brand-dark/30 mt-1">
            <span className="text-brand-green font-medium">
              +${totalIncome.toFixed(2)}
            </span>{" "}
            · <span>-${totalExpense.toFixed(2)}</span>
          </p>
        </div>
        <button
          onClick={openAdd}
          disabled={creatingDefault}
          className="flex items-center gap-2 bg-brand-accent text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-brand-accent/90 transition-colors active:scale-[0.97] disabled:opacity-50"
        >
          {creatingDefault ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Plus size={16} strokeWidth={2.2} />
          )}
          Add
        </button>
      </motion.div>

      {/* Grouped by day */}
      <div className="space-y-4">
        {sortedDates.map((d) => {
          const dayTotal = byDate[d].reduce(
            (s, t) =>
              s + (t.type === "income" ? Number(t.amount) : -Number(t.amount)),
            0
          );
          return (
            <motion.div
              key={d}
              initial="hidden"
              whileInView="visible"
              viewport={vp}
              variants={fadeUp}
              custom={0}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-xs text-brand-dark/30 uppercase tracking-wider font-semibold">
                  {formatDayHeader(d)}
                </p>
                <p
                  className={`text-xs font-semibold ${
                    dayTotal >= 0
                      ? "text-brand-dark/40"
                      : "text-brand-dark/40"
                  }`}
                >
                  {dayTotal > 0 ? "+" : dayTotal < 0 ? "-" : ""}$
                  {Math.abs(dayTotal).toFixed(2)}
                </p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-brand-dark/5 overflow-hidden">
                <div className="divide-y divide-brand-dark/5">
                  {byDate[d].map((t) => {
                    const catDef = getAnyCategoryByValue(t.category);
                    const Icon = catDef?.icon;
                    const account = accountById[t.account_id];
                    const isIncome = t.type === "income";

                    return (
                      <button
                        key={t.id}
                        onClick={() => openEdit(t)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-brand-dark/[0.03] active:bg-brand-dark/[0.05] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {Icon && (
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isIncome
                                  ? "bg-brand-green/10"
                                  : "bg-brand-dark/5"
                              }`}
                            >
                              <Icon
                                size={16}
                                strokeWidth={1.7}
                                className={
                                  isIncome
                                    ? "text-brand-green"
                                    : "text-brand-dark/50"
                                }
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-brand-dark truncate">
                              {catDef?.label || t.category}
                            </p>
                            <p className="text-xs text-brand-dark/30 truncate">
                              {account?.name || "—"}
                              {account?.archived_at ? " · archived" : ""}
                              {t.note ? ` · ${t.note}` : ""}
                            </p>
                          </div>
                        </div>
                        <p
                          className={`text-sm font-bold whitespace-nowrap ml-3 ${
                            isIncome ? "text-brand-green" : "text-brand-dark"
                          }`}
                        >
                          {isIncome ? "+" : "-"}${Number(t.amount).toFixed(2)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AddTransactionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={fetchData}
        userId={user.id}
        accounts={sheetAccounts}
        defaultCurrency={profile?.currency || "USD"}
        editTransaction={editTransaction}
      />
    </div>
  );
}
