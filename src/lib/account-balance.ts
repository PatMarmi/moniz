import type { Account, TxType } from "@/types/database";

/**
 * Minimal shape needed to compute balances. Any query that selects
 * (account_id, type, amount) can be passed in.
 */
export interface BalanceTx {
  account_id: string;
  type: TxType;
  amount: number;
}

/**
 * Map a transaction type to its sign:
 *   income, transfer_in   →  +amount
 *   expense, transfer_out →  -amount
 */
function deltaFor(tx: BalanceTx): number {
  switch (tx.type) {
    case "income":
    case "transfer_in":
      return Number(tx.amount);
    case "expense":
    case "transfer_out":
      return -Number(tx.amount);
    default:
      return 0;
  }
}

/**
 * Aggregate per-account balance deltas across a flat list of transactions.
 * Returns a map keyed by account_id → net change in cents/dollars.
 */
export function txnsToBalanceDeltas(
  txns: BalanceTx[]
): Record<string, number> {
  const deltas: Record<string, number> = {};
  for (const tx of txns) {
    const delta = deltaFor(tx);
    if (delta !== 0) {
      deltas[tx.account_id] = (deltas[tx.account_id] || 0) + delta;
    }
  }
  return deltas;
}

/**
 * Project a list of accounts into accounts-with-current-balance by
 * applying the sum of all relevant transaction deltas.
 *
 * The `txns` argument should be the user's full transaction history
 * (or whatever scope you want the balance to reflect — typically all-time).
 */
export function computeAccountBalances<
  T extends Pick<Account, "id" | "starting_balance">
>(accounts: T[], txns: BalanceTx[]): Array<T & { current_balance: number }> {
  const deltas = txnsToBalanceDeltas(txns);
  return accounts.map((a) => ({
    ...a,
    current_balance: Number(a.starting_balance) + (deltas[a.id] || 0),
  }));
}
