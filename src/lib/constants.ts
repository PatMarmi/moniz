import {
  Home,
  ShoppingCart,
  Utensils,
  Bus,
  Tv,
  CreditCard,
  GraduationCap,
  ShoppingBag,
  PiggyBank,
  Coffee,
  MoreHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface CategoryDef {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const CATEGORIES: CategoryDef[] = [
  { value: "rent", label: "Rent", icon: Home },
  { value: "groceries", label: "Groceries", icon: ShoppingCart },
  { value: "eating_out", label: "Eating out", icon: Utensils },
  { value: "transport", label: "Transport", icon: Bus },
  { value: "entertainment", label: "Entertainment", icon: Tv },
  { value: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { value: "school", label: "School", icon: GraduationCap },
  { value: "shopping", label: "Shopping", icon: ShoppingBag },
  { value: "savings", label: "Savings", icon: PiggyBank },
  { value: "coffee", label: "Coffee", icon: Coffee },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

export const VALID_CATEGORIES = new Set(CATEGORIES.map((c) => c.value));

export function getCategoryByValue(value: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.value === value);
}

export const SUPPORTED_CURRENCIES = ["USD", "CAD"] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];
