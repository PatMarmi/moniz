"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Repeat,
  Lightbulb,
  BookOpen,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/budgets", label: "Budgets", icon: PieChart },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const { user, profile } = useAuth();

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Student";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <aside className="hidden md:flex md:flex-col md:w-60 bg-brand-dark fixed inset-y-0 left-0 z-30">
      {/* Logo */}
      <div className="px-6 py-6">
        <Link
          href="/dashboard"
          className="text-xl font-bold tracking-tight text-brand-beige"
        >
          moniz<span className="text-brand-accent">.</span>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
                isActive
                  ? "bg-brand-accent/15 text-brand-accent"
                  : "text-brand-beige/40 hover:bg-brand-beige/5 hover:text-brand-beige/70"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom profile */}
      <div className="px-3 pb-5">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-brand-green/40">
          <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent text-xs font-bold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-brand-beige truncate">
              {displayName}
            </p>
            <p className="text-xs text-brand-beige/30 truncate">Free plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
