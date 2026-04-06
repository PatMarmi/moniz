"use client";

import { motion } from "framer-motion";
import {
  Plus,
  Home,
  Film,
  Smartphone,
  Dumbbell,
  Wifi,
  Music,
  Calendar,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const vp = { once: true, margin: "-40px" as const };

interface RecurringExpense {
  name: string;
  amount: string;
  dueDay: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

const recurring: RecurringExpense[] = [
  {
    name: "Rent",
    amount: "$650.00",
    dueDay: "1st",
    icon: Home,
    iconBg: "bg-brand-green/10",
    iconColor: "text-brand-green",
  },
  {
    name: "Netflix",
    amount: "$15.49",
    dueDay: "1st",
    icon: Film,
    iconBg: "bg-brand-accent/10",
    iconColor: "text-brand-accent",
  },
  {
    name: "Phone bill",
    amount: "$45.00",
    dueDay: "5th",
    icon: Smartphone,
    iconBg: "bg-brand-dark/5",
    iconColor: "text-brand-dark/50",
  },
  {
    name: "Gym",
    amount: "$29.99",
    dueDay: "10th",
    icon: Dumbbell,
    iconBg: "bg-brand-green/10",
    iconColor: "text-brand-green",
  },
  {
    name: "Internet",
    amount: "$49.99",
    dueDay: "15th",
    icon: Wifi,
    iconBg: "bg-brand-orange-soft/10",
    iconColor: "text-brand-orange-soft",
  },
  {
    name: "Spotify",
    amount: "$5.99",
    dueDay: "20th",
    icon: Music,
    iconBg: "bg-brand-accent/10",
    iconColor: "text-brand-accent",
  },
];

export default function RecurringPage() {
  const totalMonthly = recurring
    .reduce((sum, r) => sum + parseFloat(r.amount.replace("$", "").replace(",", "")), 0)
    .toFixed(2);

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={vp}
        variants={fadeUp}
        custom={0}
        className="bg-brand-dark rounded-2xl p-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-brand-beige/40 text-xs font-semibold uppercase tracking-wider">
              Monthly recurring
            </p>
            <p className="text-3xl font-bold text-brand-beige mt-2 tracking-tight">
              ${totalMonthly}
            </p>
            <p className="text-brand-beige/30 text-sm mt-1">
              {recurring.length} active subscriptions & bills
            </p>
          </div>
          <button className="flex items-center gap-2 bg-brand-accent text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-brand-accent/90 transition-colors active:scale-[0.97]">
            <Plus size={15} strokeWidth={2.2} />
            Add
          </button>
        </div>
      </motion.div>

      {/* List */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={vp}
        variants={fadeUp}
        custom={0}
        className="bg-white/60 backdrop-blur-sm rounded-2xl border border-brand-dark/5 overflow-hidden"
      >
        <div className="divide-y divide-brand-dark/5">
          {recurring.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.name}
                className="flex items-center justify-between px-5 py-4 hover:bg-brand-dark/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center`}
                  >
                    <Icon size={16} strokeWidth={1.7} className={item.iconColor} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-dark">
                      {item.name}
                    </p>
                    <p className="text-xs text-brand-dark/30 mt-0.5 flex items-center gap-1">
                      <Calendar size={10} className="text-brand-dark/20" />
                      Due on the {item.dueDay}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-bold text-brand-dark">{item.amount}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      <p className="text-xs text-brand-dark/25 text-center pt-2">
        Sample data — manage your real subscriptions soon.
      </p>
    </div>
  );
}
