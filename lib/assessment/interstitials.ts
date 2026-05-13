/**
 * "Did you know" interstitials — pause-beat content shown between
 * every 10 questions to break up the assessment rhythm.
 *
 * Voice rules (from design-system.md §10):
 *   • Confident, energetic, grounded
 *   • One title (sentence case), one short paragraph (≤ 2 sentences)
 *   • Curly quotes, `·` separators, no exclamation marks
 */

import type { ComponentType, SVGProps } from "react";
import {
  CommunityScene,
  CompassScene,
  PersonaScene,
} from "@/components/brand/Illustrations";

export type InterstitialIllustration = ComponentType<
  SVGProps<SVGSVGElement> & {
    size?: number | string;
    tone?: "cream" | "ink";
  }
>;

export interface Interstitial {
  /** Stable key — used for "already-seen" persistence */
  key: string;
  /** 0-indexed question after which this fires
   *  (i.e. `triggerAfterIndex = 9` fires after answering Q10) */
  triggerAfterIndex: number;
  illustration: InterstitialIllustration;
  /** Optional accent for the soft glow behind the illustration */
  glow: "coral" | "cyan" | "lavender";
  title: string;
  body: string;
  ctaLabel: string;
}

export const INTERSTITIALS: ReadonlyArray<Interstitial> = [
  {
    key: "after-10",
    triggerAfterIndex: 9,
    illustration: CompassScene,
    glow: "coral",
    title: "Curiosity has a shape",
    body: "People with similar curiosity patterns end up clustering in the same kinds of work — even across countries. Your Compass is already starting to draw yours.",
    ctaLabel: "Got it",
  },
  {
    key: "after-20",
    triggerAfterIndex: 19,
    illustration: PersonaScene,
    glow: "lavender",
    title: "Most students switch paths twice",
    body: "Across MENA, students change direction at least twice before graduation. Knowing what fits earlier saves years of doubt — and that’s what the next stretch sharpens.",
    ctaLabel: "Keep going",
  },
  {
    key: "after-30",
    triggerAfterIndex: 29,
    illustration: PersonaScene,
    glow: "cyan",
    title: "How matters as much as what",
    body: "Two people in the same job can have completely different experiences. These next questions capture how you actually want to work — not just what you can do.",
    ctaLabel: "Makes sense",
  },
  {
    key: "after-40",
    triggerAfterIndex: 39,
    illustration: CommunityScene,
    glow: "coral",
    title: "Almost at your Compass",
    body: "The last few questions sharpen your environment fit — the difference between a job you tolerate and a path you actually want to walk.",
    ctaLabel: "Finish strong",
  },
];

/** Find the interstitial that should fire after the given question index. */
export function findInterstitialFor(
  questionIndex: number,
): Interstitial | null {
  return (
    INTERSTITIALS.find((i) => i.triggerAfterIndex === questionIndex) ?? null
  );
}

// ---------- Persistence helpers ----------

const STORAGE_KEY = "tareeq:interstitials-seen";

function readSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function writeSeen(seen: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
  } catch {
    // ignore quota errors
  }
}

export function hasSeenInterstitial(key: string): boolean {
  return readSeen().has(key);
}

export function markInterstitialSeen(key: string): void {
  const seen = readSeen();
  seen.add(key);
  writeSeen(seen);
}

export function resetInterstitialsSeen(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
