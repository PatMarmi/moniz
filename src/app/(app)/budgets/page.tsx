"use client";

import { motion } from "framer-motion";
import {
  ShoppingCart,
  Utensils,
  Bus,
  Tv,
  CreditCard,
  GraduationCap,
  ShoppingBag,
  Home,
  PiggyBank,
  MoreHorizontal,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const vp = { once: true, margin: "-40px" as const };

const budgetCategories = [
  { name: "Rent", icon: Home, spent: 650, limit: 650, color: "bg-brand-green" },
  { name: "Groceries", icon: ShoppingCart, spent: 120, limit: 200, color: "bg-brand-accent" },
  { name: "Eating out", icon: Utensils, spent: 85, limit: 100, color: "bg-brand-orange-soft" },
  { name: "Transport", icon: Bus, spent: 40, limit: 80, color: "bg-brand-green" },
  { name: "Entertainment", icon: Tv, spent: 55, limit: 60, color: "bg-brand-orange-soft" },
  { name: "Subscriptions", icon: CreditCard, spent: 32, limit: 40, color: "bg-brand-accent" },
  { name: "School", icon: GraduationCap, spent: 15, limit: 50, color: "bg-brand-green" },
  { name: "Shopping", icon: ShoppingBag, spent: 40, limit: 60, color: "bg-brand-orange-soft" },
  { name: "Savings", icon: PiggyBank, spent: 100, limit: 100, color: "bg-brand-accent" },
  { name: "Other", icon: MoreHorizontal, spent: 20, limit: 50, color: "bg-brand-dark/30" },
];

export default function BudgetsPage() {
  const totalSpent = budgetCategories.reduce((s, c) => s + c.spent, 0);
  const totalLimit = budgetCategories.reduce((s, c) => s + c.limit, 0);

  return (
    <div className="max-w-4xl space-y-5">
      {/* Summary card */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={vp}
        variants={fadeUp}
        custom={0}
        className="bg-brand-dark rounded-2xl p-6"
      >
        <p className="text-brand-beige/40 text-xs font-semibold uppercase tracking-wider">
          Total monthly budget
        </p>
        <div className="flex items-end gap-3 mt-2">
          <p className="text-4xl font-bold text-brand-beige tracking-tight">
            ${totalLimit.toLocaleString()}
          </p>
          <p className="text-brand-beige/30 text-sm pb-1">
            ${totalSpent} spent · ${totalLimit - totalSpent} left
          </p>
        </div>
        <div className="mt-4 w-full h-2 bg-brand-beige/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${Math.round((totalSpent / totalLimit) * 100)}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="h-full bg-brand-accent rounded-full"
          />
        </div>
      </motion.div>

      {/* Category list */}
      <div className="space-y-3">
        {budgetCategories.map((cat, i) => {
          const pct = Math.min(Math.round((cat.spent / cat.limit) * 100), 100);
          const isOver = cat.spent >= cat.limit;
          const Icon = cat.icon;

          return (
            <motion.div
              key={cat.name}
              initial="hidden"
              whileInView="visible"
              viewport={vp}
              variants={fadeUp}
              custom={i % 4}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-brand-dark/5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-dark/5 flex items-center justify-center">
                    <Icon size={17} strokeWidth={1.7} className="text-brand-dark/50" />
                  </div>
                  <p className="text-sm font-semibold text-brand-dark">{cat.name}</p>
                </div>
                <p className="text-sm text-brand-dark/40">
                  <span
                    className={`font-bold ${isOver ? "text-brand-accent" : "text-brand-dark"}`}
                  >
                    ${cat.spent}
                  </span>
                  {" / "}${cat.limit}
                </p>
              </div>
              <div className="w-full h-2 bg-brand-dark/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isOver ? "bg-brand-accent" : cat.color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[11px] text-brand-dark/30 mt-2">
                {isOver
                  ? "Budget reached"
                  : `$${cat.limit - cat.spent} remaining`}
              </p>
            </motion.div>
          );
        })}
      </div>

      <p className="text-xs text-brand-dark/25 text-center pt-2">
        Sample budget data — editable budgets coming soon.
      </p>
    </div>
  );
}
