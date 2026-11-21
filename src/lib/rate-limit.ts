type RateLimitEntry = { count: number; resetAt: number };

const globalRateLimits = globalThis as typeof globalThis & {
  midaRateLimits?: Map<string, RateLimitEntry>;
};

const buckets = globalRateLimits.midaRateLimits ?? new Map<string, RateLimitEntry>();
if (process.env.NODE_ENV !== "production") globalRateLimits.midaRateLimits = buckets;

export function takeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 10_000) {
    for (const [bucketKey, entry] of buckets) if (entry.resetAt <= now) buckets.delete(bucketKey);
  }

  const current = buckets.get(key);
  const entry = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
  entry.count += 1;
  buckets.set(key, entry);

  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1_000)),
  };
}

export function clearRateLimit(key: string) {
  buckets.delete(key);
}
