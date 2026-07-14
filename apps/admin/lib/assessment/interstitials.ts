/**
 * "Did you know" interstitials — pause-beat content shown between
 * every 10 questions to break up the assessment rhythm.
 *
 * Content follows the May 21 Wahba fun-facts spec: surprising,
 * source-backed career data with a short personal implication.
 */

import type { ComponentType, SVGProps } from "react";
import {
  CrossingPathsScene,
  DualWaysScene,
  PatternEmergingScene,
  PeakReachedScene,
} from "@/components/brand/InterstitialScenes";
import { KAI_SECTION_ENCOURAGEMENTS } from "@/lib/audio/kai-narration";

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
  audioId: string;
  title: string;
  body: string;
  source?: string;
  ctaLabel: string;
}

export const INTERSTITIALS: ReadonlyArray<Interstitial> = [
  {
    key: "after-10-gcc-entrepreneurship",
    triggerAfterIndex: 9,
    illustration: PatternEmergingScene,
    glow: "coral",
    audioId: KAI_SECTION_ENCOURAGEMENTS[0].audioId,
    title: "Did you know?",
    body: "55% of GCC youth plan to start their own business in the next 5 years. The Middle East has the highest entrepreneurship ambition globally.",
    source: "2020 Arab Youth Survey",
    ctaLabel: "Got it",
  },
  {
    key: "after-10-mena-workforce",
    triggerAfterIndex: 9,
    illustration: PatternEmergingScene,
    glow: "coral",
    audioId: KAI_SECTION_ENCOURAGEMENTS[0].audioId,
    title: "Did you know?",
    body: "The MENA region will add 127 million new workers by 2035. Your generation is literally shaping the future of work in the region.",
    source: "World Bank 2024",
    ctaLabel: "Got it",
  },
  {
    key: "after-10-major-pivots",
    triggerAfterIndex: 9,
    illustration: PatternEmergingScene,
    glow: "coral",
    audioId: KAI_SECTION_ENCOURAGEMENTS[0].audioId,
    title: "Did you know?",
    body: "Only 27% of college graduates end up working in a field directly related to their major. Your first job does not define your whole career.",
    source: "Federal Reserve Bank of New York",
    ctaLabel: "Got it",
  },
  {
    key: "after-20-art-history",
    triggerAfterIndex: 19,
    illustration: CrossingPathsScene,
    glow: "lavender",
    audioId: KAI_SECTION_ENCOURAGEMENTS[1].audioId,
    title: "Did you know?",
    body: "Art History majors have a lower unemployment rate than Computer Science majors in one major dataset. The job market is not always what people expect.",
    source: "Federal Reserve Bank of New York, 2023",
    ctaLabel: "Keep going",
  },
  {
    key: "after-20-automation",
    triggerAfterIndex: 19,
    illustration: CrossingPathsScene,
    glow: "lavender",
    audioId: KAI_SECTION_ENCOURAGEMENTS[1].audioId,
    title: "Did you know?",
    body: "Automation will remove many routine jobs, but it is also creating new work for people who can use data, tools, and AI well.",
    source: "McKinsey Global Institute",
    ctaLabel: "Keep going",
  },
  {
    key: "after-20-nursing",
    triggerAfterIndex: 19,
    illustration: CrossingPathsScene,
    glow: "lavender",
    audioId: KAI_SECTION_ENCOURAGEMENTS[1].audioId,
    title: "Did you know?",
    body: "Nursing has one of the lowest unemployment rates of any major. Healthcare careers can stay resilient even when the economy shifts.",
    source: "Federal Reserve Bank of New York",
    ctaLabel: "Keep going",
  },
  {
    key: "after-30-gen-z-leadership",
    triggerAfterIndex: 29,
    illustration: DualWaysScene,
    glow: "cyan",
    audioId: KAI_SECTION_ENCOURAGEMENTS[2].audioId,
    title: "Did you know?",
    body: "Only 6% of Gen Z say reaching senior leadership is their top career goal. Learning, balance, and purpose are becoming serious career priorities.",
    source: "Deloitte Middle East Gen Z Study 2025",
    ctaLabel: "Makes sense",
  },
  {
    key: "after-30-career-changes",
    triggerAfterIndex: 29,
    illustration: DualWaysScene,
    glow: "cyan",
    audioId: KAI_SECTION_ENCOURAGEMENTS[2].audioId,
    title: "Did you know?",
    body: "The average person changes careers several times in their lifetime. Choosing your first path does not lock you in forever.",
    source: "Bureau of Labor Statistics",
    ctaLabel: "Makes sense",
  },
  {
    key: "after-30-soft-skills",
    triggerAfterIndex: 29,
    illustration: DualWaysScene,
    glow: "cyan",
    audioId: KAI_SECTION_ENCOURAGEMENTS[2].audioId,
    title: "Did you know?",
    body: "Many Gen Z and Millennial workers say soft skills matter more in the age of AI. Being human is still a competitive advantage.",
    source: "Deloitte Global Gen Z Survey 2025",
    ctaLabel: "Makes sense",
  },
  {
    key: "after-40-future-jobs",
    triggerAfterIndex: 39,
    illustration: PeakReachedScene,
    glow: "coral",
    audioId: KAI_SECTION_ENCOURAGEMENTS[3].audioId,
    title: "Did you know?",
    body: "By 2030, millions of jobs will be displaced, but even more new roles are expected to emerge. Change creates risk, but it also creates openings.",
    source: "World Economic Forum Future of Jobs Report",
    ctaLabel: "Finish strong",
  },
];

/** Find the interstitial that should fire after the given question index. */
export function findInterstitialFor(
  questionIndex: number,
): Interstitial | null {
  const candidates = INTERSTITIALS.filter(
    (i) => i.triggerAfterIndex === questionIndex,
  );
  if (candidates.length === 0) return null;

  const seen = readSeen();
  const unseen = candidates.filter((candidate) => !seen.has(candidate.key));
  const pool = unseen.length > 0 ? unseen : candidates;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
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
