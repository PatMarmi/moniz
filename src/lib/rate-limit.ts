/**
 * Rate limiting for Moniz
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ LAYER 1: Client-side  (`rateLimit()`)                          │
 * │ - In-memory Map, per browser tab, resets on page refresh       │
 * │ - Prevents accidental rapid-fire form submissions              │
 * │ - NOT a security boundary — anyone can bypass by refreshing    │
 * │ - Wired into: every form submit handler in the app             │
 * │                                                                │
 * │ LAYER 2: Server-side  (`productionRateLimit()`)                │
 * │ - Called from Next.js middleware on auth routes                 │
 * │ - Two backends, automatic selection:                           │
 * │                                                                │
 * │   A) Upstash Redis (production)                                │
 * │      - Shared across all Vercel serverless instances            │
 * │      - Activated when both env vars are set:                    │
 * │        UPSTASH_REDIS_REST_URL                                   │
 * │        UPSTASH_REDIS_REST_TOKEN                                 │
 * │      - Uses sliding window via @upstash/ratelimit              │
 * │      - Per-action limits configured in SERVER_LIMITS            │
 * │                                                                │
 * │   B) In-memory Map (dev / fallback)                            │
 * │      - Works within a single server process                    │
 * │      - Resets when the dev server restarts                     │
 * │      - Automatically used when Upstash vars are missing        │
 * │                                                                │
 * │ LAYER 3: Supabase Auth (external, always active)               │
 * │ - Login: 30/hour per IP (configurable in Supabase dashboard)   │
 * │ - Signup: 30/hour per IP                                       │
 * │ - Enforced by Supabase regardless of our code                  │
 * └─────────────────────────────────────────────────────────────────┘
 */

// ═══════════════════════════════════════════════════════════════════
// LAYER 1: Client-side rate limiter
// ═══════════════════════════════════════════════════════════════════

const clientTimestamps: Map<string, number[]> = new Map();

export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60_000
): string | null {
  const now = Date.now();
  const existing = clientTimestamps.get(key) ?? [];
  const recent = existing.filter((t) => now - t < windowMs);

  if (recent.length >= maxAttempts) {
    const waitSec = Math.ceil((windowMs - (now - recent[0])) / 1000);
    return `Too many attempts. Please wait ${waitSec} seconds.`;
  }

  recent.push(now);
  clientTimestamps.set(key, recent);
  return null;
}

/** Client-side limits per action */
export const RATE_LIMITS = {
  login: { max: 5, window: 60_000 },
  signup: { max: 3, window: 60_000 },
  createBudget: { max: 15, window: 60_000 },
  updateBudget: { max: 15, window: 60_000 },
  deleteBudget: { max: 10, window: 60_000 },
  createRecurring: { max: 10, window: 60_000 },
  updateRecurring: { max: 10, window: 60_000 },
  deleteRecurring: { max: 10, window: 60_000 },
  exportData: { max: 3, window: 60_000 },
  deleteAllData: { max: 2, window: 300_000 },
  // Accounts (financial accounts, not auth accounts)
  createAccount: { max: 10, window: 60_000 },
  updateAccount: { max: 10, window: 60_000 },
  deleteAccount: { max: 10, window: 60_000 }, // archive (soft delete)
  // Transactions
  createTransaction: { max: 30, window: 60_000 },
  updateTransaction: { max: 20, window: 60_000 },
  deleteTransaction: { max: 10, window: 60_000 },
} as const;

export function rateLimit(action: keyof typeof RATE_LIMITS): string | null {
  const { max, window } = RATE_LIMITS[action];
  return checkRateLimit(action, max, window);
}

// ═══════════════════════════════════════════════════════════════════
// LAYER 2A: In-memory fallback (dev / single-instance)
// ═══════════════════════════════════════════════════════════════════

interface ServerEntry {
  count: number;
  resetAt: number;
}

const serverStore: Map<string, ServerEntry> = new Map();

let lastCleanup = Date.now();
function cleanupServer() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of serverStore) {
    if (now > entry.resetAt) serverStore.delete(key);
  }
}

function inMemoryRateLimit(
  ip: string,
  action: string,
  maxAttempts: number,
  windowSec: number
): { limited: boolean; retryAfter: number } {
  cleanupServer();

  const key = `${action}:${ip}`;
  const now = Date.now();
  const entry = serverStore.get(key);

  if (!entry || now > entry.resetAt) {
    serverStore.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { limited: false, retryAfter: 0 };
  }

  entry.count++;
  if (entry.count > maxAttempts) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { limited: true, retryAfter };
  }

  return { limited: false, retryAfter: 0 };
}

// ═══════════════════════════════════════════════════════════════════
// LAYER 2B: Upstash Redis (production)
// ═══════════════════════════════════════════════════════════════════

/**
 * Per-action server-side rate limits.
 * These apply in BOTH Upstash and in-memory modes.
 * The key is the `action` string passed to `productionRateLimit()`.
 */
const SERVER_LIMITS: Record<string, { max: number; windowSec: number }> = {
  // Auth — tighter limits, these are the most attacked endpoints
  login:          { max: 10, windowSec: 60 },   // 10 per minute per IP
  signup:         { max: 5,  windowSec: 300 },   // 5 per 5 minutes per IP
};

// Upstash limiter cache: one instance per action (each has its own window)
const upstashLimiters: Map<string, import("@upstash/ratelimit").Ratelimit> = new Map();
let upstashAvailable: boolean | undefined;

/**
 * Check if Upstash is configured. Caches the result after first check.
 */
function isUpstashConfigured(): boolean {
  if (upstashAvailable !== undefined) return upstashAvailable;
  upstashAvailable = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
  return upstashAvailable;
}

/**
 * Get or create an Upstash rate limiter for a specific action.
 * Each action gets its own limiter with its own sliding window config.
 */
async function getUpstashLimiter(
  action: string,
  max: number,
  windowSec: number
): Promise<import("@upstash/ratelimit").Ratelimit | null> {
  if (!isUpstashConfigured()) return null;

  const cached = upstashLimiters.get(action);
  if (cached) return cached;

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, `${windowSec} s`),
      prefix: `moniz:${action}`,
    });

    upstashLimiters.set(action, limiter);
    return limiter;
  } catch (err) {
    // Log once so misconfiguration is visible in server logs
    console.error(`[rate-limit] Failed to create Upstash limiter for "${action}":`, err);
    // Disable Upstash to avoid repeated failures
    upstashAvailable = false;
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Public API for middleware
// ═══════════════════════════════════════════════════════════════════

/**
 * Server-side rate limit check. Call from middleware.
 *
 * Behavior:
 *   - If UPSTASH_REDIS_REST_URL + TOKEN are set → uses Upstash Redis
 *     (shared across all Vercel serverless instances, production-grade)
 *   - Otherwise → uses in-memory Map (fine for dev, single-instance prod)
 *   - If Upstash fails at runtime → falls back to in-memory for that request
 *
 * @param ip     - Client IP address
 * @param action - Action key (must match a key in SERVER_LIMITS)
 * @returns      - { limited, retryAfter } where retryAfter is in seconds
 */
export async function productionRateLimit(
  ip: string,
  action: string
): Promise<{ limited: boolean; retryAfter: number }> {
  const config = SERVER_LIMITS[action];
  if (!config) {
    // Unknown action — don't rate-limit, but log for visibility
    console.warn(`[rate-limit] Unknown action "${action}" — not rate-limited`);
    return { limited: false, retryAfter: 0 };
  }

  // Try Upstash
  if (isUpstashConfigured()) {
    try {
      const limiter = await getUpstashLimiter(action, config.max, config.windowSec);
      if (limiter) {
        const result = await limiter.limit(ip);
        if (!result.success) {
          const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
          return { limited: true, retryAfter: Math.max(retryAfter, 1) };
        }
        return { limited: false, retryAfter: 0 };
      }
    } catch (err) {
      // Upstash call failed at runtime — fall through to in-memory
      console.error(`[rate-limit] Upstash call failed for "${action}":`, err);
    }
  }

  // Fallback: in-memory
  return inMemoryRateLimit(ip, action, config.max, config.windowSec);
}
