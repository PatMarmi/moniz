"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, firstError } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const limited = rateLimit("login");
    if (limited) { setError(limited); return; }

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) { setError(firstError(parsed.error)); return; }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
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
            Welcome back
          </h1>
          <p className="text-sm text-brand-dark/40 text-center mt-1">
            Log in to your account
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="bg-brand-accent/10 text-brand-accent text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-3.5 py-2.5 bg-brand-dark/[0.03] border border-brand-dark/10 rounded-xl text-sm text-brand-dark placeholder:text-brand-dark/25 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-dark text-brand-beige font-semibold py-3 rounded-xl hover:bg-brand-green transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>
        </div>

        <p className="text-sm text-brand-dark/40 text-center mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-brand-accent font-semibold hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
