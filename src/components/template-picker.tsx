"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  Check,
  LayoutTemplate,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  BUDGET_TEMPLATES,
  applyTemplate,
  type BudgetTemplate,
} from "@/lib/budget-templates";
import { getCategoryByValue } from "@/lib/constants";

interface TemplatePickerProps {
  open: boolean;
  onClose: () => void;
  onApplied: () => void;
  userId: string;
  month: string;
  monthlyIncome: number;
}

export default function TemplatePicker({
  open,
  onClose,
  onApplied,
  userId,
  month,
  monthlyIncome,
}: TemplatePickerProps) {
  const [selected, setSelected] = useState<BudgetTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (saving) return;
    setSelected(null);
    setError(null);
    setSaving(false);
    setSuccess(false);
    onClose();
  }

  function handleBack() {
    setSelected(null);
    setError(null);
  }

  const preview = selected ? applyTemplate(selected, monthlyIncome) : [];
  const previewTotal = preview.reduce((s, p) => s + p.amount, 0);

  async function handleApply() {
    if (!selected) return;
    setError(null);
    setSaving(true);

    const rows = preview.map((p) => ({
      user_id: userId,
      category: p.category,
      limit_amount: p.amount,
      month,
    }));

    const supabase = createClient();
    const { error: upsertError } = await supabase
      .from("budgets")
      .upsert(rows, { onConflict: "user_id,category,month" });

    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      onApplied();
      handleClose();
    }, 500);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-brand-dark/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-brand-beige border-t border-brand-dark/5 shadow-2xl"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-brand-dark/10" />
            </div>

            <div className="px-5 pb-8 pt-2">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                {selected ? (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-1.5 text-sm font-medium text-brand-dark/40 hover:text-brand-dark/70 transition-colors"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                ) : (
                  <h2 className="text-lg font-bold text-brand-dark">
                    Budget templates
                  </h2>
                )}
                <button
                  onClick={handleClose}
                  className="p-2 -mr-2 rounded-xl text-brand-dark/30 hover:text-brand-dark/60 hover:bg-brand-dark/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {!selected ? (
                /* ── Template list ── */
                <div className="space-y-3">
                  <p className="text-sm text-brand-dark/40 leading-relaxed">
                    Start with a template based on your $
                    {monthlyIncome.toLocaleString()} income. You can adjust
                    any category amount after applying.
                  </p>
                  <p className="text-xs text-brand-dark/25 leading-relaxed">
                    Income changes month to month? Use a template as a
                    starting point and edit your category limits manually.
                  </p>

                  {BUDGET_TEMPLATES.map((tpl) => {
                    const totalPct = Object.values(tpl.allocations).reduce(
                      (s, v) => s + v,
                      0
                    );
                    const cats = Object.keys(tpl.allocations).length;

                    return (
                      <button
                        key={tpl.id}
                        onClick={() => setSelected(tpl)}
                        className="w-full bg-white/60 backdrop-blur-sm rounded-2xl border border-brand-dark/5 p-5 text-left hover:border-brand-dark/10 transition-colors active:scale-[0.99]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-dark/5 flex items-center justify-center">
                              <LayoutTemplate
                                size={18}
                                strokeWidth={1.6}
                                className="text-brand-dark/50"
                              />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-brand-dark">
                                {tpl.name}
                              </p>
                              <p className="text-xs text-brand-dark/35 mt-0.5">
                                {tpl.description}
                              </p>
                            </div>
                          </div>
                          <ChevronRight
                            size={16}
                            className="text-brand-dark/20 shrink-0 ml-2"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-dark/5 text-brand-dark/40">
                            {cats} categories
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-dark/5 text-brand-dark/40">
                            {totalPct}% allocated
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* ── Preview ── */
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-brand-dark">
                      {selected.name}
                    </h3>
                    <p className="text-sm text-brand-dark/40 mt-1">
                      {selected.description} Review the amounts below, then
                      apply. You can edit or delete any category afterwards.
                    </p>
                  </div>

                  {/* Preview card */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-brand-dark/5 overflow-hidden">
                    <div className="divide-y divide-brand-dark/5">
                      {preview.map((item) => {
                        const catDef = getCategoryByValue(item.category);
                        const Icon = catDef?.icon;
                        const pct =
                          selected.allocations[item.category] ?? 0;

                        return (
                          <div
                            key={item.category}
                            className="flex items-center justify-between px-5 py-3.5"
                          >
                            <div className="flex items-center gap-3">
                              {Icon && (
                                <div className="w-8 h-8 rounded-lg bg-brand-dark/5 flex items-center justify-center">
                                  <Icon
                                    size={15}
                                    strokeWidth={1.7}
                                    className="text-brand-dark/50"
                                  />
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium text-brand-dark">
                                  {catDef?.label || item.category}
                                </p>
                                <p className="text-[11px] text-brand-dark/25">
                                  {pct}% of income
                                </p>
                              </div>
                            </div>
                            <p className="text-sm font-bold text-brand-dark">
                              ${item.amount}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between px-5 py-3.5 bg-brand-dark/[0.03] border-t border-brand-dark/5">
                      <p className="text-sm font-semibold text-brand-dark">
                        Total
                      </p>
                      <p className="text-sm font-bold text-brand-dark">
                        ${previewTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {monthlyIncome > 0 && previewTotal > monthlyIncome && (
                    <p className="text-xs text-brand-accent">
                      Note: rounding pushed the total slightly above your income.
                      You can edit individual budgets after applying.
                    </p>
                  )}

                  {error && (
                    <div className="bg-brand-accent/10 text-brand-accent text-sm px-4 py-3 rounded-xl">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleApply}
                    disabled={saving || success}
                    className={`w-full flex items-center justify-center gap-2 font-semibold py-3.5 rounded-2xl transition-all text-sm active:scale-[0.98] disabled:cursor-not-allowed ${
                      success
                        ? "bg-brand-green text-brand-beige"
                        : "bg-brand-accent text-white hover:bg-brand-accent/90 disabled:opacity-50"
                    }`}
                  >
                    {success ? (
                      <>
                        <Check size={18} strokeWidth={2.5} />
                        Applied
                      </>
                    ) : saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Applying…
                      </>
                    ) : (
                      <>
                        Apply template
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="h-[env(safe-area-inset-bottom)]" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
