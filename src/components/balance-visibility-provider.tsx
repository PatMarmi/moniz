"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface Ctx {
  /** True when balances should be masked across the app */
  hidden: boolean;
  /** Toggle the hidden state (persists to localStorage) */
  toggle: () => void;
}

const STORAGE_KEY = "moniz:balance-hidden";

const BalanceVisibilityContext = createContext<Ctx>({
  hidden: false,
  toggle: () => {},
});

/**
 * Wraps the app so any component can read or toggle the global
 * "hide balances" preference. Persists to localStorage so the
 * preference survives reloads.
 */
export function BalanceVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Always start hidden=false on the server to avoid hydration mismatch.
  // The actual preference is read from localStorage in an effect.
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "1") setHidden(true);
    } catch {
      // localStorage unavailable (private mode, etc.) — fall back to visible
    }
  }, []);

  const toggle = useCallback(() => {
    setHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  return (
    <BalanceVisibilityContext.Provider value={{ hidden, toggle }}>
      {children}
    </BalanceVisibilityContext.Provider>
  );
}

export function useBalanceVisibility() {
  return useContext(BalanceVisibilityContext);
}
