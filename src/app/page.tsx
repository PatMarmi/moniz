"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  PieChart,
  Zap,
  Brain,
  ArrowRight,
  Wallet,
  TrendingUp,
  Bell,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-beige">
      {/* ── Navigation ── */}
      <nav className="w-full sticky top-0 z-50 bg-brand-beige/80 backdrop-blur-xl border-b border-brand-dark/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 sm:px-8 h-16">
          <Link href="/" className="text-xl font-bold tracking-tight text-brand-dark">
            moniz<span className="text-brand-accent">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-brand-dark/60 hover:text-brand-dark transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold bg-brand-dark text-brand-beige px-4 py-2 rounded-full hover:bg-brand-green transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-20 sm:pb-32">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-2xl"
          >
            <motion.div
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 bg-brand-dark/5 text-brand-dark text-xs font-semibold px-3.5 py-1.5 rounded-full mb-8"
            >
              <span className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
              Built for students
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-[2.75rem] sm:text-6xl lg:text-7xl font-bold tracking-tight text-brand-dark leading-[1.05]"
            >
              Know your
              <br />
              money.{" "}
              <span className="text-brand-accent">Own it.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-6 text-lg sm:text-xl text-brand-dark/60 max-w-lg leading-relaxed"
            >
              Track spending, set budgets, and get AI insights — in one clean,
              beginner-friendly app designed for students.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="flex flex-col sm:flex-row items-start gap-3 mt-10"
            >
              <Link
                href="/signup"
                className="group flex items-center gap-2 bg-brand-accent text-white font-semibold px-6 py-3.5 rounded-full hover:bg-brand-accent/90 transition-all"
              >
                Start for free
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Link>
              <Link
                href="#how-it-works"
                className="flex items-center gap-2 text-brand-dark font-medium px-6 py-3.5 rounded-full border border-brand-dark/15 hover:bg-brand-dark/5 transition-colors"
              >
                See how it works
              </Link>
            </motion.div>
          </motion.div>

          {/* Hero visual — mini dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="mt-16 sm:mt-20"
          >
            <div className="bg-brand-dark rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-3xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-brand-beige/50 text-xs font-medium uppercase tracking-wider">
                    Left to spend
                  </p>
                  <p className="text-4xl sm:text-5xl font-bold text-brand-beige mt-1">
                    $457
                  </p>
                  <p className="text-brand-beige/40 text-sm mt-1">
                    of $1,200 budget · 12 days left
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-xs font-medium text-brand-accent bg-brand-accent/10 px-3 py-1 rounded-full">
                    On track
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Groceries", pct: 60, color: "bg-brand-accent" },
                  { label: "Eating out", pct: 85, color: "bg-brand-orange-soft" },
                  { label: "Transport", pct: 50, color: "bg-brand-beige-warm" },
                ].map((cat) => (
                  <div key={cat.label} className="bg-brand-green/30 rounded-xl p-3">
                    <p className="text-brand-beige/60 text-[11px] font-medium">
                      {cat.label}
                    </p>
                    <div className="mt-2 w-full h-1.5 bg-brand-beige/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cat.color}`}
                        style={{ width: `${cat.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-brand-dark py-20 sm:py-28 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-brand-accent text-xs font-semibold uppercase tracking-widest mb-3"
            >
              Features
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl sm:text-4xl font-bold text-brand-beige tracking-tight"
            >
              Everything you need.
              <br />
              Nothing you don&apos;t.
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-14"
          >
            <FeatureCard
              icon={<PieChart size={22} />}
              title="Smart budgets"
              description="Set monthly limits per category. Watch your progress in real time with simple visual bars."
              index={0}
            />
            <FeatureCard
              icon={<Zap size={22} />}
              title="Quick expense tracking"
              description="Log any expense in seconds. Categorize, add a note, done. No bank linking needed."
              index={1}
            />
            <FeatureCard
              icon={<Brain size={22} />}
              title="AI insights"
              description="Get plain-language spending analysis. No finance degree required — just honest, useful feedback."
              index={2}
            />
            <FeatureCard
              icon={<Bell size={22} />}
              title="Bill reminders"
              description="Track recurring expenses and see what's coming up so nothing catches you off guard."
              index={3}
            />
            <FeatureCard
              icon={<Wallet size={22} />}
              title="Know what's left"
              description="One number tells you how much you can spend. Updated automatically as you log expenses."
              index={4}
            />
            <FeatureCard
              icon={<ShieldCheck size={22} />}
              title="No bank access needed"
              description="Your data stays yours. Manual entry means no passwords, no linking, no risk."
              index={5}
            />
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-20 sm:py-28 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-brand-accent text-xs font-semibold uppercase tracking-widest mb-3"
            >
              How it works
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl sm:text-4xl font-bold text-brand-dark tracking-tight"
            >
              Set up in 3 minutes.
              <br />
              Use it every day.
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-14"
          >
            {[
              {
                step: "01",
                title: "Tell us the basics",
                desc: "Income, rent, fixed expenses. We build your starter budget in seconds.",
              },
              {
                step: "02",
                title: "Track as you go",
                desc: "Log expenses with a tap. We categorize and track against your budget automatically.",
              },
              {
                step: "03",
                title: "Get smarter",
                desc: "AI insights show you patterns, flag overspending, and suggest simple improvements.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                custom={i}
                className="relative"
              >
                <span className="text-6xl sm:text-7xl font-bold text-brand-dark/[0.06] leading-none">
                  {item.step}
                </span>
                <h3 className="text-lg font-semibold text-brand-dark mt-2">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-brand-dark/50 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-5 sm:px-8 pb-20 sm:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto bg-brand-dark rounded-2xl sm:rounded-3xl p-8 sm:p-14 relative overflow-hidden"
        >
          {/* Decorative accent bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-accent via-brand-orange-soft to-brand-accent" />

          <div className="relative z-10 max-w-lg">
            <h2 className="text-2xl sm:text-4xl font-bold text-brand-beige tracking-tight leading-tight">
              Stop guessing where your money went.
            </h2>
            <p className="mt-4 text-brand-beige/50 leading-relaxed">
              Join students who are building better financial habits — one
              expense at a time.
            </p>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 mt-8 bg-brand-accent text-white font-semibold px-6 py-3.5 rounded-full hover:bg-brand-accent/90 transition-all"
            >
              Get started — it&apos;s free
              <ChevronRight
                size={16}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-brand-dark/5 py-8 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold text-brand-dark">
            moniz<span className="text-brand-accent">.</span>
          </span>
          <p className="text-xs text-brand-dark/30">
            &copy; {new Date().getFullYear()} Moniz. Built for students, by
            students.
          </p>
          <div className="flex items-center gap-5 text-xs text-brand-dark/30">
            <a href="#" className="hover:text-brand-dark/60 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-brand-dark/60 transition-colors">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Feature card component ── */
function FeatureCard({
  icon,
  title,
  description,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className="group bg-brand-green/20 hover:bg-brand-green/30 rounded-2xl p-6 transition-colors cursor-default"
    >
      <div className="w-10 h-10 rounded-xl bg-brand-accent/10 text-brand-accent flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-brand-beige">{title}</h3>
      <p className="mt-2 text-sm text-brand-beige/50 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
