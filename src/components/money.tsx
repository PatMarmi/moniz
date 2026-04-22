"use client";

import { useBalanceVisibility } from "@/components/balance-visibility-provider";
import { formatMoney, formatMoneyShort } from "@/lib/format";

interface MoneyProps {
  value: number;
  /** Drop decimals (good for headline numbers) */
  short?: boolean;
  /** Prepend "+" for positive values */
  showSign?: boolean;
  className?: string;
}

/**
 * Display a money value that automatically masks to "••••" when
 * the user has toggled "hide balances" in the header.
 *
 * Use anywhere a financial value is rendered: balances, totals,
 * transaction amounts, budget spent/limit, etc.
 */
export function Money({ value, short, showSign, className }: MoneyProps) {
  const { hidden } = useBalanceVisibility();
  const text = hidden
    ? "••••"
    : (short ? formatMoneyShort : formatMoney)(value, { showSign });

  return <span className={className}>{text}</span>;
}
