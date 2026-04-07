"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  DollarSign,
  Home,
  Target,
  Globe,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { SUPPORTED_CURRENCIES } from "@/lib/constants";
import { onboardingSchema, firstError } from "@/lib/validation";

/* ── animation variants ── */
const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? -80 : 80,
    opacity: 0,
  }),
};

/* ── step definitions ── */
const STEPS = [
  {
    key: "name",
    icon: User,
    title: "What's your name?",
    subtitle: "We'll use this to personalize your experience.",
  },
  {
    key: "income",
    icon: DollarSign,
    title: "Monthly income or allowance",
    subtitle: "How much money comes in each month? An estimate is fine.",
  },
  {
    key: "rent",
    icon: Home,
    title: "Monthly rent or housing cost",
    subtitle: "If you don't pay rent, enter 0.",
  },
  {
    key: "savings",
    icon: Target,
    title: "Monthly savings goal",
    subtitle: "Even $20/month is a great start. Enter 0 if you're not sure yet.",
  },
  {
    key: "currency",
    icon: Globe,
    title: "Your currency",
    subtitle: "We'll display all amounts in this currency.",
  },
] as const;

const TOTAL_STEPS = STEPS.length;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [savingsGoal, setSavingsGoal] = useState("");
  const [currency, setCurrency] = useState<string>("USD");

  // Pre-fill name from signup metadata
  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile]);

  // Redirect if already onboarded
  useEffect(() => {
    if (profile?.onboarding_completed) {
      router.replace("/dashboard");
    }
  }, [profile, router]);

  if (!user) return null;
  if (profile?.onboarding_completed) return null;

  function canProceed(): boolean {
    switch (STEPS[step].key) {
      case "name":
        return fullName.trim().length >= 1;
      case "income":
        return monthlyIncome !== "" && !isNaN(Number(monthlyIncome)) && Number(monthlyIncome) >= 0;
      case "rent":
        return rentAmount !== "" && !isNaN(Number(rentAmount)) && Number(rentAmount) >= 0;
      case "savings":
        return savingsGoal !== "" && !isNaN(Number(savingsGoal)) && Number(savingsGoal) >= 0;
      case "currency":
        return SUPPORTED_CURRENCIES.includes(currency as "USD" | "CAD");
      default:
        return true;
    }
  }

  function goNext() {
    if (!canProceed()) return;
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  }

  function goBack() {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }

  async function handleSubmit() {
    setError(null);

    const parsed = onboardingSchema.safeParse({
      full_name: fullName,
      monthly_income: Number(monthlyIncome),
      rent_amount: Number(rentAmount),
      savings_goal: Number(savingsGoal),
      currency,
    });

    if (!parsed.success) {
      setError(firstError(parsed.error));
      return;
    }

    setSubmitting(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        ...parsed.data,
        onboarding_completed: true,
      })
      .eq("id", user!.id);

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
  }

  const currentStep = STEPS[step];
  const StepIcon = currentStep.icon;
  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <div className="min-h-screen flex flex-col bg-brand-beige">
      {/* Top bar */}
      <div className="px-6 pt-6 pb-4">
        <span className="text-xl font-bold text-brand-dark">
          moniz<span className="text-brand-accent">.</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-6">
        <div className="w-full h-1 bg-brand-dark/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
        <p className="text-[11px] text-brand-dark/30 font-medium mt-2">
          Step {step + 1} of {TOTAL_STEPS}
        </p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        <div className="w-full max-w-md mx-auto">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Step icon */}
              <div className="w-12 h-12 rounded-2xl bg-brand-dark flex items-center justify-center mb-6">
                <StepIcon size={22} className="text-brand-accent" />
              </div>

              {/* Step title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark tracking-tight">
                {currentStep.title}
              </h1>
              <p className="mt-2 text-sm text-brand-dark/40 leading-relaxed">
                {currentStep.subtitle}
              </p>

              {/* Step input */}
              <div className="mt-8">
                {currentStep.key === "name" && (
                  <input
                    type="text"
                    autoFocus
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && goNext()}
                    placeholder="Your name"
                    className="w-full px-4 py-3.5 bg-white/60 border border-brand-dark/10 rounded-2xl text-base text-brand-dark placeholder:text-brand-dark/25 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 transition-colors"
                  />
                )}

                {currentStep.key === "income" && (
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/30 text-lg font-medium">
                      $
                    </span>
                    <input
                      type="number"
                      autoFocus
                      min="0"
                      step="50"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && goNext()}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-3.5 bg-white/60 border border-brand-dark/10 rounded-2xl text-base text-brand-dark placeholder:text-brand-dark/25 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 transition-colors"
                    />
                  </div>
                )}

                {currentStep.key === "rent" && (
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/30 text-lg font-medium">
                      $
                    </span>
                    <input
                      type="number"
                      autoFocus
                      min="0"
                      step="50"
                      value={rentAmount}
                      onChange={(e) => setRentAmount(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && goNext()}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-3.5 bg-white/60 border border-brand-dark/10 rounded-2xl text-base text-brand-dark placeholder:text-brand-dark/25 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 transition-colors"
                    />
                  </div>
                )}

                {currentStep.key === "savings" && (
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/30 text-lg font-medium">
                      $
                    </span>
                    <input
                      type="number"
                      autoFocus
                      min="0"
                      step="10"
                      value={savingsGoal}
                      onChange={(e) => setSavingsGoal(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && goNext()}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-3.5 bg-white/60 border border-brand-dark/10 rounded-2xl text-base text-brand-dark placeholder:text-brand-dark/25 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 transition-colors"
                    />
                  </div>
                )}

                {currentStep.key === "currency" && (
                  <div className="grid grid-cols-2 gap-3">
                    {SUPPORTED_CURRENCIES.map((cur) => (
                      <button
                        key={cur}
                        type="button"
                        onClick={() => setCurrency(cur)}
                        className={`flex items-center justify-center gap-2 px-4 py-4 rounded-2xl border text-sm font-semibold transition-all ${
                          currency === cur
                            ? "bg-brand-dark text-brand-beige border-brand-dark"
                            : "bg-white/60 text-brand-dark border-brand-dark/10 hover:border-brand-dark/20"
                        }`}
                      >
                        {cur === "USD" ? "🇺🇸" : "🇨🇦"} {cur}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 bg-brand-accent/10 text-brand-accent text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="px-6 pb-8 pt-4">
        <div className="w-full max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={goBack}
            disabled={step === 0}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-dark/30 hover:text-brand-dark/60 transition-colors disabled:opacity-0 disabled:pointer-events-none"
          >
            <ArrowLeft size={15} />
            Back
          </button>

          <button
            onClick={goNext}
            disabled={!canProceed() || submitting}
            className="flex items-center gap-2 bg-brand-accent text-white font-semibold px-6 py-3 rounded-full hover:bg-brand-accent/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving…
              </>
            ) : isLastStep ? (
              <>
                <Check size={16} strokeWidth={2.5} />
                Finish setup
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
