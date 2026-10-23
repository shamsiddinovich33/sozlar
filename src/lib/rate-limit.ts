import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  /** Unix ms timestamp when the window resets */
  reset: number;
};

export type RateLimiter = {
  limit: (key: string) => Promise<RateLimitResult>;
};

/** Fixed-window in-memory limiter. Used in development or when Upstash is not configured. */
export function createMemoryLimiter(
  max: number,
  windowMs: number,
  now: () => number = Date.now,
): RateLimiter {
  const hits = new Map<string, { count: number; reset: number }>();

  return {
    async limit(key) {
      const t = now();
      const entry = hits.get(key);

      if (!entry || entry.reset <= t) {
        const reset = t + windowMs;
        hits.set(key, { count: 1, reset });
        return { success: true, remaining: max - 1, reset };
      }

      entry.count += 1;
      return {
        success: entry.count <= max,
        remaining: Math.max(0, max - entry.count),
        reset: entry.reset,
      };
    },
  };
}

function createUpstashLimiter(max: number, windowSeconds: number, prefix: string): RateLimiter {
  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(max, `${windowSeconds} s`),
    prefix: `sozlik:${prefix}`,
  });
  return {
    async limit(key) {
      const { success, remaining, reset } = await ratelimit.limit(key);
      return { success, remaining, reset };
    },
  };
}

function createLimiter(max: number, windowSeconds: number, prefix: string): RateLimiter {
  const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
  return hasUpstash
    ? createUpstashLimiter(max, windowSeconds, prefix)
    : createMemoryLimiter(max, windowSeconds * 1000);
}

/** 10 login attempts per minute per IP. */
export const loginLimiter = createLimiter(10, 60, "login");
/** 5 registrations per 10 minutes per IP. */
export const registerLimiter = createLimiter(5, 600, "register");

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}

/** 10 set-password attempts per 10 minutes per user and set. */
export const setUnlockLimiter = createLimiter(10, 600, "set-unlock");

/** 5 password changes / account deletions per 10 minutes per user. */
export const accountLimiter = createLimiter(5, 600, "account");

/** Password reset requests: 5 per 15 minutes per IP and 3 per hour per email address. */
export const resetRequestLimiter = createLimiter(5, 900, "reset-request");
export const resetEmailLimiter = createLimiter(3, 3600, "reset-email");
/** Attempts to use a reset link: 10 per 15 minutes per IP. */
export const resetSubmitLimiter = createLimiter(10, 900, "reset-submit");
