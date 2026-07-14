import type { KaiMemoryCategory, KaiMemoryUpdateCandidate } from "@/lib/kai/memory/memory-types";

const CATEGORIES: ReadonlySet<KaiMemoryCategory> = new Set([
  "career_interest",
  "learning_style",
  "goal",
  "question_topic",
  "conversation_preference",
  "assessment_history",
  "recommendation",
]);

const MAX_CANDIDATES_PER_TURN = 10;
const MAX_VALUE_LENGTH = 80;

const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
// A long run of digits (phone numbers, IDs) — memory values should be
// short structured labels ("Study abroad"), never numbers like this.
const LONG_DIGIT_RUN = /\d{6,}/;

/**
 * Validates Gemini's proposed `memoryUpdates` from a single turn — same
 * defensive, never-trust-the-shape discipline as chat-server.ts's
 * normalizeBlocks. A malformed or hallucinated category/value is
 * dropped, not stored. Caps how much one turn can propose remembering
 * so a single reply can't flood the profile.
 *
 * Content-level PII guard: even though the *shape* here is clean
 * (category + value strings), nothing stops a model from writing an
 * email or phone number into `value` itself. Reject those outright
 * rather than trusting Gemini to have followed the system prompt.
 */
export function buildMemoryCandidates(value: unknown): KaiMemoryUpdateCandidate[] {
  if (!Array.isArray(value)) return [];
  const candidates: KaiMemoryUpdateCandidate[] = [];

  for (const entry of value) {
    if (candidates.length >= MAX_CANDIDATES_PER_TURN) break;
    if (typeof entry !== "object" || entry === null) continue;

    const raw = entry as Record<string, unknown>;
    if (typeof raw.category !== "string" || !CATEGORIES.has(raw.category as KaiMemoryCategory)) continue;
    if (typeof raw.value !== "string") continue;

    const trimmed = raw.value.trim();
    if (!trimmed || trimmed.length > MAX_VALUE_LENGTH) continue;
    if (EMAIL_PATTERN.test(trimmed) || LONG_DIGIT_RUN.test(trimmed)) continue;

    candidates.push({ category: raw.category as KaiMemoryCategory, value: trimmed });
  }

  return candidates;
}
