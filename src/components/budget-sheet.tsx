"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Check, Trash2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/constants";
import { getCategoryStyle } from "@/lib/categories";
import { budgetSchema, firstError } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

interface BudgetSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  userId: string;
  month: string;
  existingCategories: Set<string>;
  editCategory?: string;
  editAmount?: number;
}

export default function BudgetSheet({
  open,
  onClose,
  onSaved,
  userId,
  month,
  existingCategories,
  editCategory,
  editAmount,
}: BudgetSheetProps) {
  const isEdit = !!editCategory;

  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      setCategory(editCategory ?? "");
      setAmount(editAmount != null ? String(editAmount) : "");
      setError(null);
      setSaving(false);
      setSuccess(false);
      setConfirmDelete(false);
      setDeleting(false);
    }
  }, [open, editCategory, editAmount]);

  function handleClose() {
    if (saving || deleting) return;
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const limited = rateLimit(isEdit ? "updateBudget" : "createBudget");
    if (limited) { setError(limited); return; }

    // In edit mode, always use the original category (prevent orphaned rows)
    const finalCategory = isEdit ? editCategory! : category;

    const parsed = budgetSchema.safeParse({
      category: finalCategory,
      limit_amount: parseFloat(amount) || 0,
    });

    if (!parsed.success) {
      setError(firstError(parsed.error));
      return;
    }

    setSaving(true);
    const numAmount = parsed.data.limit_amount;
    const supabase = createClient();

    const { error: upsertError } = await supabase.from("budgets").upsert(
      {
        user_id: userId,
        category: finalCategory,
        limit_amount: numAmount,
        month,
      },
      { onConflict: "user_id,category,month" }
    );

    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      onSaved();
      onClose();
    }, 500);
  }

  async function handleDelete() {
    if (!editCategory) return;
    setError(null);

    const limited = rateLimit("deleteBudget");
    if (limited) { setError(limited); return; }

    setDeleting(true);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("budgets")
      .delete()
      .eq("user_id", userId)
      .eq("category", editCategory)
      .eq("month", month);

    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }

    onSaved();
    onClose();
  }

  const availableCategories = isEdit
    ? CATEGORIES
    : CATEGORIES.filter((c) => !existingCategories.has(c.value));

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
                <h2 className="text-lg font-bold text-brand-dark">
                  {isEdit ? "Edit budget" : "New budget"}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 -mr-2 rounded-xl text-brand-dark/30 hover:text-brand-dark/60 hover:bg-brand-dark/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Delete confirmation overlay */}
              {confirmDelete ? (
                <div className="space-y-5">
                  <div className="bg-brand-accent/5 rounded-2xl p-5 border border-brand-accent/10">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle size={17} className="text-brand-accent" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-brand-dark">
                          Delete this budget?
                        </h3>
                        <p className="text-sm text-brand-dark/40 mt-1 leading-relaxed">
                          The{" "}
                          <span className="font-medium text-brand-dark">
                            {CATEGORIES.find((c) => c.value === editCategory)
                              ?.label || editCategory}
                          </span>{" "}
                          budget for this month will be removed. Your expenses
                          in this category won&apos;t be deleted.
                        </p>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-brand-accent/10 text-brand-accent text-sm px-4 py-3 rounded-xl">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                      className="flex-1 py-3 rounded-2xl text-sm font-medium text-brand-dark bg-brand-dark/5 hover:bg-brand-dark/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white bg-brand-accent hover:bg-brand-accent/90 transition-colors disabled:opacity-50"
                    >
                      {deleting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                      {deleting ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/40 uppercase tracking-wider mb-2">
                      Category
                    </label>

                    {isEdit ? (
                      <div className="flex items-center gap-3 px-4 py-3 bg-white/60 rounded-2xl border border-brand-dark/5">
                        {(() => {
                          const catDef = CATEGORIES.find(
                            (c) => c.value === editCategory
                          );
                          if (!catDef) return null;
                          const Icon = catDef.icon;
                          return (
                            <>
                              <Icon
                                size={18}
                                strokeWidth={1.6}
                                className="text-brand-dark/50"
                              />
                              <span className="text-sm font-medium text-brand-dark">
                                {catDef.label}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {availableCategories.map((cat) => {
                          const isSelected = category === cat.value;
                          const style = getCategoryStyle(cat.value);
                          const Icon = cat.icon;

                          return (
                            <button
                              key={cat.value}
                              type="button"
                              onClick={() => setCategory(cat.value)}
                              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all ${
                                isSelected
                                  ? "bg-brand-dark text-brand-beige border-brand-dark"
                                  : "bg-white/60 text-brand-dark/60 border-brand-dark/5 hover:border-brand-dark/15"
                              }`}
                            >
                              <Icon
                                size={18}
                                strokeWidth={1.6}
                                className={
                                  isSelected
                                    ? "text-brand-accent"
                                    : style.iconColor
                                }
                              />
                              <span className="text-[11px] font-medium leading-tight">
                                {cat.label}
                              </span>
                            </button>
                          );
                        })}

                        {availableCategories.length === 0 && (
                          <p className="col-span-full text-sm text-brand-dark/30 text-center py-4">
                            All categories have budgets this month.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Limit amount */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/40 uppercase tracking-wider mb-2">
                      Monthly limit
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/30 text-xl font-semibold">
                        $
                      </span>
                      <input
                        type="number"
                        autoFocus={isEdit}
                        min={1}
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-9 pr-4 py-3.5 bg-white/60 border border-brand-dark/10 rounded-2xl text-2xl font-bold text-brand-dark placeholder:text-brand-dark/15 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 transition-colors"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-brand-accent/10 text-brand-accent text-sm px-4 py-3 rounded-xl">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
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
                        Saved
                      </>
                    ) : saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving…
                      </>
                    ) : isEdit ? (
                      "Update budget"
                    ) : (
                      "Create budget"
                    )}
                  </button>

                  {/* Delete button (edit mode only) */}
                  {isEdit && (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium text-brand-accent/60 hover:text-brand-accent hover:bg-brand-accent/5 transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete this budget
                    </button>
                  )}
                </form>
              )}
            </div>

            <div className="h-[env(safe-area-inset-bottom)]" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
