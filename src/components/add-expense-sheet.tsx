"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Check, Trash2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/constants";
import { getCategoryStyle } from "@/lib/categories";
import { expenseSchema, firstError } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import type { Expense } from "@/types/database";

interface AddExpenseSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  userId: string;
  defaultCurrency: string;
  /** Pass an expense to open in edit mode */
  editExpense?: Expense | null;
}

export default function AddExpenseSheet({
  open,
  onClose,
  onSaved,
  userId,
  defaultCurrency,
  editExpense,
}: AddExpenseSheetProps) {
  const isEdit = !!editExpense;

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sync form state when sheet opens or editExpense changes
  useEffect(() => {
    if (open) {
      if (editExpense) {
        setAmount(String(editExpense.amount));
        setCategory(editExpense.category);
        setNote(editExpense.note || "");
        setDate(editExpense.date);
      } else {
        setAmount("");
        setCategory("");
        setNote("");
        setDate(new Date().toISOString().split("T")[0]);
      }
      setError(null);
      setSaving(false);
      setSuccess(false);
      setConfirmDelete(false);
      setDeleting(false);
    }
  }, [open, editExpense]);

  function handleClose() {
    if (saving || deleting) return;
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const limited = rateLimit(isEdit ? "updateExpense" : "createExpense");
    if (limited) { setError(limited); return; }

    const parsed = expenseSchema.safeParse({
      amount: parseFloat(amount) || 0,
      category,
      date,
      note,
    });

    if (!parsed.success) {
      setError(firstError(parsed.error));
      return;
    }

    setSaving(true);
    const numAmount = parsed.data.amount;
    const supabase = createClient();

    if (isEdit) {
      const { error: updateError } = await supabase
        .from("expenses")
        .update({
          amount: numAmount,
          category: parsed.data.category,
          note: parsed.data.note?.trim() || null,
          date: parsed.data.date,
        })
        .eq("id", editExpense!.id)
        .eq("user_id", userId);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("expenses").insert({
        user_id: userId,
        amount: numAmount,
        category: parsed.data.category,
        currency: defaultCurrency,
        note: parsed.data.note?.trim() || null,
        date: parsed.data.date,
      });

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setSuccess(true);
    setTimeout(() => {
      onSaved();
      onClose();
    }, 500);
  }

  async function handleDelete() {
    if (!editExpense) return;
    setError(null);

    const limited = rateLimit("deleteExpense");
    if (limited) { setError(limited); return; }

    setDeleting(true);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("expenses")
      .delete()
      .eq("id", editExpense.id)
      .eq("user_id", userId);

    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }

    onSaved();
    onClose();
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-brand-dark">
                  {isEdit ? "Edit expense" : "Add expense"}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 -mr-2 rounded-xl text-brand-dark/30 hover:text-brand-dark/60 hover:bg-brand-dark/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {confirmDelete ? (
                <div className="space-y-5">
                  <div className="bg-brand-accent/5 rounded-2xl p-5 border border-brand-accent/10">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle size={17} className="text-brand-accent" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-brand-dark">
                          Delete this expense?
                        </h3>
                        <p className="text-sm text-brand-dark/40 mt-1 leading-relaxed">
                          This ${Number(editExpense!.amount).toFixed(2)} expense
                          will be permanently removed.
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
                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/40 uppercase tracking-wider mb-2">
                      Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/30 text-xl font-semibold">
                        $
                      </span>
                      <input
                        type="number"
                        autoFocus
                        min="0.01"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-9 pr-4 py-3.5 bg-white/60 border border-brand-dark/10 rounded-2xl text-2xl font-bold text-brand-dark placeholder:text-brand-dark/15 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/40 uppercase tracking-wider mb-2">
                      Category
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {CATEGORIES.map((cat) => {
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
                                isSelected ? "text-brand-accent" : style.iconColor
                              }
                            />
                            <span className="text-[11px] font-medium leading-tight">
                              {cat.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/40 uppercase tracking-wider mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3 bg-white/60 border border-brand-dark/10 rounded-2xl text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 transition-colors"
                    />
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/40 uppercase tracking-wider mb-2">
                      Note{" "}
                      <span className="text-brand-dark/20">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="What was this for?"
                      maxLength={200}
                      className="w-full px-4 py-3 bg-white/60 border border-brand-dark/10 rounded-2xl text-sm text-brand-dark placeholder:text-brand-dark/25 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 transition-colors"
                    />
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
                        {isEdit ? "Updated" : "Added"}
                      </>
                    ) : saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving…
                      </>
                    ) : isEdit ? (
                      "Update expense"
                    ) : (
                      "Add expense"
                    )}
                  </button>

                  {isEdit && (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium text-brand-accent/60 hover:text-brand-accent hover:bg-brand-accent/5 transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete this expense
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
