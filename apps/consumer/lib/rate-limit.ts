/**
 * A fixed-window counter per key. In memory and per server instance, so it
 * bounds one caller's burst rather than giving an exact global limit.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return {
    isLimited(key: string, now: number = Date.now()): boolean {
      const entry = hits.get(key);
      if (!entry || now >= entry.resetAt) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
        if (hits.size > 5000) {
          for (const [stale, value] of hits) if (now >= value.resetAt) hits.delete(stale);
        }
        return false;
      }
      entry.count += 1;
      return entry.count > limit;
    },
  };
}
