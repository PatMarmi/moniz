export interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  /** Percentage allocations by category value — must sum to 100 */
  allocations: Record<string, number>;
}

export const BUDGET_TEMPLATES: BudgetTemplate[] = [
  {
    id: "balanced",
    name: "50/30/20 Balanced",
    description: "A classic split: needs, wants, and savings.",
    allocations: {
      rent: 30,
      groceries: 10,
      transport: 5,
      school: 5,
      eating_out: 10,
      entertainment: 10,
      subscriptions: 5,
      savings: 20,
      other: 5,
    },
  },
  {
    id: "essentials",
    name: "Student Essentials",
    description: "Prioritizes housing, food, and school costs.",
    allocations: {
      rent: 35,
      groceries: 15,
      transport: 10,
      school: 10,
      eating_out: 5,
      entertainment: 5,
      subscriptions: 5,
      savings: 10,
      other: 5,
    },
  },
  {
    id: "saver",
    name: "Aggressive Saver",
    description: "Maximizes savings by cutting discretionary spending.",
    allocations: {
      rent: 30,
      groceries: 10,
      transport: 5,
      school: 5,
      eating_out: 5,
      entertainment: 5,
      subscriptions: 5,
      savings: 30,
      other: 5,
    },
  },
];

/** Round to nearest $5 for clean numbers, minimum $5 */
function roundTo5(n: number): number {
  return Math.max(5, Math.round(n / 5) * 5);
}

export function applyTemplate(
  template: BudgetTemplate,
  monthlyIncome: number
): { category: string; amount: number }[] {
  return Object.entries(template.allocations).map(([category, pct]) => ({
    category,
    amount: roundTo5((pct / 100) * monthlyIncome),
  }));
}
