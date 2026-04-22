"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Repeat,
  GitCompareArrows,
  Plus,
  Lightbulb,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import MonthSelector from "@/components/month-selector";
import { monthStart, prevMonthStart, formatMonth } from "@/lib/months";
import {
  generateInsights,
  type InsightSection,
  type InsightType,
} from "@/lib/insights-engine";
import type { Transaction, Budget, RecurringExpense } from "@/types/database";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const vp = { once: true, margin: "-40px" as const };

const sectionMeta: Record<InsightSection, { label: string; icon: typeof BarChart3 }> = {
  overview: { label: "Overview", icon: BarChart3 },
  budgets: { label: "Budget alerts", icon: AlertTriangle },
  patterns: { label: "Spending patterns", icon: TrendingUp },
  recurring: { label: "Recurring bills", icon: Repeat },
  comparison: { label: "vs last month", icon: GitCompareArrows },
};

const typeStyles: Record<InsightType, { iconBg: string; iconColor: string; icon: typeof Lightbulb }> = {
  info: { iconBg: "bg-brand-orange-soft/10", iconColor: "text-brand-orange-soft", icon: Lightbulb },
  warning: { iconBg: "bg-brand-accent/10", iconColor: "text-brand-accent", icon: AlertTriangle },
  positive: { iconBg: "bg-brand-green/10", iconColor: "text-brand-green", icon: CheckCircle },
};

const SECTIONS: InsightSection[] = ["overview", "budgets", "patterns", "recurring", "comparison"];

export default function InsightsPage() {
  const { user } = useAuth();
  const [month, setMonth] = useState(() => monthStart());
  // After Phase 4B: expenses are transactions filtered to type='expense'
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [prevExpenses, setPrevExpenses] = useState<Transaction[]>([]);
  const [prevBudgets, setPrevBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();
    const prevMonth = prevMonthStart(month);

    Promise.all([
      supabase.from("transactions").select("*").eq("user_id", user.id).eq("type", "expense").eq("month", month),
      supabase.from("budgets").select("*").eq("user_id", user.id).eq("month", month),
      supabase.from("recurring_expenses").select("*").eq("user_id", user.id).eq("is_active", true),
      supabase.from("transactions").select("*").eq("user_id", user.id).eq("type", "expense").eq("month", prevMonth),
      supabase.from("budgets").select("*").eq("user_id", user.id).eq("month", prevMonth),
    ]).then(([expRes, budRes, recRes, prevExpRes, prevBudRes]) => {
      setExpenses(expRes.data ?? []);
      setBudgets(budRes.data ?? []);
      setRecurring(recRes.data ?? []);
      setPrevExpenses(prevExpRes.data ?? []);
      setPrevBudgets(prevBudRes.data ?? []);
      setLoading(false);
    });
  }, [user, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!user) return null;

  const insights = generateInsights(expenses, budgets, recurring, prevExpenses, prevBudgets);
  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const warnings = insights.filter((i) => i.type === "warning").length;
  const hasData = expenses.length >= 3 || budgets.length > 0 || recurring.length > 0;

  // Empty state
  if (!loading && !hasData) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="flex justify-center"><MonthSelector value={month} onChange={setMonth} /></div>
        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} custom={0} className="bg-brand-dark rounded-2xl p-8 sm:p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-accent/15 flex items-center justify-center mx-auto mb-5"><Brain size={28} className="text-brand-accent" /></div>
          <h2 className="text-xl font-bold text-brand-beige">
            {expenses.length > 0 ? "Almost there" : `No data for ${formatMonth(month)}`}
          </h2>
          <p className="text-sm text-brand-beige/40 mt-2 max-w-sm mx-auto leading-relaxed">
            Insights will appear once you add more expenses and budgets for this month.
          </p>
          <a href="/transactions" className="mt-8 inline-flex items-center gap-2 bg-brand-accent text-white font-semibold px-6 py-3 rounded-full hover:bg-brand-accent/90 transition-colors text-sm"><Plus size={16} strokeWidth={2.2} />Add transactions</a>
        </motion.div>
      </div>
    );
  }

  const grouped = SECTIONS.map((key) => ({
    key,
    meta: sectionMeta[key],
    items: insights.filter((i) => i.section === key),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-center"><MonthSelector value={month} onChange={setMonth} /></div>

      {/* Hero card */}
      <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} custom={0} className="bg-brand-dark rounded-2xl p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-brand-accent/15 flex items-center justify-center shrink-0"><Brain size={22} className="text-brand-accent" /></div>
          <div>
            <h2 className="text-lg font-bold text-brand-beige">{formatMonth(month)}</h2>
            <p className="text-sm text-brand-beige/40 mt-1 leading-relaxed">
              {expenses.length > 0
                ? `Based on ${expenses.length} expense${expenses.length !== 1 ? "s" : ""}${budgets.length > 0 ? ` and ${budgets.length} budget${budgets.length !== 1 ? "s" : ""}` : ""}. Observations only — not financial advice.`
                : "Based on your budgets and recurring bills. Not financial advice."}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { value: `${insights.length}`, label: "Insights" },
            { value: `${warnings}`, label: "Alerts" },
            { value: totalSpent > 0 ? `$${totalSpent.toFixed(0)}` : "—", label: "Spent" },
          ].map((s) => (
            <div key={s.label} className="bg-brand-beige/5 rounded-xl px-4 py-3 text-center">
              <p className="text-xl font-bold text-brand-beige">{s.value}</p>
              <p className="text-[11px] text-brand-beige/30 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Insight sections */}
      {grouped.map((group) => {
        const SectionIcon = group.meta.icon;
        return (
          <div key={group.key} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <SectionIcon size={14} strokeWidth={2} className="text-brand-dark/30" />
              <h3 className="text-xs font-bold text-brand-dark/40 uppercase tracking-wider">{group.meta.label}</h3>
            </div>
            {group.items.map((insight, i) => {
              const style = typeStyles[insight.type];
              const InsightIcon = style.icon;
              return (
                <motion.div key={insight.id} initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} custom={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-brand-dark/5">
                  <div className="flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-xl ${style.iconBg} flex items-center justify-center shrink-0 mt-0.5`}><InsightIcon size={17} strokeWidth={1.8} className={style.iconColor} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-semibold text-brand-dark">{insight.title}</h3>
                        {insight.metric && (
                          <div className="text-right shrink-0">
                            <p className="text-base font-bold text-brand-dark">{insight.metric}</p>
                            <p className="text-[10px] text-brand-dark/30">{insight.metricLabel}</p>
                          </div>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm text-brand-dark/45 leading-relaxed">{insight.body}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
