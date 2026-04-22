"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Landmark } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { getAccountTypeByValue } from "@/lib/constants";
import AddAccountSheet from "@/components/add-account-sheet";
import type { Account, AccountWithBalance } from "@/types/database";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const vp = { once: true, margin: "-40px" as const };

function formatMoney(n: number): string {
  const abs = Math.abs(n);
  return abs.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function AccountsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();

    const [accRes, txRes] = await Promise.all([
      supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .is("archived_at", null)
        .order("created_at", { ascending: true }),
      supabase
        .from("transactions")
        .select("account_id, type, amount")
        .eq("user_id", user.id),
    ]);

    const txs = txRes.data ?? [];
    const deltas: Record<string, number> = {};
    for (const tx of txs) {
      const delta = tx.type === "income" ? Number(tx.amount) : -Number(tx.amount);
      deltas[tx.account_id] = (deltas[tx.account_id] || 0) + delta;
    }

    const withBalance: AccountWithBalance[] = (accRes.data ?? []).map((a) => ({
      ...a,
      current_balance: Number(a.starting_balance) + (deltas[a.id] || 0),
    }));

    setAccounts(withBalance);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!user) return null;

  const totalBalance = accounts.reduce((s, a) => s + a.current_balance, 0);

  function openAdd() {
    setEditAccount(null);
    setSheetOpen(true);
  }

  function openEdit(a: Account) {
    setEditAccount(a);
    setSheetOpen(true);
  }

  // Empty state
  if (!loading && accounts.length === 0) {
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
            <Landmark size={28} className="text-brand-accent" />
          </div>
          <h2 className="text-xl font-bold text-brand-beige">No accounts yet</h2>
          <p className="text-sm text-brand-beige/40 mt-2 max-w-sm mx-auto leading-relaxed">
            Add a Cash, Checking, Savings, or Credit card account to start
            tracking your real money flow.
          </p>
          <button
            onClick={openAdd}
            className="mt-8 inline-flex items-center gap-2 bg-brand-accent text-white font-semibold px-6 py-3 rounded-full hover:bg-brand-accent/90 transition-colors text-sm"
          >
            <Plus size={16} strokeWidth={2.2} />
            Add first account
          </button>
        </motion.div>

        <AddAccountSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onSaved={fetchData}
          userId={user.id}
          editAccount={editAccount}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-5">
      {/* Summary card */}
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
              Total balance
            </p>
            <p
              className={`text-4xl font-bold mt-2 tracking-tight ${
                totalBalance < 0 ? "text-brand-accent" : "text-brand-beige"
              }`}
            >
              {totalBalance < 0 ? "-" : ""}${formatMoney(totalBalance)}
            </p>
            <p className="text-brand-beige/30 text-sm mt-1">
              across {accounts.length} account{accounts.length !== 1 ? "s" : ""}
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

      {/* Account cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {accounts.map((a, i) => {
          const typeDef = getAccountTypeByValue(a.type);
          const Icon = typeDef?.icon;
          const isNegative = a.current_balance < 0;

          return (
            <motion.button
              key={a.id}
              onClick={() => openEdit(a)}
              initial="hidden"
              whileInView="visible"
              viewport={vp}
              variants={fadeUp}
              custom={i % 4}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-brand-dark/5 hover:border-brand-dark/10 hover:bg-white/80 transition-all text-left active:scale-[0.99]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {Icon && (
                    <div className="w-10 h-10 rounded-xl bg-brand-dark/5 flex items-center justify-center shrink-0">
                      <Icon
                        size={18}
                        strokeWidth={1.6}
                        className="text-brand-dark/50"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-dark truncate">
                      {a.name}
                    </p>
                    <p className="text-[11px] text-brand-dark/30 uppercase tracking-wider mt-0.5">
                      {typeDef?.label || a.type}
                    </p>
                  </div>
                </div>
                <Pencil size={14} className="text-brand-dark/20 shrink-0 mt-1" />
              </div>
              <p
                className={`text-2xl font-bold mt-4 tracking-tight ${
                  isNegative ? "text-brand-accent" : "text-brand-dark"
                }`}
              >
                {isNegative ? "-" : ""}${formatMoney(a.current_balance)}
              </p>
              <p className="text-[11px] text-brand-dark/30 mt-1">
                {a.currency}
              </p>
            </motion.button>
          );
        })}
      </div>

      <AddAccountSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={fetchData}
        userId={user.id}
        editAccount={editAccount}
      />
    </div>
  );
}
