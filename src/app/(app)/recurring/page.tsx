"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Repeat, Calendar, Pause, Play } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { getCategoryByValue } from "@/lib/constants";
import RecurringSheet from "@/components/recurring-sheet";
import type { RecurringExpense } from "@/types/database";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const vp = { once: true, margin: "-40px" as const };

function ordinal(n: number): string {
  if (n === 1 || n === 21 || n === 31) return `${n}st`;
  if (n === 2 || n === 22) return `${n}nd`;
  if (n === 3 || n === 23) return `${n}rd`;
  return `${n}th`;
}

export default function RecurringPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editItem, setEditItem] = useState<RecurringExpense | null>(null);

  const fetchData = useCallback(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("recurring_expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_active", { ascending: false })
      .order("due_day", { ascending: true })
      .then(({ data }) => {
        setItems(data ?? []);
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!user) return null;

  const active = items.filter((i) => i.is_active);
  const paused = items.filter((i) => !i.is_active);
  const totalMonthly = active.reduce((s, r) => s + Number(r.amount), 0);

  function openAdd() {
    setEditItem(null);
    setSheetOpen(true);
  }

  function openEdit(item: RecurringExpense) {
    setEditItem(item);
    setSheetOpen(true);
  }

  async function toggleActive(item: RecurringExpense) {
    // Optimistic update — immediately move the item in the UI
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, is_active: !i.is_active } : i
      )
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("recurring_expenses")
      .update({ is_active: !item.is_active })
      .eq("id", item.id)
      .eq("user_id", user!.id);

    // If the update failed, revert and re-fetch
    if (error) {
      await fetchData();
    }
  }

  // Empty state
  if (!loading && items.length === 0) {
    return (
      <div className="max-w-4xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={vp}
          variants={fadeUp}
          custom={0}
          className="bg-brand-dark rounded-2xl p-8 sm:p-12 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-brand-accent/15 flex items-center justify-center mx-auto mb-5">
            <Repeat size={28} className="text-brand-accent" />
          </div>
          <h2 className="text-xl font-bold text-brand-beige">
            No recurring expenses
          </h2>
          <p className="text-sm text-brand-beige/40 mt-2 max-w-sm mx-auto leading-relaxed">
            Add your subscriptions and regular bills so you can see what&apos;s
            coming up and how much goes out each month.
          </p>
          <button
            onClick={openAdd}
            className="mt-8 inline-flex items-center gap-2 bg-brand-accent text-white font-semibold px-6 py-3 rounded-full hover:bg-brand-accent/90 transition-colors text-sm"
          >
            <Plus size={16} strokeWidth={2.2} />
            Add first bill
          </button>
        </motion.div>

        <RecurringSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onSaved={fetchData}
          userId={user.id}
          editItem={editItem}
        />
      </div>
    );
  }

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
              ${totalMonthly.toFixed(2)}
            </p>
            <p className="text-brand-beige/30 text-sm mt-1">
              {active.length} active
              {paused.length > 0 && ` · ${paused.length} paused`}
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-brand-accent text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-brand-accent/90 transition-colors active:scale-[0.97]"
          >
            <Plus size={15} strokeWidth={2.2} />
            Add
          </button>
        </div>
      </motion.div>

      {/* Active list */}
      {active.length > 0 && (
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={vp}
          variants={fadeUp}
          custom={0}
          className="bg-white/60 backdrop-blur-sm rounded-2xl border border-brand-dark/5 overflow-hidden"
        >
          <div className="divide-y divide-brand-dark/5">
            {active.map((item) => {
              const catDef = getCategoryByValue(item.category);
              const Icon = catDef?.icon;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-brand-dark/[0.02] transition-colors"
                >
                  <button
                    onClick={() => openEdit(item)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0"
                  >
                    {Icon && (
                      <div className="w-9 h-9 rounded-xl bg-brand-dark/5 flex items-center justify-center shrink-0">
                        <Icon
                          size={16}
                          strokeWidth={1.7}
                          className="text-brand-dark/50"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-dark truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-brand-dark/30 mt-0.5 flex items-center gap-1">
                        <Calendar size={10} className="text-brand-dark/20" />
                        Due on the {ordinal(item.due_day)}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-sm font-bold text-brand-dark">
                      ${Number(item.amount).toFixed(2)}
                    </p>
                    <button
                      onClick={() => toggleActive(item)}
                      className="p-1.5 rounded-lg text-brand-dark/20 hover:text-brand-dark/50 hover:bg-brand-dark/5 transition-colors"
                      aria-label="Pause this bill"
                    >
                      <Pause size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Paused list */}
      {paused.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-brand-dark/25 uppercase tracking-wider px-1">
            Paused
          </p>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={vp}
            variants={fadeUp}
            custom={0}
            className="bg-white/40 backdrop-blur-sm rounded-2xl border border-brand-dark/5 overflow-hidden"
          >
            <div className="divide-y divide-brand-dark/5">
              {paused.map((item) => {
                const catDef = getCategoryByValue(item.category);
                const Icon = catDef?.icon;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-5 py-4 opacity-50 hover:opacity-75 transition-opacity"
                  >
                    <button
                      onClick={() => openEdit(item)}
                      className="flex items-center gap-3 text-left flex-1 min-w-0"
                    >
                      {Icon && (
                        <div className="w-9 h-9 rounded-xl bg-brand-dark/5 flex items-center justify-center shrink-0">
                          <Icon
                            size={16}
                            strokeWidth={1.7}
                            className="text-brand-dark/50"
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-brand-dark truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-brand-dark/30 mt-0.5">
                          Paused
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-sm font-bold text-brand-dark">
                        ${Number(item.amount).toFixed(2)}
                      </p>
                      <button
                        onClick={() => toggleActive(item)}
                        className="p-1.5 rounded-lg text-brand-accent/40 hover:text-brand-accent hover:bg-brand-accent/5 transition-colors"
                        aria-label="Resume this bill"
                      >
                        <Play size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      <RecurringSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={fetchData}
        userId={user.id}
        editItem={editItem}
      />
    </div>
  );
}
