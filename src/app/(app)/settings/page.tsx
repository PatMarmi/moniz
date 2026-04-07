"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Wallet,
  Bell,
  Palette,
  HelpCircle,
  LogOut,
  ChevronRight,
  Globe,
  Lock,
  MessageSquare,
  Download,
  Trash2,
  FileText,
  Shield,
  Calendar,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import EditProfileSheet from "@/components/edit-profile-sheet";
import DeleteAccountSheet from "@/components/delete-account-sheet";
import ExportDataSheet from "@/components/export-data-sheet";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const vp = { once: true, margin: "-40px" as const };

type EditField = "name" | "income" | "currency";

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editField, setEditField] = useState<EditField>("name");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Student";
  const displayEmail = user?.email || "—";
  const initials = displayName.slice(0, 2).toUpperCase();
  const currency = profile?.currency || "USD";
  const income =
    profile?.monthly_income != null && profile.monthly_income > 0
      ? `$${Number(profile.monthly_income).toLocaleString()}`
      : "Not set";

  function openEdit(field: EditField) {
    setEditField(field);
    setSheetOpen(true);
  }

  async function handleSaved() {
    await refreshProfile();
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Profile card */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={vp}
        variants={fadeUp}
        custom={0}
        className="bg-brand-dark rounded-2xl p-6 flex items-center gap-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-brand-accent/20 flex items-center justify-center text-brand-accent text-xl font-bold">
          {initials}
        </div>
        <div>
          <h2 className="text-base font-bold text-brand-beige">{displayName}</h2>
          <p className="text-sm text-brand-beige/40 mt-0.5">{displayEmail}</p>
          <span className="inline-block mt-2 text-[10px] font-semibold bg-brand-accent/15 text-brand-accent px-2.5 py-0.5 rounded-full">
            Free plan
          </span>
        </div>
      </motion.div>

      {/* Budget & Finance */}
      <SettingsGroup title="Budget & finance" index={1}>
        <SettingsRow icon={Wallet} label="Monthly income" value={income} onClick={() => openEdit("income")} />
        <SettingsRow icon={Globe} label="Currency" value={currency} onClick={() => openEdit("currency")} />
        <SettingsRowDisabled icon={Calendar} label="Budget period" value="Monthly" />
      </SettingsGroup>

      {/* Preferences */}
      <SettingsGroup title="Preferences" index={2}>
        <SettingsRowDisabled icon={Bell} label="Notifications" />
        <SettingsRowDisabled icon={Palette} label="Appearance" />
      </SettingsGroup>

      {/* Account & Security */}
      <SettingsGroup title="Account" index={3}>
        <SettingsRow icon={User} label="Edit profile" onClick={() => openEdit("name")} />
        <SettingsRowDisabled icon={Lock} label="Change password" />
      </SettingsGroup>

      {/* Data & Privacy */}
      <SettingsGroup title="Data & privacy" index={4}>
        <SettingsRow icon={Download} label="Export my data" onClick={() => setExportOpen(true)} />
        <SettingsRow icon={Trash2} label="Delete my data" onClick={() => setDeleteOpen(true)} />
      </SettingsGroup>

      {/* Legal */}
      <SettingsGroup title="Legal" index={5}>
        <SettingsLink icon={FileText} label="Terms of Use" href="/terms" />
        <SettingsLink icon={Shield} label="Privacy Policy" href="/privacy" />
      </SettingsGroup>

      {/* Support */}
      <SettingsGroup title="Support" index={6}>
        <SettingsRowDisabled icon={HelpCircle} label="Help center" />
        <SettingsRowDisabled icon={MessageSquare} label="Send feedback" />
      </SettingsGroup>

      {/* Log out */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={vp}
        variants={fadeUp}
        custom={0}
        className="pt-2"
      >
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-white/60 backdrop-blur-sm border border-brand-dark/5 rounded-2xl py-3.5 text-sm font-semibold text-brand-accent hover:bg-brand-accent/5 transition-colors active:scale-[0.99]"
        >
          <LogOut size={16} strokeWidth={2} />
          Log out
        </button>
      </motion.div>

      <p className="text-xs text-brand-dark/25 text-center pt-2">
        Moniz v0.1 — made for students
      </p>

      {/* Sheets */}
      {user && (
        <>
          <EditProfileSheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            onSaved={handleSaved}
            userId={user.id}
            profile={profile}
            field={editField}
          />
          <ExportDataSheet
            open={exportOpen}
            onClose={() => setExportOpen(false)}
            userId={user.id}
          />
          <DeleteAccountSheet
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            userEmail={user.email || ""}
          />
        </>
      )}
    </div>
  );
}

/* ── Subcomponents ── */

function SettingsGroup({
  title,
  index,
  children,
}: {
  title: string;
  index: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={vp}
      variants={fadeUp}
      custom={index % 4}
      className="bg-white/60 backdrop-blur-sm rounded-2xl border border-brand-dark/5 overflow-hidden"
    >
      <div className="px-5 pt-4 pb-2">
        <h3 className="text-[11px] font-bold text-brand-dark/30 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="divide-y divide-brand-dark/5">{children}</div>
    </motion.div>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-brand-dark/[0.03] transition-colors text-left active:bg-brand-dark/[0.05]"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-dark/5 flex items-center justify-center">
          <Icon size={15} strokeWidth={1.7} className="text-brand-dark/40" />
        </div>
        <span className="text-sm font-medium text-brand-dark">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-brand-dark/35">{value}</span>}
        <ChevronRight size={14} className="text-brand-dark/20" />
      </div>
    </button>
  );
}

function SettingsRowDisabled({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-dark/5 flex items-center justify-center">
          <Icon size={15} strokeWidth={1.7} className="text-brand-dark/20" />
        </div>
        <span className="text-sm font-medium text-brand-dark/30">{label}</span>
      </div>
      <span className="text-[10px] font-medium text-brand-dark/20 bg-brand-dark/[0.03] px-2 py-0.5 rounded-full">
        {value || "Coming soon"}
      </span>
    </div>
  );
}

function SettingsLink({
  icon: Icon,
  label,
  href,
}: {
  icon: LucideIcon;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-5 py-3.5 hover:bg-brand-dark/[0.03] transition-colors active:bg-brand-dark/[0.05]"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-dark/5 flex items-center justify-center">
          <Icon size={15} strokeWidth={1.7} className="text-brand-dark/40" />
        </div>
        <span className="text-sm font-medium text-brand-dark">{label}</span>
      </div>
      <ChevronRight size={14} className="text-brand-dark/20" />
    </Link>
  );
}
