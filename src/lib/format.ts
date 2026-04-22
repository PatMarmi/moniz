/**
 * Format a number as money with two decimals, optional sign prefix.
 *
 * Examples:
 *   formatMoney(1234.5)                  → "$1,234.50"
 *   formatMoney(-50)                     → "-$50.00"
 *   formatMoney(50, { showSign: true })  → "+$50.00"
 *   formatMoney(0, { showSign: true })   → "$0.00"
 */
export function formatMoney(
  amount: number,
  opts?: { showSign?: boolean }
): string {
  const abs = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (amount < 0) return `-$${abs}`;
  if (opts?.showSign && amount > 0) return `+$${abs}`;
  return `$${abs}`;
}

/**
 * Whole-dollar version, no decimals. For headline numbers like
 * "Left to spend $457" where decimals add visual noise.
 */
export function formatMoneyShort(
  amount: number,
  opts?: { showSign?: boolean }
): string {
  const abs = Math.round(Math.abs(amount)).toLocaleString();
  if (amount < 0) return `-$${abs}`;
  if (opts?.showSign && amount > 0) return `+$${abs}`;
  return `$${abs}`;
}
