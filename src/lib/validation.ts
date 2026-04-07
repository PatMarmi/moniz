import { z } from "zod";
import { VALID_CATEGORIES, SUPPORTED_CURRENCIES } from "@/lib/constants";

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

// ── Expense ──

const categoryEnum = z
  .string()
  .min(1, "Pick a category")
  .refine((v) => VALID_CATEGORIES.has(v), "Invalid category");

export const expenseSchema = z.object({
  amount: z.number().gt(0, "Amount must be greater than 0"),
  category: categoryEnum,
  date: z.string().min(1, "Pick a date").regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  note: z.string().trim().max(200, "Note is too long").optional().or(z.literal("")),
});

// ── Budget ──

export const budgetSchema = z.object({
  category: categoryEnum,
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
  category: categoryEnum,
});

// ── Helper to extract first error from a ZodError ──

export function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Invalid input";
}
