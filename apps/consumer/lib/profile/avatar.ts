/**
 * Generated fallback avatars — used wherever a person doesn't have an
 * uploaded photo (registration doesn't support photo upload yet). Once
 * it does, callers just pass a `photoUrl` and skip this entirely.
 *
 * Deliberately not initials-in-a-circle: an abstract, illustrated mark
 * (see components/brand/AvatarMarks.tsx) reads as more intentional than
 * two letters. Mark and background are picked from independent hashes
 * of the same seed, so the pairing varies across users while staying
 * stable for the same person across sessions.
 */

function hashSeed(seed: string, salt: string): number {
  let hash = 0;
  const input = salt + seed;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Which symbolic mark (by index into AVATAR_MARKS) this seed resolves to. */
export function pickAvatarMarkIndex(seed: string, markCount: number): number {
  if (markCount <= 0) return 0;
  return hashSeed(seed, "mark") % markCount;
}

const AVATAR_BACKGROUNDS = [
  "linear-gradient(135deg, rgba(255,107,61,0.16), rgba(255,165,61,0.07))",
  "linear-gradient(135deg, rgba(110,72,228,0.14), rgba(157,127,240,0.06))",
  "linear-gradient(135deg, rgba(64,196,164,0.15), rgba(111,224,192,0.06))",
  "linear-gradient(135deg, rgba(244,198,96,0.18), rgba(253,231,168,0.07))",
  "linear-gradient(135deg, rgba(255,61,131,0.13), rgba(255,107,61,0.06))",
] as const;

/** A soft, ink-friendly backdrop so the mark's dark linework stays
 * legible — deliberately light, unlike a bold saturated fill. */
export function pickAvatarBackground(seed: string): string {
  return AVATAR_BACKGROUNDS[hashSeed(seed, "bg") % AVATAR_BACKGROUNDS.length];
}
