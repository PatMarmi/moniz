import { z } from "zod";
import {
  VALID_CATEGORIES,
  VALID_INCOME_CATEGORIES,
  VALID_ACCOUNT_TYPES,
  SUPPORTED_CURRENCIES,
  TRANSACTION_TYPES,
} from "@/lib/constants";

// ── Auth ──

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password is too long"),
});

// ── Onboarding ──

export const onboardingSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100),
  monthly_income: z.number().min(0, "Must be 0 or more"),
  rent_amount: z.number().min(0, "Must be 0 or more"),
  savings_goal: z.number().min(0, "Must be 0 or more"),
  currency: z.enum(SUPPORTED_CURRENCIES, { error: "Pick a currency" }),
});

// ── Shared category enum (used by budgets and recurring) ──

const expenseCategoryEnum = z
  .string()
  .min(1, "Pick a category")
  .refine((v) => VALID_CATEGORIES.has(v), "Invalid category");

// ── Budget ──

export const budgetSchema = z.object({
  category: expenseCategoryEnum,
  limit_amount: z.number().gt(0, "Limit must be greater than 0"),
});

// ── Recurring ──

export const recurringSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  amount: z.number().gt(0, "Amount must be greater than 0"),
  due_day: z
    .number()
    .int("Must be a whole number")
    .min(1, "Must be between 1 and 31")
    .max(31, "Must be between 1 and 31"),
  category: expenseCategoryEnum,
});

// ── Account (new) ──

export const accountSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Name is too long"),
  type: z
    .string()
    .min(1, "Pick a type")
    .refine((v) => VALID_ACCOUNT_TYPES.has(v), "Invalid account type"),
  starting_balance: z.number().finite("Enter a valid amount"),
  currency: z.enum(SUPPORTED_CURRENCIES, { error: "Pick a currency" }),
});

// ── Transaction (new) ──
//
// Category must be a VALID expense category when type='expense',
// or a VALID income category when type='income'. A plain enum can't
// express this, so we validate category in a .superRefine().

export const transactionSchema = z
  .object({
    account_id: z.string().uuid("Pick an account"),
    type: z.enum(TRANSACTION_TYPES, { error: "Pick income or expense" }),
    amount: z.number().gt(0, "Amount must be greater than 0"),
    category: z.string().min(1, "Pick a category"),
    date: z
      .string()
      .min(1, "Pick a date")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
    note: z
      .string()
      .trim()
      .max(200, "Note is too long")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const valid =
      data.type === "expense"
        ? VALID_CATEGORIES.has(data.category)
        : VALID_INCOME_CATEGORIES.has(data.category);

    if (!valid) {
      ctx.addIssue({
        code: "custom",
        path: ["category"],
        message:
          data.type === "expense"
            ? "Pick a valid expense category"
            : "Pick a valid income category",
      });
    }
  });

// ── Helper ──

export function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Invalid input";
}
