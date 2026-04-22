import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { BalanceVisibilityProvider } from "@/components/balance-visibility-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Moniz — Student Money, Simplified",
  description:
    "The simple finance app that helps students track spending, budget smarter, and build better money habits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-brand-beige text-brand-dark">
        <BalanceVisibilityProvider>
          <AuthProvider>{children}</AuthProvider>
        </BalanceVisibilityProvider>
      </body>
    </html>
  );
}
