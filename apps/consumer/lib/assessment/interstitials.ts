/**
 * Assessment pop-ups. The "Did you know?" cards were removed (staging
 * corrections of 6 Nov); only Kai's speed pop-up remains.
 */

import type { ComponentType, SVGProps } from "react";
import { CrossingPathsScene } from "@/components/brand/InterstitialScenes";
import type { LocalizedText } from "@/lib/scoring/types";

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
  title: LocalizedText;
  body: LocalizedText;
  source?: LocalizedText;
  ctaLabel: LocalizedText;
}

/**
 * Kai's one-time "slow down" beat, shown by QuestionScreen after several
 * rushed answers in a row (see lib/assessment/reading-pace.ts). Not part of
 * INTERSTITIALS — it is triggered by pace, not by question position — and
 * it has no narration clip, so it renders without audio controls.
 */
export const PACE_NUDGE: Interstitial = {
  key: "pace-nudge",
  triggerAfterIndex: -1,
  illustration: CrossingPathsScene,
  glow: "lavender",
  audioId: "",
  title: { en: "Easy there, speed racer!", ar: "على مهلك يا بطل السرعة!" },
  body: {
    en: "You're flying through these! But this isn't a race — your CORE report only points the right way if the answers are really you. Take a breath, read each one, and trust your gut.",
    ar: "أنت تطير بين الأسئلة! لكنها ليست سباقاً — تقريرك يشير إلى الاتجاه الصحيح فقط إذا كانت الإجابات تشبهك فعلاً. خذ نفساً، اقرأ كل سؤال، وثق بإحساسك.",
  },
  ctaLabel: { en: "Okay, slowing down", ar: "حسناً، سأتمهّل" },
};

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
