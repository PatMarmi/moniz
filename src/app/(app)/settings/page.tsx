"use client";

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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const vp = { once: true, margin: "-40px" as const };

export default function SettingsPage() {
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
          AJ
        </div>
        <div>
          <h2 className="text-base font-bold text-brand-beige">Alex Johnson</h2>
          <p className="text-sm text-brand-beige/40 mt-0.5">alex@university.edu</p>
          <span className="inline-block mt-2 text-[10px] font-semibold bg-brand-accent/15 text-brand-accent px-2.5 py-0.5 rounded-full">
            Free plan
          </span>
        </div>
      </motion.div>

      {/* Budget & Finance */}
      <SettingsGroup title="Budget & finance" index={1}>
        <SettingsRow icon={Wallet} label="Monthly income" value="$1,200" />
        <SettingsRow icon={Globe} label="Currency" value="USD ($)" />
        <SettingsRow icon={Palette} label="Budget period" value="Monthly" />
      </SettingsGroup>

      {/* Preferences */}
      <SettingsGroup title="Preferences" index={2}>
        <SettingsRow icon={Bell} label="Notifications" value="On" />
        <SettingsRow icon={Palette} label="Appearance" value="Light" />
      </SettingsGroup>

      {/* Account & Security */}
      <SettingsGroup title="Account" index={3}>
        <SettingsRow icon={User} label="Edit profile" />
        <SettingsRow icon={Lock} label="Change password" />
      </SettingsGroup>

      {/* Support */}
      <SettingsGroup title="Support" index={4}>
        <SettingsRow icon={HelpCircle} label="Help center" />
        <SettingsRow icon={MessageSquare} label="Send feedback" />
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
        <button className="w-full flex items-center justify-center gap-2 bg-white/60 backdrop-blur-sm border border-brand-dark/5 rounded-2xl py-3.5 text-sm font-semibold text-brand-accent hover:bg-brand-accent/5 transition-colors active:scale-[0.99]">
          <LogOut size={16} strokeWidth={2} />
          Log out
        </button>
      </motion.div>

      <p className="text-xs text-brand-dark/25 text-center pt-2">
        Moniz v0.1 — made for students
      </p>
    </div>
  );
}

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
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
}) {
  return (
    <button className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-brand-dark/[0.02] transition-colors text-left">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-dark/5 flex items-center justify-center">
          <Icon size={15} strokeWidth={1.7} className="text-brand-dark/40" />
        </div>
        <span className="text-sm font-medium text-brand-dark">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && (
          <span className="text-sm text-brand-dark/35">{value}</span>
        )}
        <ChevronRight size={14} className="text-brand-dark/20" />
      </div>
    </button>
  );
}
