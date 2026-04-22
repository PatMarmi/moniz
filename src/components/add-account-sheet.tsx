"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Check, Trash2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ACCOUNT_TYPES, SUPPORTED_CURRENCIES } from "@/lib/constants";
import { accountSchema, firstError } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import type { Account } from "@/types/database";

interface AddAccountSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  userId: string;
  editAccount?: Account | null;
}

export default function AddAccountSheet({
  open,
  onClose,
  onSaved,
  userId,
  editAccount,
}: AddAccountSheetProps) {
  const isEdit = !!editAccount;

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [startingBalance, setStartingBalance] = useState("");
  const [currency, setCurrency] = useState<string>("USD");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editAccount) {
        setName(editAccount.name);
        setType(editAccount.type);
        setStartingBalance(String(editAccount.starting_balance));
        setCurrency(editAccount.currency);
      } else {
        setName("");
        setType("");
        setStartingBalance("0");
        setCurrency("USD");
      }
      setError(null);
      setSaving(false);
      setSuccess(false);
      setConfirmArchive(false);
      setArchiving(false);
    }
  }, [open, editAccount]);

  function handleClose() {
    if (saving || archiving) return;
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const limited = rateLimit(isEdit ? "updateAccount" : "createAccount");
    if (limited) {
      setError(limited);
      return;
    }

    const parsed = accountSchema.safeParse({
      name,
      type,
      starting_balance: parseFloat(startingBalance) || 0,
      currency,
    });

    if (!parsed.success) {
      setError(firstError(parsed.error));
      return;
    }

    setSaving(true);
    const supabase = createClient();

    if (isEdit) {
      const { error: updateError } = await supabase
        .from("accounts")
        .update({
          name: parsed.data.name,
          type: parsed.data.type,
          starting_balance: parsed.data.starting_balance,
          currency: parsed.data.currency,
        })
        .eq("id", editAccount!.id)
        .eq("user_id", userId);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("accounts").insert({
        user_id: userId,
        name: parsed.data.name,
        type: parsed.data.type,
        starting_balance: parsed.data.starting_balance,
        currency: parsed.data.currency,
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

  async function handleArchive() {
    if (!editAccount) return;
    setError(null);

    const limited = rateLimit("deleteAccount");
    if (limited) {
      setError(limited);
      return;
    }

    setArchiving(true);
    const supabase = createClient();

    // Soft delete — set archived_at timestamp
    const { error: archiveError } = await supabase
      .from("accounts")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", editAccount.id)
      .eq("user_id", userId);

    if (archiveError) {
      setError(archiveError.message);
      setArchiving(false);
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
                  {isEdit ? "Edit account" : "New account"}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 -mr-2 rounded-xl text-brand-dark/30 hover:text-brand-dark/60 hover:bg-brand-dark/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {confirmArchive ? (
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
                          Archive this account?
                        </h3>
                        <p className="text-sm text-brand-dark/40 mt-1 leading-relaxed">
                          The{" "}
                          <span className="font-medium text-brand-dark">
                            {editAccount!.name}
                          </span>{" "}
                          account will be hidden from new transactions. Its
                          past transactions stay in your history so previous
                          months render correctly.
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
                      onClick={() => setConfirmArchive(false)}
                      disabled={archiving}
                      className="flex-1 py-3 rounded-2xl text-sm font-medium text-brand-dark bg-brand-dark/5 hover:bg-brand-dark/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleArchive}
                      disabled={archiving}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white bg-brand-accent hover:bg-brand-accent/90 transition-colors disabled:opacity-50"
                    >
                      {archiving ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                      {archiving ? "Archiving…" : "Archive"}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/40 uppercase tracking-wider mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      autoFocus={!isEdit}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Chase checking, Cash wallet"
                      maxLength={60}
                      className="w-full px-4 py-3 bg-white/60 border border-brand-dark/10 rounded-2xl text-sm text-brand-dark placeholder:text-brand-dark/25 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 transition-colors"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/40 uppercase tracking-wider mb-2">
                      Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {ACCOUNT_TYPES.map((at) => {
                        const isSelected = type === at.value;
                        const Icon = at.icon;
                        return (
                          <button
                            key={at.value}
                            type="button"
                            onClick={() => setType(at.value)}
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
                                  : "text-brand-dark/50"
                              }
                            />
                            <span className="text-[11px] font-medium leading-tight">
                              {at.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Starting balance */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/40 uppercase tracking-wider mb-2">
                      Starting balance
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/30 text-xl font-semibold">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={startingBalance}
                        onChange={(e) => setStartingBalance(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-9 pr-4 py-3.5 bg-white/60 border border-brand-dark/10 rounded-2xl text-2xl font-bold text-brand-dark placeholder:text-brand-dark/15 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 transition-colors"
                      />
                    </div>
                    <p className="text-xs text-brand-dark/30 mt-2 leading-relaxed">
                      The current balance in this account before you start
                      tracking. For credit cards, enter a negative number if
                      you owe money.
                    </p>
                  </div>

                  {/* Currency */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/40 uppercase tracking-wider mb-2">
                      Currency
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {SUPPORTED_CURRENCIES.map((cur) => (
                        <button
                          key={cur}
                          type="button"
                          onClick={() => setCurrency(cur)}
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border text-sm font-semibold transition-all ${
                            currency === cur
                              ? "bg-brand-dark text-brand-beige border-brand-dark"
                              : "bg-white/60 text-brand-dark border-brand-dark/10 hover:border-brand-dark/20"
                          }`}
                        >
                          {cur}
                        </button>
                      ))}
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
                        {isEdit ? "Updated" : "Created"}
                      </>
                    ) : saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving…
                      </>
                    ) : isEdit ? (
                      "Update account"
                    ) : (
                      "Create account"
                    )}
                  </button>

                  {isEdit && (
                    <button
                      type="button"
                      onClick={() => setConfirmArchive(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium text-brand-accent/60 hover:text-brand-accent hover:bg-brand-accent/5 transition-colors"
                    >
                      <Trash2 size={14} />
                      Archive this account
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
