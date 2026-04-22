"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TrendingDown,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  Plus,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { getCategoryByValue, getAccountTypeByValue } from "@/lib/constants";
import MonthSelector from "@/components/month-selector";
import { monthStart, isCurrentMonth, daysLeftIn, prevMonthStart, formatMonth } from "@/lib/months";
import type { Transaction, Budget, RecurringExpense, Account } from "@/types/database";

/** Minimal transaction fields needed to compute balances */
interface BalanceTx {
  account_id: string;
  type: "income" | "expense";
  amount: number;
}

function formatMoney(n: number): string {
  return Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const vp = { once: true, margin: "-40px" as const };

export default function DashboardPage() {
  const { user } = useAuth();
  const [month, setMonth] = useState(() => monthStart());
  // After Phase 4B: expenses are transactions filtered to type='expense'
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [prevExpenses, setPrevExpenses] = useState<Transaction[]>([]);
  // Accounts + all-time transaction deltas (NOT filtered by month)
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [allTxns, setAllTxns] = useState<BalanceTx[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    if (!user) return;
    setLoading(true);

    const supabase = createClient();
    const prevMonth = prevMonthStart(month);

    Promise.all([
      // Phase 4B cutover: read expenses from transactions (type='expense')
      supabase.from("transactions").select("*").eq("user_id", user.id).eq("type", "expense").eq("month", month).order("date", { ascending: false }),
      supabase.from("budgets").select("*").eq("user_id", user.id).eq("month", month),
      supabase.from("recurring_expenses").select("*").eq("user_id", user.id).eq("is_active", true),
      supabase.from("transactions").select("*").eq("user_id", user.id).eq("type", "expense").eq("month", prevMonth),
      // Accounts + all transactions — NOT filtered by selected month.
      // Balances represent all-time totals (starting_balance + every income/expense ever).
      supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .is("archived_at", null)
        .order("created_at", { ascending: true }),
      supabase
        .from("transactions")
        .select("account_id, type, amount")
        .eq("user_id", user.id),
    ]).then(([expRes, budRes, recRes, prevExpRes, accRes, txRes]) => {
      setExpenses(expRes.data ?? []);
      setBudgets(budRes.data ?? []);
      setRecurring(recRes.data ?? []);
      setPrevExpenses(prevExpRes.data ?? []);
      setAccounts(accRes.data ?? []);
      setAllTxns((txRes.data as BalanceTx[] | null) ?? []);
      setLoading(false);
    });
  }, [user, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!user) return null;

  const isCurrent = isCurrentMonth(month);
  const daysLeft = daysLeftIn(month);
  const totalBudget = budgets.reduce((s, b) => s + Number(b.limit_amount), 0);
  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const remaining = totalBudget - totalSpent;
  const spentPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const prevTotalSpent = prevExpenses.reduce((s, e) => s + Number(e.amount), 0);

  const spentByCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    spentByCategory[e.category] = (spentByCategory[e.category] || 0) + Number(e.amount);
  });

  const categoryBudgets = budgets.map((b) => ({
    ...b,
    spent: spentByCategory[b.category] || 0,
    catDef: getCategoryByValue(b.category),
  }));

  const recentExpenses = expenses.slice(0, 5);
  const hasData = budgets.length > 0 || expenses.length > 0;

  // Month-over-month comparison
  const spentDiff = totalSpent - prevTotalSpent;
  const hasPrevData = prevExpenses.length > 0;

  // ── Account balances (all-time, NOT filtered by selected month) ──
  const accountDeltas: Record<string, number> = {};
  for (const tx of allTxns) {
    const delta = tx.type === "income" ? Number(tx.amount) : -Number(tx.amount);
    accountDeltas[tx.account_id] = (accountDeltas[tx.account_id] || 0) + delta;
  }
  const accountsWithBalance = accounts.map((a) => ({
    ...a,
    current_balance: Number(a.starting_balance) + (accountDeltas[a.id] || 0),
  }));
  const totalAccountBalance = accountsWithBalance.reduce(
    (s, a) => s + a.current_balance,
    0
  );
  const hasAccounts = accounts.length > 0;

  // Empty state
  if (!loading && !hasData) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="flex justify-center"><MonthSelector value={month} onChange={setMonth} /></div>
        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} custom={0} className="bg-brand-dark rounded-2xl p-8 sm:p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-accent/15 flex items-center justify-center mx-auto mb-5"><Wallet size={28} className="text-brand-accent" /></div>
          <h2 className="text-xl font-bold text-brand-beige">{isCurrent ? "Welcome to Moniz" : `No data for ${formatMonth(month)}`}</h2>
          <p className="text-sm text-brand-beige/40 mt-2 max-w-sm mx-auto leading-relaxed">{isCurrent ? "Start by adding your first expense or setting up your monthly budget." : "No expenses or budgets were recorded this month."}</p>
          {isCurrent && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <a href="/transactions" className="flex items-center gap-2 bg-brand-accent text-white font-semibold px-6 py-3 rounded-full hover:bg-brand-accent/90 transition-colors text-sm"><Plus size={16} />Add first transaction</a>
              <a href="/budgets" className="flex items-center gap-2 bg-brand-beige/10 text-brand-beige font-medium px-6 py-3 rounded-full hover:bg-brand-beige/15 transition-colors text-sm">Set up budget</a>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-5">
      {/* Month selector */}
      <div className="flex justify-center"><MonthSelector value={month} onChange={setMonth} /></div>

      {/* Big number hero */}
      <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} custom={0} className="bg-brand-dark rounded-2xl p-6 sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-brand-beige/40 text-xs font-semibold uppercase tracking-wider">{isCurrent ? "Left to spend" : "Month summary"}</p>
            <p className="text-5xl sm:text-6xl font-bold text-brand-beige mt-2 tracking-tight">{totalBudget > 0 ? `$${remaining.toLocaleString()}` : `$${totalSpent.toLocaleString()}`}</p>
            <p className="text-brand-beige/30 text-sm mt-2">
              {totalBudget > 0 ? `of $${totalBudget.toLocaleString()}` : `total spent`}
              {isCurrent && ` · ${daysLeft} days left`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {totalBudget > 0 && (
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${remaining >= 0 ? "text-brand-accent bg-brand-accent/10" : "text-brand-beige bg-brand-beige/10"}`}>
                {remaining >= 0 ? "On track" : "Over budget"}
              </span>
            )}
            <div className="text-right mt-2 hidden sm:block">
              <p className="text-brand-beige/40 text-xs">Spent</p>
              <p className="text-brand-beige text-lg font-bold">${totalSpent.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {totalBudget > 0 && (
          <div className="mt-6">
            <div className="w-full h-2 bg-brand-beige/10 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} whileInView={{ width: `${Math.min(spentPct, 100)}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }} className="h-full bg-brand-accent rounded-full" />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[11px] text-brand-beige/30">{spentPct}% spent</span>
              <span className="text-[11px] text-brand-beige/30">${totalBudget.toLocaleString()}</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Accounts card — ALL-TIME balances, not affected by month selector */}
      {hasAccounts ? (
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={vp}
          variants={fadeUp}
          custom={0}
          className="bg-white/60 backdrop-blur-sm rounded-2xl border border-brand-dark/5 overflow-hidden"
        >
          <div className="px-5 pt-5 pb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-bold text-brand-dark/40 uppercase tracking-wider">
                  Accounts
                </p>
                <span className="text-[10px] font-medium text-brand-dark/30 bg-brand-dark/[0.04] px-2 py-0.5 rounded-full">
                  All time
                </span>
              </div>
              <p
                className={`text-3xl font-bold tracking-tight mt-2 ${
                  totalAccountBalance < 0 ? "text-brand-accent" : "text-brand-dark"
                }`}
              >
                {totalAccountBalance < 0 ? "-" : ""}${formatMoney(totalAccountBalance)}
              </p>
              <p className="text-xs text-brand-dark/30 mt-1">
                across {accounts.length} account{accounts.length !== 1 ? "s" : ""}
              </p>
            </div>
            <a
              href="/accounts"
              className="text-xs font-medium text-brand-accent flex items-center gap-0.5 hover:underline shrink-0"
            >
              View all <ArrowUpRight size={12} />
            </a>
          </div>

          <div className="divide-y divide-brand-dark/5 border-t border-brand-dark/5">
            {accountsWithBalance.map((a) => {
              const typeDef = getAccountTypeByValue(a.type);
              const Icon = typeDef?.icon;
              const isNegative = a.current_balance < 0;
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {Icon && (
                      <div className="w-8 h-8 rounded-lg bg-brand-dark/5 flex items-center justify-center shrink-0">
                        <Icon
                          size={15}
                          strokeWidth={1.7}
                          className="text-brand-dark/50"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-dark truncate">
                        {a.name}
                      </p>
                      <p className="text-[11px] text-brand-dark/30 uppercase tracking-wider">
                        {typeDef?.label || a.type}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`text-sm font-bold whitespace-nowrap ml-3 ${
                      isNegative ? "text-brand-accent" : "text-brand-dark"
                    }`}
                  >
                    {isNegative ? "-" : ""}${formatMoney(a.current_balance)}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={vp}
          variants={fadeUp}
          custom={0}
          className="bg-white/60 backdrop-blur-sm rounded-2xl border border-brand-dark/5 p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-brand-dark/5 flex items-center justify-center shrink-0">
                <Wallet size={18} strokeWidth={1.6} className="text-brand-dark/40" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-dark">
                  Track real account balances
                </p>
                <p className="text-xs text-brand-dark/40 mt-0.5 leading-relaxed">
                  Add your accounts to see your all-time balance and log
                  transactions that update it automatically.
                </p>
              </div>
            </div>
            <a
              href="/accounts"
              className="shrink-0 bg-brand-accent text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-brand-accent/90 transition-colors"
            >
              Set up
            </a>
          </div>
        </motion.div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total spent", value: `$${totalSpent.toFixed(0)}`, sub: expenses.length + " expenses" },
          { label: "Budget used", value: totalBudget > 0 ? `${spentPct}%` : "—", sub: totalBudget > 0 ? "of total" : "no budget" },
          { label: "Expenses", value: `${expenses.length}`, sub: formatMonth(month) },
          ...(isCurrent
            ? [{ label: "Days left", value: `${daysLeft}`, sub: "this month" }]
            : hasPrevData
            ? [{
                label: "vs last month",
                value: spentDiff <= 0 ? `-$${Math.abs(spentDiff).toFixed(0)}` : `+$${spentDiff.toFixed(0)}`,
                sub: spentDiff <= 0 ? "less spent" : "more spent",
              }]
            : [{ label: "Days left", value: "0", sub: "month ended" }]
          ),
        ].map((stat, i) => (
          <motion.div key={stat.label} initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} custom={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-brand-dark/5">
            <p className="text-[11px] text-brand-dark/40 font-medium uppercase tracking-wide">{stat.label}</p>
            <p className="text-xl font-bold text-brand-dark mt-1">{stat.value}</p>
            <p className="text-xs text-brand-dark/30 mt-0.5">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Month-over-month comparison card */}
      {hasPrevData && totalSpent > 0 && (
        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} custom={0} className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-brand-dark/5">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${spentDiff <= 0 ? "bg-brand-green/10" : "bg-brand-accent/10"}`}>
              {spentDiff <= 0 ? <TrendingDown size={16} className="text-brand-green" /> : <TrendingUp size={16} className="text-brand-accent" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-dark">
                {spentDiff <= 0
                  ? `You spent $${Math.abs(spentDiff).toFixed(0)} less than last month`
                  : `You spent $${spentDiff.toFixed(0)} more than last month`}
              </p>
              <p className="text-xs text-brand-dark/35 mt-0.5">
                ${totalSpent.toFixed(0)} this month vs ${prevTotalSpent.toFixed(0)} last month
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Category budgets + Upcoming bills */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} custom={0} className="lg:col-span-3 bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-brand-dark/5">
          <h2 className="text-sm font-bold text-brand-dark mb-4">Budget by category</h2>
          {categoryBudgets.length === 0 ? (
            <p className="text-sm text-brand-dark/30">No budgets set for this month.</p>
          ) : (
            <div className="space-y-4">
              {categoryBudgets.map((cat) => {
                const p = Math.min(Math.round((cat.spent / Number(cat.limit_amount)) * 100), 100);
                const isOver = cat.spent >= Number(cat.limit_amount);
                const Icon = cat.catDef?.icon;
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        {Icon && <div className="w-7 h-7 rounded-lg bg-brand-dark/5 flex items-center justify-center"><Icon size={14} strokeWidth={1.8} className="text-brand-dark/50" /></div>}
                        <span className="text-sm font-medium text-brand-dark">{cat.catDef?.label || cat.category}</span>
                      </div>
                      <span className="text-xs text-brand-dark/40"><span className={`font-semibold ${isOver ? "text-brand-accent" : "text-brand-dark"}`}>${cat.spent}</span> / ${Number(cat.limit_amount)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-brand-dark/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${isOver ? "bg-brand-accent" : "bg-brand-green"}`} style={{ width: `${p}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} custom={1} className="lg:col-span-2 bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-brand-dark/5">
          <div className="flex items-center gap-2 mb-4"><Calendar size={15} strokeWidth={1.8} className="text-brand-dark/40" /><h2 className="text-sm font-bold text-brand-dark">Upcoming bills</h2></div>
          {recurring.length === 0 ? (
            <p className="text-sm text-brand-dark/30">No recurring expenses yet.</p>
          ) : (
            <div className="space-y-3">
              {recurring.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between bg-brand-dark/[0.03] rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-brand-dark">{bill.name}</p>
                    <p className="text-xs text-brand-dark/30 mt-0.5">Due on the {bill.due_day}{bill.due_day === 1 ? "st" : bill.due_day === 2 ? "nd" : bill.due_day === 3 ? "rd" : "th"}</p>
                  </div>
                  <p className="text-sm font-semibold text-brand-dark">${Number(bill.amount).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent expenses */}
      <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} custom={0} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-brand-dark/5 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-sm font-bold text-brand-dark">Recent expenses</h2>
          <a href="/transactions" className="text-xs font-medium text-brand-accent flex items-center gap-0.5 hover:underline">View all <ArrowUpRight size={12} /></a>
        </div>
        {recentExpenses.length === 0 ? (
          <p className="text-sm text-brand-dark/30 px-5 pb-5">No expenses this month.</p>
        ) : (
          <div className="divide-y divide-brand-dark/5">
            {recentExpenses.map((exp) => {
              const catDef = getCategoryByValue(exp.category);
              const Icon = catDef?.icon;
              return (
                <div key={exp.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {Icon && <div className="w-8 h-8 rounded-lg bg-brand-dark/5 flex items-center justify-center"><Icon size={15} strokeWidth={1.8} className="text-brand-dark/50" /></div>}
                    <div>
                      <p className="text-sm font-medium text-brand-dark">{catDef?.label || exp.category}</p>
                      <p className="text-xs text-brand-dark/30">{exp.date}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-brand-dark">${Number(exp.amount).toFixed(2)}</p>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
