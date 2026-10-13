import type { Question } from "@/lib/scoring";
import type { LocalizedText } from "@/lib/scoring/types";
import { getLocalizedText } from "./questions";

/**
 * Reading-pace guard for the assessment. A tap that lands before someone
 * could plausibly have read the question and its options is treated as
 * "rushed": the answer is selected but not submitted until it is confirmed
 * with a second tap. Several rushed answers in a row trigger a one-time
 * nudge from Kai. Thresholds are deliberately lenient (skim speed, capped)
 * so people reading at a normal pace never notice the guard.
 */

/** ~500 wpm — skimming speed, well above normal reading (~250 wpm). */
export const MS_PER_WORD = 120;
/** Floor for very short questions (e.g. "Yes / No"). */
export const MIN_READ_MS = 1200;
/** Cap so long questions never hold a fast reader back for long. */
export const MAX_READ_MS = 4000;
/** Consecutive rushed answers before Kai's nudge appears. */
export const RUSH_STREAK_FOR_NUDGE = 3;
/** Confirm sheet buttons stay inert this long so a reflexive double-tap
 * can't confirm a rushed answer. */
export const CONFIRM_ARM_MS = 600;

/**
 * Attention-grabbing headlines for the rush heads-up sheet. The sheet's
 * body carries the actual message (rushing makes the result less
 * accurate); these just have to stop the thumb. A random one is picked
 * every time, never the same twice in a row.
 */
export const RUSH_HINTS: ReadonlyArray<LocalizedText> = [
  { en: "Whoa, speed reader! 🏎️", ar: "على مهلك يا بطل! 🏎️" },
  { en: "Hold up, that was lightning fast ⚡", ar: "لحظة! كان ذلك أسرع من البرق ⚡" },
  { en: "Kai blinked and missed it 👀", ar: "رمشت كاي وفاتها كل شيء 👀" },
  { en: "Speedrun detected 🚨", ar: "رصدنا سباق سرعة 🚨" },
  { en: "Easy there, champ 🐢", ar: "شوي شوي يا بطل 🐢" },
  { en: "No prize for finishing first 🏁", ar: "لا جائزة لمن ينهي أولاً 🏁" },
  { en: "Did you even blink? 😮", ar: "هل رمشت حتى؟ 😮" },
  { en: "Your Compass felt a breeze 🌪️", ar: "بوصلتك شعرت بنسمة هواء 🌪️" },
];

/**
 * Random RUSH_HINTS index that differs from `previous` so the headline
 * never repeats back to back. `random` is injectable for tests.
 */
export function pickRushHintIndex(
  previous: number | null,
  random: () => number = Math.random,
): number {
  const size = RUSH_HINTS.length;
  if (size <= 1) return 0;
  if (previous === null || previous < 0 || previous >= size) {
    return Math.floor(random() * size) % size;
  }
  // Pick among the other size-1 lines, then skip over `previous`.
  const offset = Math.floor(random() * (size - 1)) % (size - 1);
  return offset >= previous ? offset + 1 : offset;
}

const STORAGE_KEY = "tareeq.question.pace.v1";

interface PaceState {
  streak: number;
  nudged: boolean;
}

export interface PaceResult {
  streak: number;
  shouldNudge: boolean;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/** Shortest believable time to read this question and all its options. */
export function getMinReadMs(question: Question, locale: string): number {
  const words =
    countWords(getLocalizedText(question.title, locale)) +
    question.options.reduce(
      (sum, option) => sum + countWords(getLocalizedText(option.text, locale)),
      0,
    );
  return Math.min(MAX_READ_MS, Math.max(MIN_READ_MS, words * MS_PER_WORD));
}

export function isRushedTap(elapsedMs: number, minReadMs: number): boolean {
  return elapsedMs < minReadMs;
}

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.sessionStorage !== "undefined"
  );
}

function readState(): PaceState {
  const empty: PaceState = { streak: 0, nudged: false };
  if (!isBrowser()) return empty;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (typeof parsed !== "object" || parsed === null) return empty;
    const candidate = parsed as Partial<PaceState>;
    return {
      streak: typeof candidate.streak === "number" ? candidate.streak : 0,
      nudged: candidate.nudged === true,
    };
  } catch {
    return empty;
  }
}

function writeState(state: PaceState): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full/unavailable — the streak just won't persist across
    // questions; the per-question confirm step still works.
  }
}

/**
 * Records whether an answer was rushed and reports whether Kai's nudge
 * should show now. Session-scoped (each question is its own route, so the
 * streak must outlive the component); the nudge fires at most once per
 * session so it never turns into nagging.
 */
export function recordAnswerPace(rushed: boolean): PaceResult {
  const previous = readState();
  const streak = rushed ? previous.streak + 1 : 0;
  const shouldNudge =
    rushed && !previous.nudged && streak >= RUSH_STREAK_FOR_NUDGE;
  writeState({ streak, nudged: previous.nudged || shouldNudge });
  return { streak, shouldNudge };
}

/** Test/teardown hook. */
export function resetAnswerPace(): void {
  if (isBrowser()) window.sessionStorage.removeItem(STORAGE_KEY);
}
