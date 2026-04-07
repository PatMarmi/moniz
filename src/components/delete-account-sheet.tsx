"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { rateLimit } from "@/lib/rate-limit";

interface DeleteAccountSheetProps {
  open: boolean;
  onClose: () => void;
  userEmail: string;
}

/**
 * Deletes all user data (profile, expenses, budgets, recurring) and signs out.
 *
 * Why "Delete my data" and not "Delete account":
 * Deleting the auth.users row requires the Supabase service role key,
 * which must never be exposed to the client. Options to fully delete the auth user:
 *   1. Add a Supabase Edge Function with the service role key
 *   2. Add a Next.js API route / Server Action with the service role key server-side
 * Until one of those is implemented, we honestly frame this as data deletion.
 * The auth shell remains but is empty — no profile, no data, no access.
 */
export default function DeleteAccountSheet({
  open,
  onClose,
  userEmail,
}: DeleteAccountSheetProps) {
  const router = useRouter();
  const [step, setStep] = useState<"warn" | "confirm">("warn");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  function handleClose() {
    if (deleting) return;
    setStep("warn");
    setConfirmText("");
    setError(null);
    setDeleting(false);
    onClose();
  }

  async function handleDelete() {
    setError(null);

    const limited = rateLimit("deleteAccount");
    if (limited) {
      setError(limited);
      return;
    }

    setDeleting(true);

    const supabase = createClient();

    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      setError("Session expired. Please log in again.");
      setDeleting(false);
      return;
    }

    // Delete all user data — RLS ensures we can only delete our own rows.
    // CASCADE FKs would also handle this if the auth user were deleted,
    // but since we can't delete auth.users from the client, we do it explicitly.
    const results = await Promise.all([
      supabase.from("expenses").delete().eq("user_id", userId),
      supabase.from("budgets").delete().eq("user_id", userId),
      supabase.from("recurring_expenses").delete().eq("user_id", userId),
    ]);

    // Check for errors on the data tables
    const dataError = results.find((r) => r.error);
    if (dataError?.error) {
      setError(dataError.error.message);
      setDeleting(false);
      return;
    }

    // Delete profile last (depends on nothing)
    const { error: profileError } = await supabase
      .from("user_profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      setError(profileError.message);
      setDeleting(false);
      return;
    }

    // Sign out — the auth shell remains but has no data
    await supabase.auth.signOut();
    router.push("/");
  }

  const canConfirm = confirmText.toLowerCase() === "delete my data";

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
                  Delete my data
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 -mr-2 rounded-xl text-brand-dark/30 hover:text-brand-dark/60 hover:bg-brand-dark/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {step === "warn" ? (
                <div className="space-y-5">
                  <div className="bg-brand-accent/5 rounded-2xl p-5 border border-brand-accent/10">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} className="text-brand-accent" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-brand-dark">
                          This action is permanent
                        </h3>
                        <p className="text-sm text-brand-dark/40 mt-1.5 leading-relaxed">
                          This will permanently delete all your Moniz data:
                        </p>
                        <ul className="text-sm text-brand-dark/40 mt-2 space-y-1 list-disc pl-4">
                          <li>Your profile and preferences</li>
                          <li>All expenses and transaction history</li>
                          <li>All budgets</li>
                          <li>All recurring expense entries</li>
                        </ul>
                        <p className="text-sm text-brand-dark/40 mt-2">
                          This cannot be undone. You will be signed out
                          afterwards. Consider exporting your data first.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      className="flex-1 py-3 rounded-2xl text-sm font-medium text-brand-dark bg-brand-dark/5 hover:bg-brand-dark/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setStep("confirm")}
                      className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white bg-brand-accent hover:bg-brand-accent/90 transition-colors"
                    >
                      I understand, continue
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <p className="text-sm text-brand-dark/50 leading-relaxed">
                    To confirm, type{" "}
                    <span className="font-semibold text-brand-dark">
                      delete my data
                    </span>{" "}
                    below.
                  </p>

                  <input
                    type="text"
                    autoFocus
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="delete my data"
                    className="w-full px-4 py-3 bg-white/60 border border-brand-accent/20 rounded-2xl text-sm text-brand-dark placeholder:text-brand-dark/20 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 transition-colors"
                  />

                  <p className="text-xs text-brand-dark/30">
                    Deleting data for{" "}
                    <span className="font-medium text-brand-dark/50">
                      {userEmail}
                    </span>
                  </p>

                  {error && (
                    <div className="bg-brand-accent/10 text-brand-accent text-sm px-4 py-3 rounded-xl">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setStep("warn");
                        setConfirmText("");
                      }}
                      disabled={deleting}
                      className="flex-1 py-3 rounded-2xl text-sm font-medium text-brand-dark bg-brand-dark/5 hover:bg-brand-dark/10 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={!canConfirm || deleting}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white bg-brand-accent hover:bg-brand-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {deleting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Deleting…
                        </>
                      ) : (
                        "Delete permanently"
                      )}
                    </button>
                  </div>
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
