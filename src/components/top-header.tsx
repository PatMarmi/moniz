"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, User } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/expenses": "Expenses",
  "/budgets": "Budgets",
  "/recurring": "Recurring",
  "/insights": "Insights",
  "/learn": "Learn",
  "/settings": "Settings",
};

export default function TopHeader() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "Moniz";

  return (
    <header className="md:hidden sticky top-0 z-40 bg-brand-beige/80 backdrop-blur-xl border-b border-brand-dark/5">
      <div className="flex items-center justify-between px-4 h-14">
        <h1 className="text-lg font-bold text-brand-dark">{title}</h1>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="p-2 rounded-xl text-brand-dark/40 hover:text-brand-dark hover:bg-brand-dark/5 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} strokeWidth={1.6} />
          </button>
          <Link
            href="/settings"
            className="p-2 rounded-xl text-brand-dark/40 hover:text-brand-dark hover:bg-brand-dark/5 transition-colors"
            aria-label="Profile"
          >
            <User size={20} strokeWidth={1.6} />
          </Link>
        </div>
      </div>
    </header>
  );
}
