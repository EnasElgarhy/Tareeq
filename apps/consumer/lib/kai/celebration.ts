const CELEBRATION_SEEN_KEY_PREFIX = "tareeq.kai.seenCelebration.";

/**
 * Per-module completion celebration — generalized from a CORE-only flag
 * so any module firing `CelebrationBurst` (lib/kai/celebration.ts) gets
 * its own one-time "seen" state. Only CORE Compass can actually complete
 * today (the other modules are visible-but-locked placeholders — see
 * lib/profile/journey.ts), but the mechanism itself is ready for when
 * they ship without needing another rewrite.
 */
export function hasSeenModuleCelebration(moduleId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(CELEBRATION_SEEN_KEY_PREFIX + moduleId) === "true";
  } catch {
    return true;
  }
}

export function markModuleCelebrationSeen(moduleId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CELEBRATION_SEEN_KEY_PREFIX + moduleId, "true");
  } catch {
    // storage unavailable (private mode) — celebration may replay once more, harmless
  }
}
