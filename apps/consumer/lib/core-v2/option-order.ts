/**
 * Answer order for one student (spec §3.1, corrections of 6 Nov 2026 §8.4).
 * Options keep their ID, so scoring never depends on where they were shown.
 * The order is seeded by attempt and question: different between students,
 * and the same when a student comes back to a question.
 */

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: small, stable across browsers. */
function random(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffledFor<T>(items: readonly T[], attemptId: string, questionId: string): T[] {
  const next = random(hash(`${attemptId}:${questionId}`));
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}

/** The letter shown on screen for a position: never the option's own ID. */
export const positionLetter = (index: number): string => String.fromCharCode(65 + index);
