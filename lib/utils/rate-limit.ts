/**
 * Simple in-memory rate limiter for AI endpoints.
 * Limits requests per IP within a sliding window.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key (usually IP or route+IP).
 * @param key - Unique identifier (e.g., "ai:127.0.0.1")
 * @param maxRequests - Max requests allowed in window (default: 20)
 * @param windowMs - Time window in ms (default: 60000 = 1 min)
 */
export function checkRateLimit(
  key: string,
  maxRequests = 20,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);

  return {
    allowed: entry.count <= maxRequests,
    remaining,
    resetAt: entry.resetAt,
  };
}
