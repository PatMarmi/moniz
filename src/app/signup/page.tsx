"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, firstError } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { Mail } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const limited = rateLimit("signup");
    if (limited) { setError(limited); return; }

    const parsed = signupSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      setError(firstError(parsed.error));
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.name },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If a session exists, email confirmation is disabled → redirect to onboarding
    if (data.session) {
      router.push("/onboarding");
      return;
    }

    // No session → email confirmation is required → show check-email state
    setEmailSent(true);
    setLoading(false);
  }

  // Check-your-email success state
  if (emailSent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-brand-beige">
        <div className="w-full max-w-sm text-center">
          <Link
            href="/"
            className="text-xl font-bold text-brand-dark block mb-8"
          >
            moniz<span className="text-brand-accent">.</span>
          </Link>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-brand-dark/5 p-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center mx-auto mb-4">
              <Mail size={24} className="text-brand-accent" />
            </div>
            <h1 className="text-xl font-bold text-brand-dark">
              Check your email
            </h1>
            <p className="text-sm text-brand-dark/40 mt-3 leading-relaxed">
              We sent a confirmation link to{" "}
              <span className="font-medium text-brand-dark">{email}</span>.
              Click the link to activate your account.
            </p>
          </div>
          <p className="text-sm text-brand-dark/40 mt-6">
            Already confirmed?{" "}
            <Link
              href="/login"
              className="text-brand-accent font-semibold hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-brand-beige">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="text-xl font-bold text-brand-dark block text-center mb-8"
        >
          moniz<span className="text-brand-accent">.</span>
        </Link>
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-brand-dark/5 p-8">
          <h1 className="text-2xl font-bold text-brand-dark text-center">
            Create your account
          </h1>
          <p className="text-sm text-brand-dark/40 text-center mt-1">
            Start managing your money in minutes
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="bg-brand-accent/10 text-brand-accent text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-brand-dark/70 mb-1"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3.5 py-2.5 bg-brand-dark/[0.03] border border-brand-dark/10 rounded-xl text-sm text-brand-dark placeholder:text-brand-dark/25 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-brand-dark/70 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full px-3.5 py-2.5 bg-brand-dark/[0.03] border border-brand-dark/10 rounded-xl text-sm text-brand-dark placeholder:text-brand-dark/25 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-brand-dark/70 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password (min 6 characters)"
                className="w-full px-3.5 py-2.5 bg-brand-dark/[0.03] border border-brand-dark/10 rounded-xl text-sm text-brand-dark placeholder:text-brand-dark/25 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-accent text-white font-semibold py-3 rounded-xl hover:bg-brand-accent/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-sm text-brand-dark/40 text-center mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-brand-accent font-semibold hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
