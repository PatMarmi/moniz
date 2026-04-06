"use client";

import { motion } from "framer-motion";
import {
  TrendingDown,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Brain,
  BarChart3,
  Zap,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const vp = { once: true, margin: "-40px" as const };

interface Insight {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
  metric?: string;
  metricLabel?: string;
  section: "patterns" | "alerts" | "actions";
}

const insights: Insight[] = [
  {
    icon: TrendingDown,
    iconColor: "text-brand-accent",
    iconBg: "bg-brand-accent/10",
    title: "Eating out exceeds groceries",
    body: "You've spent $85 on eating out vs $120 on groceries. Cooking more could save ~$40/month.",
    metric: "$85",
    metricLabel: "eating out",
    section: "patterns",
  },
  {
    icon: BarChart3,
    iconColor: "text-brand-orange-soft",
    iconBg: "bg-brand-orange-soft/10",
    title: "Food is your top category",
    body: "Combined food spending ($205) is 17% of your total budget. This is typical for students.",
    metric: "17%",
    metricLabel: "of budget",
    section: "patterns",
  },
  {
    icon: AlertTriangle,
    iconColor: "text-brand-accent",
    iconBg: "bg-brand-accent/10",
    title: "Entertainment budget nearly full",
    body: "92% used with 12 days remaining. You may want to hold off on discretionary spending.",
    metric: "92%",
    metricLabel: "used",
    section: "alerts",
  },
  {
    icon: CreditCard,
    iconColor: "text-brand-dark/60",
    iconBg: "bg-brand-dark/5",
    title: "Subscriptions total $90/mo",
    body: "3 active subscriptions take up 7.5% of your budget. Review whether you're using all of them.",
    metric: "$90",
    metricLabel: "/month",
    section: "alerts",
  },
  {
    icon: Target,
    iconColor: "text-brand-green",
    iconBg: "bg-brand-green/10",
    title: "Cook 3 more meals per week",
    body: "Shifting $40 from eating out to groceries each month could fund a small savings goal.",
    section: "actions",
  },
  {
    icon: CheckCircle,
    iconColor: "text-brand-green",
    iconBg: "bg-brand-green/10",
    title: "You're on track this month",
    body: "At your current pace you'll end the month ~$120 under budget. Keep it up.",
    metric: "$120",
    metricLabel: "projected surplus",
    section: "actions",
  },
  {
    icon: TrendingUp,
    iconColor: "text-brand-green",
    iconBg: "bg-brand-green/10",
    title: "Transport is efficient",
    body: "Only 50% of your transport budget used — one of your most consistent categories.",
    metric: "50%",
    metricLabel: "used",
    section: "patterns",
  },
];

const sectionMeta: Record<string, { label: string; icon: LucideIcon }> = {
  patterns: { label: "Spending patterns", icon: BarChart3 },
  alerts: { label: "Heads up", icon: Zap },
  actions: { label: "Suggested actions", icon: Target },
};

export default function InsightsPage() {
  const sections = ["patterns", "alerts", "actions"] as const;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Hero */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={vp}
        variants={fadeUp}
        custom={0}
        className="bg-brand-dark rounded-2xl p-6 sm:p-8"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-brand-accent/15 flex items-center justify-center shrink-0">
            <Brain size={22} className="text-brand-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-brand-beige">
              Your money this month
            </h2>
            <p className="text-sm text-brand-beige/40 mt-1 leading-relaxed">
              AI-generated observations based on your spending data. These are
              reflections, not financial advice.
            </p>
          </div>
        </div>

        {/* Quick stat row */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { value: "5", label: "Insights" },
            { value: "2", label: "Alerts" },
            { value: "2", label: "Actions" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-brand-beige/5 rounded-xl px-4 py-3 text-center"
            >
              <p className="text-xl font-bold text-brand-beige">{s.value}</p>
              <p className="text-[11px] text-brand-beige/30 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Grouped insight sections */}
      {sections.map((sectionKey) => {
        const meta = sectionMeta[sectionKey];
        const SectionIcon = meta.icon;
        const sectionInsights = insights.filter((i) => i.section === sectionKey);

        return (
          <div key={sectionKey} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <SectionIcon
                size={14}
                strokeWidth={2}
                className="text-brand-dark/30"
              />
              <h3 className="text-xs font-bold text-brand-dark/40 uppercase tracking-wider">
                {meta.label}
              </h3>
            </div>

            {sectionInsights.map((insight, i) => {
              const Icon = insight.icon;

              return (
                <motion.div
                  key={insight.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={vp}
                  variants={fadeUp}
                  custom={i}
                  className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-brand-dark/5 hover:border-brand-dark/10 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-9 h-9 rounded-xl ${insight.iconBg} flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      <Icon
                        size={17}
                        strokeWidth={1.8}
                        className={insight.iconColor}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-semibold text-brand-dark">
                          {insight.title}
                        </h3>
                        {insight.metric && (
                          <div className="text-right shrink-0">
                            <p className="text-base font-bold text-brand-dark">
                              {insight.metric}
                            </p>
                            <p className="text-[10px] text-brand-dark/30">
                              {insight.metricLabel}
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm text-brand-dark/45 leading-relaxed">
                        {insight.body}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        );
      })}

      <p className="text-xs text-brand-dark/25 text-center pt-2">
        Sample insights — real AI analysis coming soon.
      </p>
    </div>
  );
}
