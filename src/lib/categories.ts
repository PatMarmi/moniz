import { CATEGORIES, getCategoryByValue } from "@/lib/constants";
import type { LucideIcon } from "lucide-react";

export interface CategoryStyle {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  accentBorder: string;
  chipBg: string;
  chipText: string;
}

// Visual styles per category — keyed by the canonical category value
const styleMap: Record<string, Omit<CategoryStyle, "icon">> = {
  rent: {
    iconBg: "bg-brand-green/10",
    iconColor: "text-brand-green",
    accentBorder: "border-l-brand-green",
    chipBg: "bg-brand-green/10",
    chipText: "text-brand-green",
  },
  groceries: {
    iconBg: "bg-brand-green/10",
    iconColor: "text-brand-green",
    accentBorder: "border-l-brand-green",
    chipBg: "bg-brand-green/10",
    chipText: "text-brand-green",
  },
  eating_out: {
    iconBg: "bg-brand-accent/10",
    iconColor: "text-brand-accent",
    accentBorder: "border-l-brand-accent",
    chipBg: "bg-brand-accent/10",
    chipText: "text-brand-accent",
  },
  coffee: {
    iconBg: "bg-brand-orange-soft/15",
    iconColor: "text-brand-orange-soft",
    accentBorder: "border-l-brand-orange-soft",
    chipBg: "bg-brand-orange-soft/10",
    chipText: "text-brand-orange-soft",
  },
  transport: {
    iconBg: "bg-brand-orange-soft/10",
    iconColor: "text-brand-orange-soft",
    accentBorder: "border-l-brand-orange-soft",
    chipBg: "bg-brand-orange-soft/10",
    chipText: "text-brand-orange-soft",
  },
  entertainment: {
    iconBg: "bg-brand-accent/10",
    iconColor: "text-brand-accent",
    accentBorder: "border-l-brand-accent",
    chipBg: "bg-brand-accent/10",
    chipText: "text-brand-accent",
  },
  subscriptions: {
    iconBg: "bg-brand-dark/8",
    iconColor: "text-brand-dark/60",
    accentBorder: "border-l-brand-dark/30",
    chipBg: "bg-brand-dark/5",
    chipText: "text-brand-dark/60",
  },
  shopping: {
    iconBg: "bg-brand-orange-soft/10",
    iconColor: "text-brand-orange-soft",
    accentBorder: "border-l-brand-orange-soft",
    chipBg: "bg-brand-orange-soft/10",
    chipText: "text-brand-orange-soft",
  },
  school: {
    iconBg: "bg-brand-green/8",
    iconColor: "text-brand-green/70",
    accentBorder: "border-l-brand-green/40",
    chipBg: "bg-brand-green/8",
    chipText: "text-brand-green/70",
  },
  savings: {
    iconBg: "bg-brand-accent/10",
    iconColor: "text-brand-accent",
    accentBorder: "border-l-brand-accent",
    chipBg: "bg-brand-accent/10",
    chipText: "text-brand-accent",
  },
  other: {
    iconBg: "bg-brand-dark/5",
    iconColor: "text-brand-dark/40",
    accentBorder: "border-l-brand-dark/15",
    chipBg: "bg-brand-dark/5",
    chipText: "text-brand-dark/40",
  },
};

const fallbackStyle: Omit<CategoryStyle, "icon"> = styleMap.other;

export function getCategoryStyle(category: string): CategoryStyle {
  // Normalize: try direct match, then lowercase, then fallback
  const key = category.toLowerCase().replace(/\s+/g, "_");
  const catDef = getCategoryByValue(key);
  const style = styleMap[key] ?? fallbackStyle;

  return {
    icon: catDef?.icon ?? CATEGORIES[CATEGORIES.length - 1].icon,
    ...style,
  };
}
