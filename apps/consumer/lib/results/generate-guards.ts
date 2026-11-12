/**
 * Input limits for /api/results/generate, which spends AI credits on every
 * call (security review, 12 Nov 2026). The same limits as the admin copy.
 */
export const MAX_ANSWERS = 100;
export const MAX_ANSWER_LENGTH = 500;
const MAX_NAME_LENGTH = 80;

/** A non-empty record of strings, at most MAX_ANSWERS, none too long. */
export function isBoundedAnswerRecord(value: unknown): value is Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  if (entries.length === 0 || entries.length > MAX_ANSWERS) return false;
  return entries.every(
    ([, entry]) => typeof entry === "string" && entry.length <= MAX_ANSWER_LENGTH,
  );
}

/** Trim, cap and strip prompt-like markers from the learner's name. */
export function sanitizeName(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const clean = raw.trim().slice(0, MAX_NAME_LENGTH).replace(/[<>{}[\]]/g, "").trim();
  return clean || undefined;
}

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
