export interface UserProfile {
  id: string;
  full_name: string | null;
  monthly_income: number | null;
  rent_amount: number | null;
  savings_goal: number | null;
  currency: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  currency: string;
  note: string | null;
  date: string;
  month: string; // generated column: first day of month
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  limit_amount: number;
  month: string; // first day of month, e.g. '2026-04-01'
  created_at: string;
}

export interface RecurringExpense {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_day: number;
  category: string;
  is_active: boolean;
  created_at: string;
}
