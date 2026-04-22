"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { PieChart, Plus, Pencil, LayoutTemplate } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { getCategoryByValue } from "@/lib/constants";
import BudgetSheet from "@/components/budget-sheet";
import TemplatePicker from "@/components/template-picker";
import MonthSelector from "@/components/month-selector";
import { Money } from "@/components/money";
import { monthStart, isCurrentMonth, formatMonth } from "@/lib/months";
import type { Budget, Transaction } from "@/types/database";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const vp = { once: true, margin: "-40px" as const };

export default function BudgetsPage() {
  const { user, profile } = useAuth();
  const [month, setMonth] = useState(() => monthStart());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  // After Phase 4B: expenses are transactions filtered to type='expense'
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<string | undefined>();
  const [editAmount, setEditAmount] = useState<number | undefined>();
  const [templateOpen, setTemplateOpen] = useState(false);

  const isCurrent = isCurrentMonth(month);
  const monthlyIncome = Number(profile?.monthly_income) || 0;

  const fetchData = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();
    Promise.all([
      supabase.from("budgets").select("*").eq("user_id", user.id).eq("month", month),
      // Phase 4B cutover: spent calc reads transactions of type='expense'
      supabase.from("transactions").select("*").eq("user_id", user.id).eq("type", "expense").eq("month", month),
    ]).then(([budRes, expRes]) => {
      setBudgets(budRes.data ?? []);
      setExpenses(expRes.data ?? []);
      setLoading(false);
    });
  }, [user, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!user) return null;

  const spentByCategory: Record<string, number> = {};
  expenses.forEach((e) => { spentByCategory[e.category] = (spentByCategory[e.category] || 0) + Number(e.amount); });

  const totalLimit = budgets.reduce((s, b) => s + Number(b.limit_amount), 0);
  const totalSpent = budgets.reduce((s, b) => s + (spentByCategory[b.category] || 0), 0);
  const spentPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
  const existingCategories = new Set(budgets.map((b) => b.category));

  function openNewBudget() { setEditCategory(undefined); setEditAmount(undefined); setSheetOpen(true); }
  function openEditBudget(cat: string, amount: number) { setEditCategory(cat); setEditAmount(amount); setSheetOpen(true); }

  // Empty state
  if (!loading && budgets.length === 0) {
    return (
      <div className="max-w-4xl space-y-5">
        <div className="flex justify-center"><MonthSelector value={month} onChange={setMonth} /></div>
        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} custom={0} className="bg-brand-dark rounded-2xl p-8 sm:p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-accent/15 flex items-center justify-center mx-auto mb-5"><PieChart size={28} className="text-brand-accent" /></div>
          <h2 className="text-xl font-bold text-brand-beige">{isCurrent ? "No budgets set" : `No budgets for ${formatMonth(month)}`}</h2>
          <p className="text-sm text-brand-beige/40 mt-2 max-w-sm mx-auto leading-relaxed">{isCurrent ? "Set spending limits by category to see how your month is going." : "No budgets were set for this month."}</p>
          {isCurrent && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              {monthlyIncome > 0 && (
                <button onClick={() => setTemplateOpen(true)} className="inline-flex items-center gap-2 bg-brand-accent text-white font-semibold px-6 py-3 rounded-full hover:bg-brand-accent/90 transition-colors text-sm"><LayoutTemplate size={16} strokeWidth={2} />Use a template</button>
              )}
              <button onClick={openNewBudget} className="inline-flex items-center gap-2 bg-brand-beige/10 text-brand-beige font-medium px-6 py-3 rounded-full hover:bg-brand-beige/15 transition-colors text-sm"><Plus size={16} strokeWidth={2.2} />Create manually</button>
            </div>
          )}
          {isCurrent && monthlyIncome === 0 && <p className="text-xs text-brand-beige/25 mt-4">Set your monthly income in Settings to unlock budget templates.</p>}
        </motion.div>

        <BudgetSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSaved={fetchData} userId={user.id} month={month} existingCategories={existingCategories} editCategory={editCategory} editAmount={editAmount} />
        {isCurrent && monthlyIncome > 0 && <TemplatePicker open={templateOpen} onClose={() => setTemplateOpen(false)} onApplied={fetchData} userId={user.id} month={month} monthlyIncome={monthlyIncome} />}
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex justify-center"><MonthSelector value={month} onChange={setMonth} /></div>

      {/* Summary card */}
      <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} custom={0} className="bg-brand-dark rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-brand-beige/40 text-xs font-semibold uppercase tracking-wider">Total monthly budget</p>
            <div className="flex items-end gap-3 mt-2">
              <Money value={totalLimit} short className="text-4xl font-bold text-brand-beige tracking-tight" />
              <p className="text-brand-beige/30 text-sm pb-1">
                <Money value={totalSpent} short /> spent · <Money value={totalLimit - totalSpent} short /> left
              </p>
            </div>
          </div>
          {isCurrent && (
            <div className="flex items-center gap-2">
              {monthlyIncome > 0 && <button onClick={() => setTemplateOpen(true)} className="p-2 rounded-xl text-brand-beige/30 hover:text-brand-beige/60 hover:bg-brand-beige/5 transition-colors" aria-label="Budget templates"><LayoutTemplate size={18} strokeWidth={1.6} /></button>}
              <button onClick={openNewBudget} className="flex items-center gap-2 bg-brand-accent text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-brand-accent/90 transition-colors active:scale-[0.97]"><Plus size={15} strokeWidth={2.2} />Add</button>
            </div>
          )}
        </div>
        <div className="mt-4 w-full h-2 bg-brand-beige/10 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} whileInView={{ width: `${Math.min(spentPct, 100)}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }} className="h-full bg-brand-accent rounded-full" />
        </div>
      </motion.div>

      {/* Category list */}
      <div className="space-y-3">
        {budgets.map((cat, i) => {
          const spent = spentByCategory[cat.category] || 0;
          const limit = Number(cat.limit_amount);
          const p = Math.min(Math.round((spent / limit) * 100), 100);
          const isOver = spent >= limit;
          const catDef = getCategoryByValue(cat.category);
          const Icon = catDef?.icon;
          return (
            <motion.div key={cat.id} initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} custom={i % 4} className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-brand-dark/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {Icon && <div className="w-9 h-9 rounded-xl bg-brand-dark/5 flex items-center justify-center"><Icon size={17} strokeWidth={1.7} className="text-brand-dark/50" /></div>}
                  <p className="text-sm font-semibold text-brand-dark">{catDef?.label || cat.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-brand-dark/40"><Money value={spent} short className={`font-bold ${isOver ? "text-brand-accent" : "text-brand-dark"}`} />{" / "}<Money value={limit} short /></p>
                  {isCurrent && <button onClick={() => openEditBudget(cat.category, limit)} className="p-1.5 rounded-lg text-brand-dark/20 hover:text-brand-dark/50 hover:bg-brand-dark/5 transition-colors" aria-label={`Edit ${catDef?.label || cat.category} budget`}><Pencil size={14} /></button>}
                </div>
              </div>
              <div className="w-full h-2 bg-brand-dark/5 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${isOver ? "bg-brand-accent" : "bg-brand-green"}`} style={{ width: `${p}%` }} /></div>
              <p className="text-[11px] text-brand-dark/30 mt-2">{isOver ? "Budget reached" : <><Money value={limit - spent} short /> remaining</>}</p>
            </motion.div>
          );
        })}
      </div>

      <BudgetSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSaved={fetchData} userId={user.id} month={month} existingCategories={existingCategories} editCategory={editCategory} editAmount={editAmount} />
      {isCurrent && monthlyIncome > 0 && <TemplatePicker open={templateOpen} onClose={() => setTemplateOpen(false)} onApplied={fetchData} userId={user.id} month={month} monthlyIncome={monthlyIncome} />}
    </div>
  );
}
