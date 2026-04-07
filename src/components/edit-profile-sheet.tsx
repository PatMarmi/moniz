"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SUPPORTED_CURRENCIES } from "@/lib/constants";
import type { UserProfile } from "@/types/database";

type Field = "name" | "income" | "currency";

interface EditProfileSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  userId: string;
  profile: UserProfile | null;
  field: Field;
}

const fieldConfig: Record<Field, { title: string; label: string }> = {
  name: { title: "Edit name", label: "Full name" },
  income: { title: "Edit monthly income", label: "Monthly income" },
  currency: { title: "Change currency", label: "Currency" },
};

export default function EditProfileSheet({
  open,
  onClose,
  onSaved,
  userId,
  profile,
  field,
}: EditProfileSheetProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open && profile) {
      if (field === "name") setValue(profile.full_name || "");
      if (field === "income") setValue(profile.monthly_income != null ? String(profile.monthly_income) : "");
      if (field === "currency") setValue(profile.currency || "USD");
      setError(null);
      setSaving(false);
      setSuccess(false);
    }
  }, [open, profile, field]);

  function handleClose() {
    if (saving) return;
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate per field
    if (field === "name" && !value.trim()) {
      setError("Name is required.");
      return;
    }
    if (field === "income") {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        setError("Enter a valid amount (0 or more).");
        return;
      }
    }

    setSaving(true);

    const supabase = createClient();
    const update: Record<string, unknown> = {};

    if (field === "name") update.full_name = value.trim();
    if (field === "income") update.monthly_income = parseFloat(value) || 0;
    if (field === "currency") update.currency = value;

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update(update)
      .eq("id", userId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      onSaved();
      onClose();
    }, 400);
  }

  const config = fieldConfig[field];

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
                  {config.title}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 -mr-2 rounded-xl text-brand-dark/30 hover:text-brand-dark/60 hover:bg-brand-dark/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {field === "name" && (
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/40 uppercase tracking-wider mb-2">
                      {config.label}
                    </label>
                    <input
                      type="text"
                      autoFocus
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="Your name"
                      maxLength={100}
                      className="w-full px-4 py-3 bg-white/60 border border-brand-dark/10 rounded-2xl text-sm text-brand-dark placeholder:text-brand-dark/25 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 transition-colors"
                    />
                  </div>
                )}

                {field === "income" && (
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/40 uppercase tracking-wider mb-2">
                      {config.label}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/30 text-xl font-semibold">
                        $
                      </span>
                      <input
                        type="number"
                        autoFocus
                        min="0"
                        step="50"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="0"
                        className="w-full pl-9 pr-4 py-3.5 bg-white/60 border border-brand-dark/10 rounded-2xl text-2xl font-bold text-brand-dark placeholder:text-brand-dark/15 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 transition-colors"
                      />
                    </div>
                    <p className="text-xs text-brand-dark/30 mt-2">
                      This is used for budget templates. An estimate works fine.
                    </p>
                  </div>
                )}

                {field === "currency" && (
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/40 uppercase tracking-wider mb-2">
                      {config.label}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {SUPPORTED_CURRENCIES.map((cur) => (
                        <button
                          key={cur}
                          type="button"
                          onClick={() => setValue(cur)}
                          className={`flex items-center justify-center gap-2 px-4 py-4 rounded-2xl border text-sm font-semibold transition-all ${
                            value === cur
                              ? "bg-brand-dark text-brand-beige border-brand-dark"
                              : "bg-white/60 text-brand-dark border-brand-dark/10 hover:border-brand-dark/20"
                          }`}
                        >
                          {cur}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
                  ) : (
                    "Save"
                  )}
                </button>
              </form>
            </div>

            <div className="h-[env(safe-area-inset-bottom)]" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
