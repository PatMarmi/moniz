"use client";

import { motion } from "framer-motion";
import {
  TrendingDown,
  Calendar,
  ShoppingCart,
  Utensils,
  Bus,
  Tv,
  CreditCard,
  ArrowUpRight,
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

const categories = [
  { name: "Groceries", icon: ShoppingCart, spent: 120, limit: 200, color: "bg-brand-accent" },
  { name: "Eating out", icon: Utensils, spent: 85, limit: 100, color: "bg-brand-orange-soft" },
  { name: "Transport", icon: Bus, spent: 40, limit: 80, color: "bg-brand-green" },
  { name: "Subscriptions", icon: CreditCard, spent: 32, limit: 40, color: "bg-brand-accent" },
  { name: "Entertainment", icon: Tv, spent: 55, limit: 60, color: "bg-brand-orange-soft" },
];

const upcomingBills = [
  { name: "Netflix", amount: "$15.49", due: "Mar 30" },
  { name: "Phone bill", amount: "$45.00", due: "Apr 1" },
  { name: "Gym", amount: "$29.99", due: "Apr 3" },
];

const recentExpenses = [
  { category: "Groceries", icon: ShoppingCart, amount: "$34.50", date: "Today" },
  { category: "Transport", icon: Bus, amount: "$12.00", date: "Yesterday" },
  { category: "Eating out", icon: Utensils, amount: "$18.75", date: "Mar 25" },
];

export default function DashboardPage() {
  const totalBudget = 1200;
  const totalSpent = 743;
  const remaining = totalBudget - totalSpent;
  const spentPct = Math.round((totalSpent / totalBudget) * 100);
  const daysLeft = 12;

  return (
    <div className="max-w-4xl space-y-5">
      {/* ── Big number hero card ── */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={vp}
        variants={fadeUp}
        custom={0}
        className="bg-brand-dark rounded-2xl p-6 sm:p-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-brand-beige/40 text-xs font-semibold uppercase tracking-wider">
              Left to spend
            </p>
            <p className="text-5xl sm:text-6xl font-bold text-brand-beige mt-2 tracking-tight">
              ${remaining}
            </p>
            <p className="text-brand-beige/30 text-sm mt-2">
              of ${totalBudget.toLocaleString()} this month · {daysLeft} days left
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="text-xs font-semibold text-brand-accent bg-brand-accent/10 px-3 py-1 rounded-full">
              On track
            </span>
            <div className="text-right mt-2 hidden sm:block">
              <p className="text-brand-beige/40 text-xs">Spent</p>
              <p className="text-brand-beige text-lg font-bold">${totalSpent}</p>
            </div>
          </div>
        </div>

        {/* Spend progress bar */}
        <div className="mt-6">
          <div className="w-full h-2 bg-brand-beige/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${spentPct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="h-full bg-brand-accent rounded-full"
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[11px] text-brand-beige/30">{spentPct}% spent</span>
            <span className="text-[11px] text-brand-beige/30">${totalBudget.toLocaleString()}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Daily average", value: "$38", sub: "per day" },
          { label: "Budget used", value: `${spentPct}%`, sub: "of total" },
          { label: "Top category", value: "Food", sub: "$205 total" },
          { label: "Days left", value: `${daysLeft}`, sub: "this month" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial="hidden"
            whileInView="visible"
            viewport={vp}
            variants={fadeUp}
            custom={i}
            className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-brand-dark/5"
          >
            <p className="text-[11px] text-brand-dark/40 font-medium uppercase tracking-wide">
              {stat.label}
            </p>
            <p className="text-xl font-bold text-brand-dark mt-1">{stat.value}</p>
            <p className="text-xs text-brand-dark/30 mt-0.5">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Category budgets + Upcoming bills side-by-side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Category progress */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={vp}
          variants={fadeUp}
          custom={0}
          className="lg:col-span-3 bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-brand-dark/5"
        >
          <h2 className="text-sm font-bold text-brand-dark mb-4">
            Budget by category
          </h2>
          <div className="space-y-4">
            {categories.map((cat) => {
              const pct = Math.min(Math.round((cat.spent / cat.limit) * 100), 100);
              const isOver = cat.spent >= cat.limit;
              const Icon = cat.icon;

              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-brand-dark/5 flex items-center justify-center">
                        <Icon size={14} strokeWidth={1.8} className="text-brand-dark/50" />
                      </div>
                      <span className="text-sm font-medium text-brand-dark">
                        {cat.name}
                      </span>
                    </div>
                    <span className="text-xs text-brand-dark/40">
                      <span className={`font-semibold ${isOver ? "text-brand-accent" : "text-brand-dark"}`}>
                        ${cat.spent}
                      </span>
                      {" / "}${cat.limit}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-brand-dark/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isOver ? "bg-brand-accent" : cat.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Upcoming bills */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={vp}
          variants={fadeUp}
          custom={1}
          className="lg:col-span-2 bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-brand-dark/5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={15} strokeWidth={1.8} className="text-brand-dark/40" />
            <h2 className="text-sm font-bold text-brand-dark">Upcoming bills</h2>
          </div>
          <div className="space-y-3">
            {upcomingBills.map((bill) => (
              <div
                key={bill.name}
                className="flex items-center justify-between bg-brand-dark/[0.03] rounded-xl px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-brand-dark">{bill.name}</p>
                  <p className="text-xs text-brand-dark/30 mt-0.5">{bill.due}</p>
                </div>
                <p className="text-sm font-semibold text-brand-dark">{bill.amount}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Recent expenses ── */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={vp}
        variants={fadeUp}
        custom={0}
        className="bg-white/60 backdrop-blur-sm rounded-2xl border border-brand-dark/5 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-sm font-bold text-brand-dark">Recent expenses</h2>
          <a
            href="/expenses"
            className="text-xs font-medium text-brand-accent flex items-center gap-0.5 hover:underline"
          >
            View all <ArrowUpRight size={12} />
          </a>
        </div>
        <div className="divide-y divide-brand-dark/5">
          {recentExpenses.map((exp) => {
            const Icon = exp.icon;
            return (
              <div
                key={exp.category + exp.date}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-dark/5 flex items-center justify-center">
                    <Icon size={15} strokeWidth={1.8} className="text-brand-dark/50" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-dark">{exp.category}</p>
                    <p className="text-xs text-brand-dark/30">{exp.date}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-brand-dark">{exp.amount}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Quick insight ── */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={vp}
        variants={fadeUp}
        custom={0}
        className="bg-brand-dark rounded-2xl p-5 flex items-start gap-4"
      >
        <div className="w-8 h-8 rounded-lg bg-brand-accent/15 flex items-center justify-center shrink-0 mt-0.5">
          <TrendingDown size={16} className="text-brand-accent" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-brand-beige">
            Eating out is higher than groceries
          </h3>
          <p className="text-sm text-brand-beige/40 mt-1 leading-relaxed">
            You&apos;ve spent $85 on eating out vs $120 on groceries. Cooking a few more
            meals could save you around $40 this month.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
