"use client";

import { motion } from "framer-motion";
import {
  Shield,
  ArrowLeftRight,
  CreditCard,
  Target,
  PiggyBank,
  TrendingUp,
  BookOpen,
  Clock,
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

interface Lesson {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate";
  readTime: string;
  topic: string;
}

const lessons: Lesson[] = [
  {
    icon: Shield,
    iconBg: "bg-brand-green/10",
    iconColor: "text-brand-green",
    title: "What is an emergency fund?",
    description:
      "Money set aside for unexpected costs — like a car repair or medical bill. Aim for $500 to start, then build from there.",
    difficulty: "Beginner",
    readTime: "2 min",
    topic: "Saving",
  },
  {
    icon: ArrowLeftRight,
    iconBg: "bg-brand-orange-soft/10",
    iconColor: "text-brand-orange-soft",
    title: "Fixed vs variable expenses",
    description:
      "Fixed expenses stay the same each month (rent, subscriptions). Variable ones change (groceries, going out). Knowing the difference helps you budget.",
    difficulty: "Beginner",
    readTime: "2 min",
    topic: "Budgeting",
  },
  {
    icon: CreditCard,
    iconBg: "bg-brand-accent/10",
    iconColor: "text-brand-accent",
    title: "The subscription trap",
    description:
      "Small monthly charges add up fast. $10/month across 5 services = $600/year. Audit your subscriptions regularly.",
    difficulty: "Beginner",
    readTime: "3 min",
    topic: "Spending",
  },
  {
    icon: Target,
    iconBg: "bg-brand-dark/5",
    iconColor: "text-brand-dark/60",
    title: "The 50/30/20 rule",
    description:
      "A simple budgeting guideline: 50% needs, 30% wants, 20% savings. Use it as a starting point and adjust to your life.",
    difficulty: "Beginner",
    readTime: "3 min",
    topic: "Budgeting",
  },
  {
    icon: PiggyBank,
    iconBg: "bg-brand-accent/10",
    iconColor: "text-brand-accent",
    title: "Pay yourself first",
    description:
      "Transfer your savings amount the same day you get paid — before spending on anything else. It builds the habit automatically.",
    difficulty: "Beginner",
    readTime: "2 min",
    topic: "Saving",
  },
  {
    icon: TrendingUp,
    iconBg: "bg-brand-green/10",
    iconColor: "text-brand-green",
    title: "Why compound interest matters",
    description:
      "Starting to save $50/month at 20 can grow to far more than $200/month starting at 30. Time is your biggest asset.",
    difficulty: "Intermediate",
    readTime: "4 min",
    topic: "Investing",
  },
];

const topicColors: Record<string, string> = {
  Saving: "bg-brand-green/10 text-brand-green",
  Budgeting: "bg-brand-orange-soft/10 text-brand-orange-soft",
  Spending: "bg-brand-accent/10 text-brand-accent",
  Investing: "bg-brand-dark/5 text-brand-dark/60",
};

export default function LearnPage() {
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
            <BookOpen size={22} className="text-brand-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-brand-beige">
              Money basics
            </h2>
            <p className="text-sm text-brand-beige/40 mt-1 leading-relaxed">
              Short, practical lessons to help you build confidence with your
              finances. No jargon, no pressure.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Lesson grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {lessons.map((lesson, i) => {
          const Icon = lesson.icon;
          const topicStyle =
            topicColors[lesson.topic] ?? "bg-brand-dark/5 text-brand-dark/40";

          return (
            <motion.div
              key={lesson.title}
              initial="hidden"
              whileInView="visible"
              viewport={vp}
              variants={fadeUp}
              custom={i % 4}
              className="group bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-brand-dark/5 hover:border-brand-dark/10 transition-colors cursor-pointer"
            >
              {/* Icon + pills row */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-10 h-10 rounded-xl ${lesson.iconBg} flex items-center justify-center`}
                >
                  <Icon
                    size={20}
                    strokeWidth={1.7}
                    className={lesson.iconColor}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${topicStyle}`}>
                    {lesson.topic}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-dark/5 text-brand-dark/40 flex items-center gap-1">
                    <Clock size={9} />
                    {lesson.readTime}
                  </span>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-sm font-semibold text-brand-dark group-hover:text-brand-accent transition-colors">
                {lesson.title}
              </h3>
              <p className="mt-2 text-sm text-brand-dark/40 leading-relaxed">
                {lesson.description}
              </p>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-brand-dark/5">
                <span className="text-[10px] font-semibold text-brand-dark/25 uppercase tracking-wider">
                  {lesson.difficulty}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="text-xs text-brand-dark/25 text-center pt-2">
        More lessons coming soon.
      </p>
    </div>
  );
}
