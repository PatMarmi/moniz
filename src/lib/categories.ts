import {
  ShoppingCart,
  Utensils,
  Bus,
  Tv,
  CreditCard,
  Coffee,
  ShoppingBag,
  Home,
  GraduationCap,
  PiggyBank,
  MoreHorizontal,
  Dumbbell,
  Smartphone,
  Film,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface CategoryStyle {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  accentBorder: string;
  chipBg: string;
  chipText: string;
}

const styles: Record<string, CategoryStyle> = {
  rent: {
    icon: Home,
    iconBg: "bg-brand-green/10",
    iconColor: "text-brand-green",
    accentBorder: "border-l-brand-green",
    chipBg: "bg-brand-green/10",
    chipText: "text-brand-green",
  },
  groceries: {
    icon: ShoppingCart,
    iconBg: "bg-brand-green/10",
    iconColor: "text-brand-green",
    accentBorder: "border-l-brand-green",
    chipBg: "bg-brand-green/10",
    chipText: "text-brand-green",
  },
  "eating out": {
    icon: Utensils,
    iconBg: "bg-brand-accent/10",
    iconColor: "text-brand-accent",
    accentBorder: "border-l-brand-accent",
    chipBg: "bg-brand-accent/10",
    chipText: "text-brand-accent",
  },
  coffee: {
    icon: Coffee,
    iconBg: "bg-brand-orange-soft/15",
    iconColor: "text-brand-orange-soft",
    accentBorder: "border-l-brand-orange-soft",
    chipBg: "bg-brand-orange-soft/10",
    chipText: "text-brand-orange-soft",
  },
  transport: {
    icon: Bus,
    iconBg: "bg-brand-orange-soft/10",
    iconColor: "text-brand-orange-soft",
    accentBorder: "border-l-brand-orange-soft",
    chipBg: "bg-brand-orange-soft/10",
    chipText: "text-brand-orange-soft",
  },
  entertainment: {
    icon: Tv,
    iconBg: "bg-brand-accent/10",
    iconColor: "text-brand-accent",
    accentBorder: "border-l-brand-accent",
    chipBg: "bg-brand-accent/10",
    chipText: "text-brand-accent",
  },
  subscriptions: {
    icon: CreditCard,
    iconBg: "bg-brand-dark/8",
    iconColor: "text-brand-dark/60",
    accentBorder: "border-l-brand-dark/30",
    chipBg: "bg-brand-dark/5",
    chipText: "text-brand-dark/60",
  },
  shopping: {
    icon: ShoppingBag,
    iconBg: "bg-brand-orange-soft/10",
    iconColor: "text-brand-orange-soft",
    accentBorder: "border-l-brand-orange-soft",
    chipBg: "bg-brand-orange-soft/10",
    chipText: "text-brand-orange-soft",
  },
  school: {
    icon: GraduationCap,
    iconBg: "bg-brand-green/8",
    iconColor: "text-brand-green/70",
    accentBorder: "border-l-brand-green/40",
    chipBg: "bg-brand-green/8",
    chipText: "text-brand-green/70",
  },
  savings: {
    icon: PiggyBank,
    iconBg: "bg-brand-accent/10",
    iconColor: "text-brand-accent",
    accentBorder: "border-l-brand-accent",
    chipBg: "bg-brand-accent/10",
    chipText: "text-brand-accent",
  },
  gym: {
    icon: Dumbbell,
    iconBg: "bg-brand-green/10",
    iconColor: "text-brand-green",
    accentBorder: "border-l-brand-green",
    chipBg: "bg-brand-green/10",
    chipText: "text-brand-green",
  },
  phone: {
    icon: Smartphone,
    iconBg: "bg-brand-dark/8",
    iconColor: "text-brand-dark/60",
    accentBorder: "border-l-brand-dark/30",
    chipBg: "bg-brand-dark/5",
    chipText: "text-brand-dark/60",
  },
  netflix: {
    icon: Film,
    iconBg: "bg-brand-accent/10",
    iconColor: "text-brand-accent",
    accentBorder: "border-l-brand-accent",
    chipBg: "bg-brand-accent/10",
    chipText: "text-brand-accent",
  },
  other: {
    icon: MoreHorizontal,
    iconBg: "bg-brand-dark/5",
    iconColor: "text-brand-dark/40",
    accentBorder: "border-l-brand-dark/15",
    chipBg: "bg-brand-dark/5",
    chipText: "text-brand-dark/40",
  },
};

const fallback: CategoryStyle = styles.other;

export function getCategoryStyle(category: string): CategoryStyle {
  return styles[category.toLowerCase()] ?? fallback;
}
