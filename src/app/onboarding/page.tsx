import Link from "next/link";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-brand-beige">
      <div className="w-full max-w-lg text-center">
        <span className="text-xl font-bold text-brand-dark">
          moniz<span className="text-brand-accent">.</span>
        </span>

        <div className="mt-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-accent bg-brand-accent/10 px-3.5 py-1.5 rounded-full mb-5">
            Step 1 of 4
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark tracking-tight">
            Let&apos;s set up your budget
          </h1>
          <p className="mt-3 text-brand-dark/40 text-sm max-w-sm mx-auto leading-relaxed">
            Answer a few quick questions so we can create a starter budget that
            fits your life.
          </p>
        </div>

        <div className="mt-10 bg-white/60 backdrop-blur-sm rounded-2xl border border-brand-dark/5 p-8">
          <p className="text-sm text-brand-dark/30">
            Onboarding form will go here — income, rent, fixed expenses, savings
            goal, comfort level.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-brand-dark/30 hover:text-brand-dark/60 transition-colors"
          >
            Back
          </Link>
          <Link
            href="/dashboard"
            className="bg-brand-dark text-brand-beige text-sm font-semibold px-6 py-3 rounded-xl hover:bg-brand-green transition-colors"
          >
            Continue
          </Link>
        </div>
      </div>
    </div>
  );
}
