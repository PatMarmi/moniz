"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Receipt } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { getCategoryStyle } from "@/lib/categories";
import { getCategoryByValue } from "@/lib/constants";
import MonthSelector from "@/components/month-selector";
import { monthStart, isCurrentMonth, formatMonth } from "@/lib/months";
import AddExpenseSheet from "@/components/add-expense-sheet";
import type { Expense } from "@/types/database";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const vp = { once: true, margin: "-40px" as const };

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ExpensesPage() {
  const { user, profile } = useAuth();
  const [month, setMonth] = useState(() => monthStart());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);

  const isCurrent = isCurrentMonth(month);

  const fetchExpenses = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .eq("month", month)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setExpenses(data ?? []);
        setLoading(false);
      });
  }, [user, month]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  if (!user) return null;

  const monthTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);

  // Category breakdown
  const byCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
  });
  const sortedCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  function openAdd() { setEditExpense(null); setSheetOpen(true); }
  function openEdit(exp: Expense) {
    if (!isCurrent) return; // past months are read-only
    setEditExpense(exp);
    setSheetOpen(true);
  }

  // Empty state
  if (!loading && expenses.length === 0) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="flex justify-center"><MonthSelector value={month} onChange={setMonth} /></div>
        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} custom={0} className="bg-brand-dark rounded-2xl p-8 sm:p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-accent/15 flex items-center justify-center mx-auto mb-5"><Receipt size={28} className="text-brand-accent" /></div>
          <h2 className="text-xl font-bold text-brand-beige">{isCurrent ? "No expenses yet" : `No expenses in ${formatMonth(month)}`}</h2>
          <p className="text-sm text-brand-beige/40 mt-2 max-w-sm mx-auto leading-relaxed">{isCurrent ? "Start tracking where your money goes." : "No expenses were recorded this month."}</p>
          {isCurrent && (
            <button onClick={openAdd} className="mt-8 inline-flex items-center gap-2 bg-brand-accent text-white font-semibold px-6 py-3 rounded-full hover:bg-brand-accent/90 transition-colors text-sm"><Plus size={16} strokeWidth={2.2} />Add first expense</button>
          )}
        </motion.div>
        <AddExpenseSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSaved={fetchExpenses} userId={user.id} defaultCurrency={profile?.currency || "USD"} editExpense={editExpense} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-5">
      {/* Month selector */}
      <div className="flex justify-center"><MonthSelector value={month} onChange={setMonth} /></div>

      {/* Statement header */}
      <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} custom={0} className="flex items-end justify-between">
        <div>
          <p className="text-xs text-brand-dark/40 font-medium uppercase tracking-wider">
            {isCurrent ? "This month" : formatMonth(month)}
          </p>
          <p className="text-3xl font-bold text-brand-dark tracking-tight mt-1">${monthTotal.toFixed(2)}</p>
          <p className="text-xs text-brand-dark/30 mt-1">{expenses.length} transaction{expenses.length !== 1 ? "s" : ""}</p>
        </div>
        {isCurrent && (
          <button onClick={openAdd} className="flex items-center gap-2 bg-brand-accent text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-brand-accent/90 transition-colors active:scale-[0.97]">
            <Plus size={16} strokeWidth={2.2} />Add expense
          </button>
        )}
      </motion.div>

      {/* Category summary */}
      {sortedCats.length > 1 && (
        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} custom={0} className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-brand-dark/5">
          <div className="flex flex-wrap gap-2">
            {sortedCats.slice(0, 5).map(([cat, amount]) => {
              const catDef = getCategoryByValue(cat);
              const style = getCategoryStyle(cat);
              return (
                <div key={cat} className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full ${style.chipBg} ${style.chipText}`}>
                  {catDef?.label || cat}: ${amount.toFixed(0)}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Expense list */}
      <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} custom={0} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-brand-dark/5 overflow-hidden">
        <div className="divide-y divide-brand-dark/5">
          {expenses.map((exp) => {
            const style = getCategoryStyle(exp.category);
            const catDef = getCategoryByValue(exp.category);
            const Icon = style.icon;
            const label = catDef?.label || exp.category;
            const Row = isCurrent ? "button" : "div";
            return (
              <Row key={exp.id} onClick={isCurrent ? () => openEdit(exp) : undefined} className={`w-full flex items-center justify-between px-5 py-4 border-l-[3px] ${style.accentBorder} ${isCurrent ? "hover:bg-brand-dark/[0.03] active:bg-brand-dark/[0.05] cursor-pointer" : ""} transition-colors text-left`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${style.iconBg} flex items-center justify-center`}><Icon size={16} strokeWidth={1.7} className={style.iconColor} /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-brand-dark">{label}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${style.chipBg} ${style.chipText}`}>{label}</span>
                    </div>
                    <p className="text-xs text-brand-dark/30 mt-0.5">{formatDate(exp.date)}{exp.note && <span className="text-brand-dark/20"> · {exp.note}</span>}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-brand-dark">${Number(exp.amount).toFixed(2)}</p>
              </Row>
            );
          })}
        </div>
      </motion.div>

      <AddExpenseSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSaved={fetchExpenses} userId={user.id} defaultCurrency={profile?.currency || "USD"} editExpense={editExpense} />
    </div>
  );
}
