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

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  limit_amount: number;
  month: string;
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

// ── Accounts + transactions (new ledger layer) ──

export type AccountType =
  | "cash"
  | "checking"
  | "savings"
  | "credit"
  | "other";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  starting_balance: number;
  currency: string;
  archived_at: string | null;
  created_at: string;
}

export type TxType = "income" | "expense" | "transfer_in" | "transfer_out";

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  type: TxType;
  amount: number;
  category: string;
  currency: string;
  note: string | null;
  date: string;
  month: string; // generated column
  created_at: string;
  /** Set when this row was auto-posted from a recurring expense */
  posted_from_recurring_id?: string | null;
  /** Shared id linking the two paired rows of a transfer */
  transfer_group_id?: string | null;
  /** The OTHER account in a transfer pair (destination on transfer_out, source on transfer_in) */
  paired_account_id?: string | null;
}

/** Account with derived balance — computed client-side from transactions */
export interface AccountWithBalance extends Account {
  current_balance: number;
}
