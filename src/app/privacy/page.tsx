import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brand-beige">
      <div className="max-w-2xl mx-auto px-6 py-12 sm:py-20">
        <Link
          href="/"
          className="text-xl font-bold text-brand-dark mb-10 block"
        >
          moniz<span className="text-brand-accent">.</span>
        </Link>

        <h1 className="text-3xl font-bold text-brand-dark tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-brand-dark/40 mt-2">
          Last updated: April 2026
        </p>

        <div className="mt-10 space-y-8 text-sm text-brand-dark/60 leading-relaxed">
          <Section title="1. What we collect">
            <p>
              Moniz collects only the data you provide directly through the app:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <strong>Account data:</strong> email address, name, and
                password (hashed, never stored in plaintext)
              </li>
              <li>
                <strong>Profile data:</strong> monthly income, rent amount,
                savings goal, and currency preference
              </li>
              <li>
                <strong>Financial data:</strong> expenses, budgets, and
                recurring bill entries you create
              </li>
            </ul>
            <p className="mt-2">
              We do not connect to your bank accounts, access your transactions
              automatically, or collect data from third-party financial
              services.
            </p>
          </Section>

          <Section title="2. Why we collect it">
            <p>Your data is used exclusively to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                Provide and personalize the Moniz budgeting experience
              </li>
              <li>
                Generate spending insights based on your own entries
              </li>
              <li>Authenticate your account securely</li>
            </ul>
            <p className="mt-2">
              We do not sell, rent, or share your personal or financial data
              with advertisers or third parties for marketing purposes.
            </p>
          </Section>

          <Section title="3. Third-party services">
            <p>Moniz uses the following third-party services:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <strong>Supabase</strong> — database hosting and
                authentication. Your data is stored in Supabase-managed
                infrastructure. See{" "}
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-accent underline"
                >
                  Supabase Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong>Vercel</strong> — application hosting. See{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-accent underline"
                >
                  Vercel Privacy Policy
                </a>
                .
              </li>
            </ul>
          </Section>

          <Section title="4. Data security">
            <p>
              All data is transmitted over HTTPS. Passwords are hashed using
              industry-standard algorithms. Database access is protected by
              Row Level Security — each user can only access their own data.
            </p>
          </Section>

          <Section title="5. Data retention">
            <p>
              Your data is retained for as long as your account is active. If
              you delete your account, all associated data (profile, expenses,
              budgets, recurring entries) is permanently removed.
            </p>
          </Section>

          <Section title="6. Your rights">
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Access your data through the app at any time</li>
              <li>Request a copy of your data</li>
              <li>Request deletion of your account and all associated data</li>
              <li>Withdraw consent by deleting your account</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, use the Settings page in the
              app or contact us at the email below.
            </p>
          </Section>

          <Section title="7. Children">
            <p>
              Moniz is intended for users aged 17 and older. We do not
              knowingly collect data from children under 13.
            </p>
          </Section>

          <Section title="8. Changes">
            <p>
              We may update this policy from time to time. Material changes
              will be communicated through the app. Continued use after
              changes constitutes acceptance.
            </p>
          </Section>

          <Section title="9. Contact">
            <p>
              For privacy-related questions, reach us at{" "}
              <span className="text-brand-dark font-medium">
                privacy@moniz.app
              </span>
              .
            </p>
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-brand-dark/5 flex items-center justify-between text-xs text-brand-dark/30">
          <Link href="/" className="hover:text-brand-dark/60 transition-colors">
            Back to home
          </Link>
          <Link
            href="/terms"
            className="hover:text-brand-dark/60 transition-colors"
          >
            Terms of Use
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-base font-semibold text-brand-dark mb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}
