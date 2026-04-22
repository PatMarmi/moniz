"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Check, Trash2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  CATEGORIES,
  INCOME_CATEGORIES,
  getAccountTypeByValue,
} from "@/lib/constants";
import { transactionSchema, firstError } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { getCategoryStyle } from "@/lib/categories";
import type { Account, Transaction, TxType } from "@/types/database";

interface AddTransactionSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  userId: string;
  /** Accounts available in the picker (active + current edit's archived account) */
  accounts: Account[];
  defaultCurrency: string;
  editTransaction?: Transaction | null;
  defaultAccountId?: string;
}

export default function AddTransactionSheet({
  open,
  onClose,
  onSaved,
  userId,
  accounts,
  defaultCurrency,
  editTransaction,
  defaultAccountId,
}: AddTransactionSheetProps) {
  const isEdit = !!editTransaction;

  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [accountId, setAccountId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Reset state on open / when edit target changes
  useEffect(() => {
    if (!open) return;

    if (editTransaction) {
      setType(editTransaction.type);
      setAmount(String(editTransaction.amount));
      setCategory(editTransaction.category);
      setAccountId(editTransaction.account_id);
      setNote(editTransaction.note || "");
      setDate(editTransaction.date);
    } else {
      setType("expense");
      setAmount("");
      setCategory("");
      setAccountId(defaultAccountId || accounts[0]?.id || "");
      setNote("");
      setDate(new Date().toISOString().split("T")[0]);
    }
    setError(null);
    setSaving(false);
    setSuccess(false);
    setConfirmDelete(false);
    setDeleting(false);
  }, [open, editTransaction, defaultAccountId, accounts]);

  // When type changes in CREATE mode, reset category (valid set differs)
  function handleTypeChange(newType: TxType) {
    setType(newType);
    if (!isEdit) setCategory("");
  }

  function handleClose() {
    if (saving || deleting) return;
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const limited = rateLimit(
      isEdit ? "updateTransaction" : "createTransaction"
    );
    if (limited) {
      setError(limited);
      return;
    }

    const parsed = transactionSchema.safeParse({
      account_id: accountId,
      type,
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
    const supabase = createClient();

    if (isEdit) {
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          account_id: parsed.data.account_id,
          type: parsed.data.type,
          amount: parsed.data.amount,
          category: parsed.data.category,
          note: parsed.data.note?.trim() || null,
          date: parsed.data.date,
        })
        .eq("id", editTransaction!.id)
        .eq("user_id", userId);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("transactions").insert({
        user_id: userId,
        account_id: parsed.data.account_id,
        type: parsed.data.type,
        amount: parsed.data.amount,
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
    if (!editTransaction) return;
    setError(null);

    const limited = rateLimit("deleteTransaction");
    if (limited) {
      setError(limited);
      return;
    }

    setDeleting(true);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", editTransaction.id)
      .eq("user_id", userId);

    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }

    onSaved();
    onClose();
  }

  const categoryList = type === "income" ? INCOME_CATEGORIES : CATEGORIES;

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
                  {isEdit ? "Edit transaction" : "New transaction"}
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
                        <AlertTriangle
                          size={17}
                          className="text-brand-accent"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-brand-dark">
                          Delete this transaction?
                        </h3>
                        <p className="text-sm text-brand-dark/40 mt-1 leading-relaxed">
                          This ${Number(editTransaction!.amount).toFixed(2)}{" "}
                          {editTransaction!.type} will be permanently removed.
                          Your account balance will update.
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
                  {/* Type switcher */}
                  <div className="grid grid-cols-2 gap-1 p-1 bg-brand-dark/5 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => handleTypeChange("expense")}
                      className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        type === "expense"
                          ? "bg-brand-beige text-brand-dark shadow-sm"
                          : "text-brand-dark/40"
                      }`}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange("income")}
                      className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        type === "income"
                          ? "bg-brand-beige text-brand-green shadow-sm"
                          : "text-brand-dark/40"
                      }`}
                    >
                      Income
                    </button>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/40 uppercase tracking-wider mb-2">
                      Amount
                    </label>
                    <div className="relative">
                      <span
                        className={`absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold ${
                          type === "income"
                            ? "text-brand-green/60"
                            : "text-brand-dark/30"
                        }`}
                      >
                        $
                      </span>
                      <input
                        type="number"
                        autoFocus={!isEdit}
                        min="0.01"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className={`w-full pl-9 pr-4 py-3.5 bg-white/60 border border-brand-dark/10 rounded-2xl text-2xl font-bold placeholder:text-brand-dark/15 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 transition-colors ${
                          type === "income"
                            ? "text-brand-green"
                            : "text-brand-dark"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/40 uppercase tracking-wider mb-2">
                      Category
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {categoryList.map((cat) => {
                        const isSelected = category === cat.value;
                        const Icon = cat.icon;
                        // Expense categories use existing color system; income uses brand-green
                        const expenseStyle =
                          type === "expense"
                            ? getCategoryStyle(cat.value)
                            : null;
                        const iconColor = isSelected
                          ? "text-brand-accent"
                          : type === "income"
                          ? "text-brand-green/70"
                          : expenseStyle?.iconColor ?? "text-brand-dark/50";

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
                              className={iconColor}
                            />
                            <span className="text-[11px] font-medium leading-tight">
                              {cat.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Account */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/40 uppercase tracking-wider mb-2">
                      Account
                    </label>
                    {accounts.length === 0 ? (
                      <p className="text-sm text-brand-dark/40 bg-brand-dark/[0.03] rounded-xl px-4 py-3">
                        You don&apos;t have any active accounts. Create one to
                        continue.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {accounts.map((a) => {
                          const typeDef = getAccountTypeByValue(a.type);
                          const Icon = typeDef?.icon;
                          const isSelected = accountId === a.id;
                          const isArchived = !!a.archived_at;
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => setAccountId(a.id)}
                              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-left ${
                                isSelected
                                  ? "bg-brand-dark text-brand-beige border-brand-dark"
                                  : "bg-white/60 text-brand-dark border-brand-dark/10 hover:border-brand-dark/20"
                              }`}
                            >
                              {Icon && (
                                <Icon
                                  size={16}
                                  strokeWidth={1.6}
                                  className={
                                    isSelected
                                      ? "text-brand-accent"
                                      : "text-brand-dark/50"
                                  }
                                />
                              )}
                              <span className="text-sm font-medium flex-1 min-w-0 truncate">
                                {a.name}
                                {isArchived && (
                                  <span
                                    className={`ml-2 text-[10px] font-normal ${
                                      isSelected
                                        ? "text-brand-beige/40"
                                        : "text-brand-dark/30"
                                    }`}
                                  >
                                    · archived
                                  </span>
                                )}
                              </span>
                              <span
                                className={`text-[11px] uppercase tracking-wider ${
                                  isSelected
                                    ? "text-brand-beige/40"
                                    : "text-brand-dark/30"
                                }`}
                              >
                                {typeDef?.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
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
                    disabled={saving || success || accounts.length === 0}
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
                      "Update transaction"
                    ) : (
                      `Add ${type}`
                    )}
                  </button>

                  {isEdit && (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium text-brand-accent/60 hover:text-brand-accent hover:bg-brand-accent/5 transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete this transaction
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
