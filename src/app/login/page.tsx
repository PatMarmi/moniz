import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-brand-beige">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-xl font-bold text-brand-dark block text-center mb-8">
          moniz<span className="text-brand-accent">.</span>
        </Link>
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-brand-dark/5 p-8">
          <h1 className="text-2xl font-bold text-brand-dark text-center">Welcome back</h1>
          <p className="text-sm text-brand-dark/40 text-center mt-1">Log in to your account</p>

          <form className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-dark/70 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@university.edu"
                className="w-full px-3.5 py-2.5 bg-brand-dark/[0.03] border border-brand-dark/10 rounded-xl text-sm text-brand-dark placeholder:text-brand-dark/25 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-dark/70 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Your password"
                className="w-full px-3.5 py-2.5 bg-brand-dark/[0.03] border border-brand-dark/10 rounded-xl text-sm text-brand-dark placeholder:text-brand-dark/25 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-brand-dark text-brand-beige font-semibold py-3 rounded-xl hover:bg-brand-green transition-colors text-sm"
            >
              Log in
            </button>
          </form>
        </div>

        <p className="text-sm text-brand-dark/40 text-center mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-brand-accent font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
