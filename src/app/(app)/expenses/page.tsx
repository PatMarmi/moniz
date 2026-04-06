"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { getCategoryStyle } from "@/lib/categories";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const vp = { once: true, margin: "-40px" as const };

const expenses = [
  { category: "Groceries", amount: "$34.50", date: "Today", note: "Weekly shop" },
  { category: "Coffee", amount: "$5.40", date: "Today" },
  { category: "Transport", amount: "$12.00", date: "Yesterday" },
  { category: "Eating out", amount: "$18.75", date: "Mar 25", note: "Lunch with Alex" },
  { category: "Subscriptions", amount: "$15.49", date: "Mar 24", note: "Netflix" },
  { category: "Shopping", amount: "$42.00", date: "Mar 23" },
  { category: "Entertainment", amount: "$20.00", date: "Mar 22", note: "Movie tickets" },
  { category: "School", amount: "$8.50", date: "Mar 21", note: "Printing" },
];

export default function ExpensesPage() {
  const todayTotal = "$39.90";
  const monthTotal = "$156.14";

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-brand-dark/40 font-medium uppercase tracking-wider">
            Today&apos;s spending
          </p>
          <p className="text-3xl font-bold text-brand-dark tracking-tight mt-1">
            {todayTotal}
          </p>
          <p className="text-xs text-brand-dark/30 mt-1">
            {monthTotal} this month
          </p>
        </div>
        <button className="flex items-center gap-2 bg-brand-accent text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-brand-accent/90 transition-colors active:scale-[0.97]">
          <Plus size={16} strokeWidth={2.2} />
          Add expense
        </button>
      </div>

      {/* Expense list */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={vp}
        variants={fadeUp}
        custom={0}
        className="bg-white/60 backdrop-blur-sm rounded-2xl border border-brand-dark/5 overflow-hidden"
      >
        <div className="divide-y divide-brand-dark/5">
          {expenses.map((exp, i) => {
            const style = getCategoryStyle(exp.category);
            const Icon = style.icon;

            return (
              <div
                key={exp.category + exp.date + i}
                className={`flex items-center justify-between px-5 py-4 border-l-[3px] ${style.accentBorder} hover:bg-brand-dark/[0.02] transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl ${style.iconBg} flex items-center justify-center`}
                  >
                    <Icon size={16} strokeWidth={1.7} className={style.iconColor} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-brand-dark">
                        {exp.category}
                      </p>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${style.chipBg} ${style.chipText}`}
                      >
                        {exp.category}
                      </span>
                    </div>
                    <p className="text-xs text-brand-dark/30 mt-0.5">
                      {exp.date}
                      {exp.note && (
                        <span className="text-brand-dark/20"> · {exp.note}</span>
                      )}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-bold text-brand-dark">{exp.amount}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      <p className="text-xs text-brand-dark/25 text-center pt-2">
        Sample data — real expense tracking coming soon.
      </p>
    </div>
  );
}
