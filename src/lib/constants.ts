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
  Wallet,
  Landmark,
  Briefcase,
  Laptop,
  Undo2,
  ArrowDownLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface CategoryDef {
  value: string;
  label: string;
  icon: LucideIcon;
}

// ── Expense categories ──

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

// ── Income categories (for transactions with type='income') ──

export const INCOME_CATEGORIES: CategoryDef[] = [
  { value: "salary", label: "Salary", icon: Briefcase },
  { value: "freelance", label: "Freelance", icon: Laptop },
  { value: "refund", label: "Refund", icon: Undo2 },
  { value: "transfer_in", label: "Transfer in", icon: ArrowDownLeft },
  { value: "other_income", label: "Other income", icon: MoreHorizontal },
];

export const VALID_INCOME_CATEGORIES = new Set(
  INCOME_CATEGORIES.map((c) => c.value)
);

export function getIncomeCategoryByValue(
  value: string
): CategoryDef | undefined {
  return INCOME_CATEGORIES.find((c) => c.value === value);
}

/** Resolve a category label for display, regardless of income/expense type */
export function getAnyCategoryByValue(
  value: string
): CategoryDef | undefined {
  return getCategoryByValue(value) ?? getIncomeCategoryByValue(value);
}

// ── Account types ──

export interface AccountTypeDef {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const ACCOUNT_TYPES: AccountTypeDef[] = [
  { value: "cash", label: "Cash", icon: Wallet },
  { value: "checking", label: "Checking", icon: Landmark },
  { value: "savings", label: "Savings", icon: PiggyBank },
  { value: "credit", label: "Credit card", icon: CreditCard },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

export const VALID_ACCOUNT_TYPES = new Set(
  ACCOUNT_TYPES.map((a) => a.value)
);

export function getAccountTypeByValue(
  value: string
): AccountTypeDef | undefined {
  return ACCOUNT_TYPES.find((a) => a.value === value);
}

/** Default account created on first transaction if user has none */
export const DEFAULT_ACCOUNT = {
  name: "Cash",
  type: "cash" as const,
  starting_balance: 0,
};

// ── Currency ──

export const SUPPORTED_CURRENCIES = ["USD", "CAD"] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

// ── Transaction type ──

export const TRANSACTION_TYPES = ["income", "expense"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
