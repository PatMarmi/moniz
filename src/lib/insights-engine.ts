import { getCategoryByValue } from "@/lib/constants";
import type { Expense, Budget, RecurringExpense } from "@/types/database";

export type InsightType = "info" | "warning" | "positive";
export type InsightSection = "overview" | "budgets" | "patterns" | "recurring" | "comparison";

export interface GeneratedInsight {
  id: string;
  title: string;
  body: string;
  type: InsightType;
  section: InsightSection;
  metric?: string;
  metricLabel?: string;
}

function catLabel(cat: string): string {
  return getCategoryByValue(cat)?.label || cat;
}

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

export function generateInsights(
  expenses: Expense[],
  budgets: Budget[],
  recurring: RecurringExpense[],
  prevExpenses?: Expense[],
  prevBudgets?: Budget[]
): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];

  if (expenses.length === 0 && budgets.length === 0 && recurring.length === 0) {
    return [];
  }

  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalBudget = budgets.reduce((s, b) => s + Number(b.limit_amount), 0);

  const byCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
  });
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  // ── OVERVIEW ──
  if (totalBudget > 0 && expenses.length > 0) {
    const usedPct = pct(totalSpent, totalBudget);
    const remaining = totalBudget - totalSpent;

    if (remaining < 0) {
      insights.push({
        id: "over-budget-total",
        title: "You're over budget",
        body: `$${totalSpent.toFixed(0)} spent against a $${totalBudget.toFixed(0)} budget — $${Math.abs(remaining).toFixed(0)} over.`,
        type: "warning",
        section: "overview",
        metric: `${usedPct}%`,
        metricLabel: "used",
      });
    } else if (usedPct >= 90) {
      insights.push({
        id: "budget-almost-full",
        title: "Budget almost used up",
        body: `${usedPct}% used with $${remaining.toFixed(0)} left.`,
        type: "warning",
        section: "overview",
        metric: `$${remaining.toFixed(0)}`,
        metricLabel: "left",
      });
    } else if (usedPct <= 50) {
      insights.push({
        id: "well-under-budget",
        title: "Well within budget",
        body: `Only ${usedPct}% of your budget used so far. You're in good shape.`,
        type: "positive",
        section: "overview",
        metric: `${usedPct}%`,
        metricLabel: "used",
      });
    }
  }

  if (sorted.length > 0 && expenses.length >= 2) {
    const [topCat, topAmount] = sorted[0];
    const topPct = pct(topAmount, totalSpent);
    insights.push({
      id: "top-category",
      title: `${catLabel(topCat)} is your top category`,
      body: `$${topAmount.toFixed(0)} spent — ${topPct}% of total.`,
      type: "info",
      section: "overview",
      metric: `$${topAmount.toFixed(0)}`,
      metricLabel: topPct + "% of total",
    });
  }

  if (expenses.length >= 5) {
    const avg = totalSpent / expenses.length;
    insights.push({
      id: "avg-expense",
      title: "Average transaction size",
      body: `$${avg.toFixed(2)} across ${expenses.length} expenses.`,
      type: "info",
      section: "overview",
      metric: `$${avg.toFixed(0)}`,
      metricLabel: "average",
    });
  }

  // ── BUDGET ALERTS ──
  budgets.forEach((b) => {
    const spent = byCategory[b.category] || 0;
    const limit = Number(b.limit_amount);
    const usedPct = pct(spent, limit);
    const label = catLabel(b.category);

    if (usedPct >= 100) {
      insights.push({
        id: `over-${b.category}`,
        title: `${label} budget exceeded`,
        body: `$${spent.toFixed(0)} against a $${limit} limit — $${(spent - limit).toFixed(0)} over.`,
        type: "warning",
        section: "budgets",
        metric: `${usedPct}%`,
        metricLabel: "used",
      });
    } else if (usedPct >= 80) {
      insights.push({
        id: `near-${b.category}`,
        title: `${label} nearing limit`,
        body: `${usedPct}% used. $${(limit - spent).toFixed(0)} remaining.`,
        type: "warning",
        section: "budgets",
        metric: `$${(limit - spent).toFixed(0)}`,
        metricLabel: "left",
      });
    }
  });

  if (budgets.length > 0 && sorted.length > 0) {
    const budgetedCats = new Set(budgets.map((b) => b.category));
    const unbudgeted = sorted.filter(([cat, amount]) => !budgetedCats.has(cat) && amount > 20);
    if (unbudgeted.length > 0) {
      const [cat, amt] = unbudgeted[0];
      insights.push({
        id: "unbudgeted-" + cat,
        title: `${catLabel(cat)} has no budget`,
        body: `$${amt.toFixed(0)} spent with no limit set.`,
        type: "info",
        section: "budgets",
        metric: `$${amt.toFixed(0)}`,
        metricLabel: "no limit",
      });
    }
  }

  // ── PATTERNS ──
  const eatingOut = byCategory["eating_out"] || 0;
  const groceries = byCategory["groceries"] || 0;
  if (eatingOut > 0 && groceries > 0 && eatingOut > groceries) {
    insights.push({
      id: "eating-vs-groceries",
      title: "Eating out exceeds groceries",
      body: `$${eatingOut.toFixed(0)} eating out vs $${groceries.toFixed(0)} on groceries.`,
      type: "info",
      section: "patterns",
    });
  }

  const coffee = byCategory["coffee"] || 0;
  if (coffee > 0 && (pct(coffee, totalSpent) >= 5 || coffee >= 30)) {
    insights.push({
      id: "coffee-habit",
      title: "Coffee adds up",
      body: `$${coffee.toFixed(0)} on coffee this month.`,
      type: "info",
      section: "patterns",
      metric: `$${coffee.toFixed(0)}`,
      metricLabel: "coffee",
    });
  }

  const subs = byCategory["subscriptions"] || 0;
  if (subs > 0 && totalBudget > 0 && pct(subs, totalBudget) >= 8) {
    insights.push({
      id: "subs-share",
      title: "Subscriptions take a noticeable share",
      body: `$${subs.toFixed(0)} is ${pct(subs, totalBudget)}% of your budget.`,
      type: "info",
      section: "patterns",
      metric: `${pct(subs, totalBudget)}%`,
      metricLabel: "of budget",
    });
  }

  if (expenses.length >= 3) {
    const avg = totalSpent / expenses.length;
    const outliers = expenses.filter((e) => Number(e.amount) > avg * 3);
    if (outliers.length > 0 && avg > 5) {
      const biggest = outliers.sort((a, b) => Number(b.amount) - Number(a.amount))[0];
      insights.push({
        id: "large-expense",
        title: "Unusually large expense",
        body: `$${Number(biggest.amount).toFixed(2)} in ${catLabel(biggest.category).toLowerCase()}${biggest.note ? ` (${biggest.note})` : ""} — ${Math.round(Number(biggest.amount) / avg)}x your average.`,
        type: "info",
        section: "patterns",
        metric: `$${Number(biggest.amount).toFixed(0)}`,
        metricLabel: "single",
      });
    }
  }

  // ── RECURRING ──
  if (recurring.length > 0) {
    const recurringTotal = recurring.reduce((s, r) => s + Number(r.amount), 0);

    const today = new Date().getDate();
    const upcoming = recurring.filter((r) => {
      const diff = r.due_day - today;
      return diff > 0 && diff <= 7;
    });

    if (upcoming.length > 0) {
      const upcomingTotal = upcoming.reduce((s, r) => s + Number(r.amount), 0);
      const names = upcoming.slice(0, 3).map((r) => r.name).join(", ");
      insights.push({
        id: "upcoming-bills",
        title: `${upcoming.length} bill${upcoming.length > 1 ? "s" : ""} due this week`,
        body: `${names}${upcoming.length > 3 ? ` and ${upcoming.length - 3} more` : ""} — $${upcomingTotal.toFixed(2)}.`,
        type: "warning",
        section: "recurring",
        metric: `$${upcomingTotal.toFixed(0)}`,
        metricLabel: "due soon",
      });
    }

    if (totalBudget > 0 && pct(recurringTotal, totalBudget) >= 40) {
      insights.push({
        id: "recurring-share",
        title: "Fixed costs are a big share",
        body: `${recurring.length} recurring bills total $${recurringTotal.toFixed(0)}/month — ${pct(recurringTotal, totalBudget)}% of your budget.`,
        type: "info",
        section: "recurring",
        metric: `${pct(recurringTotal, totalBudget)}%`,
        metricLabel: "of budget",
      });
    }
  }

  // ── MONTH-OVER-MONTH COMPARISON ──
  if (prevExpenses && prevExpenses.length > 0) {
    const prevTotal = prevExpenses.reduce((s, e) => s + Number(e.amount), 0);

    if (totalSpent > 0) {
      const diff = totalSpent - prevTotal;
      const diffPct = pct(Math.abs(diff), prevTotal);

      if (diff < 0) {
        insights.push({
          id: "mom-spending-down",
          title: "Spending is down vs last month",
          body: `$${Math.abs(diff).toFixed(0)} less than last month (${diffPct}% decrease).`,
          type: "positive",
          section: "comparison",
          metric: `-$${Math.abs(diff).toFixed(0)}`,
          metricLabel: "vs last month",
        });
      } else if (diff > 0 && diffPct >= 10) {
        insights.push({
          id: "mom-spending-up",
          title: "Spending is up vs last month",
          body: `$${diff.toFixed(0)} more than last month (${diffPct}% increase).`,
          type: "warning",
          section: "comparison",
          metric: `+$${diff.toFixed(0)}`,
          metricLabel: "vs last month",
        });
      }
    }

    // Top category comparison
    const prevByCategory: Record<string, number> = {};
    prevExpenses.forEach((e) => {
      prevByCategory[e.category] = (prevByCategory[e.category] || 0) + Number(e.amount);
    });

    if (sorted.length > 0) {
      const [topCat] = sorted[0];
      const thisAmt = byCategory[topCat] || 0;
      const prevAmt = prevByCategory[topCat] || 0;

      if (prevAmt > 0 && thisAmt > prevAmt) {
        const catDiff = pct(thisAmt - prevAmt, prevAmt);
        if (catDiff >= 15) {
          insights.push({
            id: "mom-category-up",
            title: `${catLabel(topCat)} increased ${catDiff}%`,
            body: `$${thisAmt.toFixed(0)} this month vs $${prevAmt.toFixed(0)} last month.`,
            type: "info",
            section: "comparison",
            metric: `+${catDiff}%`,
            metricLabel: "vs last month",
          });
        }
      }
    }
  }

  if (prevBudgets && prevBudgets.length > 0) {
    const prevBudgetTotal = prevBudgets.reduce((s, b) => s + Number(b.limit_amount), 0);
    if (totalBudget > 0 && prevBudgetTotal > 0 && totalBudget !== prevBudgetTotal) {
      const diff = totalBudget - prevBudgetTotal;
      insights.push({
        id: "mom-budget-change",
        title: `Budget ${diff > 0 ? "increased" : "decreased"} vs last month`,
        body: `$${totalBudget.toFixed(0)} this month vs $${prevBudgetTotal.toFixed(0)} last month — $${Math.abs(diff).toFixed(0)} ${diff > 0 ? "higher" : "lower"}.`,
        type: "info",
        section: "comparison",
        metric: `${diff > 0 ? "+" : "-"}$${Math.abs(diff).toFixed(0)}`,
        metricLabel: "vs last month",
      });
    }
  }

  return insights;
}
