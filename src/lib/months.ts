/** Get the first day of a month as YYYY-MM-DD */
export function monthStart(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Get the previous month's start date string */
export function prevMonthStart(currentMonth: string): string {
  const d = new Date(currentMonth + "T00:00:00");
  d.setMonth(d.getMonth() - 1);
  return monthStart(d);
}

/** Format a month string like "2026-04-01" to "April 2026" */
export function formatMonth(month: string): string {
  const d = new Date(month + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** Check if a month string is the current month */
export function isCurrentMonth(month: string): boolean {
  return month === monthStart();
}

/** Days left in a given month (0 for past months) */
export function daysLeftIn(month: string): number {
  const now = new Date();
  const monthDate = new Date(month + "T00:00:00");

  // Past month
  if (
    monthDate.getFullYear() < now.getFullYear() ||
    (monthDate.getFullYear() === now.getFullYear() &&
      monthDate.getMonth() < now.getMonth())
  ) {
    return 0;
  }

  // Current month
  if (
    monthDate.getFullYear() === now.getFullYear() &&
    monthDate.getMonth() === now.getMonth()
  ) {
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return lastDay - now.getDate();
  }

  // Future month (shouldn't happen but handle it)
  return 30;
}

/** Generate a list of months going back N months from current */
export function recentMonths(count: number = 6): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthStart(d));
  }
  return months;
}
