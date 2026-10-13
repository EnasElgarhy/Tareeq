import { beforeEach, describe, expect, it } from "vitest";
import type { Question } from "@/lib/scoring";
import {
  MAX_READ_MS,
  MIN_READ_MS,
  MS_PER_WORD,
  RUSH_HINTS,
  RUSH_STREAK_FOR_NUDGE,
  countWords,
  pickRushHintIndex,
  getMinReadMs,
  isRushedTap,
  recordAnswerPace,
  resetAnswerPace,
} from "./reading-pace";

function makeQuestion(title: string, options: string[]): Question {
  return {
    externalId: "Q1",
    pillar: 1,
    position: 1,
    kind: "single",
    title: { en: title, ar: "سؤال قصير" },
    options: options.map((text, index) => ({
      letter: String.fromCharCode(65 + index),
      position: index + 1,
      text: { en: text, ar: "خيار" },
    })),
  } as Question;
}

describe("countWords", () => {
  it("counts whitespace-separated words", () => {
    expect(countWords("Which character's work is most interesting?")).toBe(6);
  });

  it("ignores extra whitespace and empty strings", () => {
    expect(countWords("  two   words \n")).toBe(2);
    expect(countWords("")).toBe(0);
  });

  it("counts Arabic words", () => {
    expect(countWords("احفظ بوصلتك الآن")).toBe(3);
  });
});

describe("getMinReadMs", () => {
  it("scales with the words in the question and its options", () => {
    const question = makeQuestion("one two three four five six", [
      "a b c d e f",
      "g h i j k l",
    ]);
    // 18 words
    expect(getMinReadMs(question, "en")).toBe(18 * MS_PER_WORD);
  });

  it("never drops below the floor for very short questions", () => {
    const question = makeQuestion("Pick", ["Yes", "No"]);
    expect(getMinReadMs(question, "en")).toBe(MIN_READ_MS);
  });

  it("caps long questions so fast readers are not held back", () => {
    const longText = Array.from({ length: 80 }, () => "word").join(" ");
    const question = makeQuestion(longText, [longText, longText]);
    expect(getMinReadMs(question, "en")).toBe(MAX_READ_MS);
  });

  it("measures the text in the active locale", () => {
    const question = makeQuestion(
      Array.from({ length: 30 }, () => "word").join(" "),
      ["option text here", "option text here"],
    );
    // Arabic copy: 2 words title + 1 word per option = 4 words → floor
    expect(getMinReadMs(question, "ar")).toBe(MIN_READ_MS);
  });
});

describe("isRushedTap", () => {
  it("is rushed only when the tap comes before the reading time", () => {
    expect(isRushedTap(500, 2000)).toBe(true);
    expect(isRushedTap(2000, 2000)).toBe(false);
    expect(isRushedTap(3500, 2000)).toBe(false);
  });
});

describe("recordAnswerPace", () => {
  beforeEach(() => {
    resetAnswerPace();
  });

  it("nudges once the rushed streak reaches the threshold", () => {
    const results = Array.from({ length: RUSH_STREAK_FOR_NUDGE }, () =>
      recordAnswerPace(true),
    );
    expect(results.map((r) => r.shouldNudge)).toEqual([
      ...Array.from({ length: RUSH_STREAK_FOR_NUDGE - 1 }, () => false),
      true,
    ]);
    expect(results.at(-1)?.streak).toBe(RUSH_STREAK_FOR_NUDGE);
  });

  it("resets the streak after an unhurried answer", () => {
    recordAnswerPace(true);
    recordAnswerPace(true);
    expect(recordAnswerPace(false)).toEqual({ streak: 0, shouldNudge: false });
    expect(recordAnswerPace(true).streak).toBe(1);
  });

  it("only nudges once per session", () => {
    for (let i = 0; i < RUSH_STREAK_FOR_NUDGE; i += 1) recordAnswerPace(true);
    const later = Array.from({ length: RUSH_STREAK_FOR_NUDGE * 2 }, () =>
      recordAnswerPace(true),
    );
    expect(later.some((r) => r.shouldNudge)).toBe(false);
  });

  it("resets cleanly", () => {
    for (let i = 0; i < RUSH_STREAK_FOR_NUDGE; i += 1) recordAnswerPace(true);
    resetAnswerPace();
    expect(recordAnswerPace(true)).toEqual({ streak: 1, shouldNudge: false });
  });
});

describe("pickRushHintIndex", () => {
  it("returns a valid index when there is no previous hint", () => {
    expect(pickRushHintIndex(null, () => 0)).toBe(0);
    expect(pickRushHintIndex(null, () => 0.9999)).toBe(RUSH_HINTS.length - 1);
  });

  it("never repeats the previous hint", () => {
    for (let previous = 0; previous < RUSH_HINTS.length; previous++) {
      for (const r of [0, 0.25, 0.5, 0.75, 0.9999]) {
        const next = pickRushHintIndex(previous, () => r);
        expect(next).not.toBe(previous);
        expect(next).toBeGreaterThanOrEqual(0);
        expect(next).toBeLessThan(RUSH_HINTS.length);
      }
    }
  });

  it("can reach every other hint", () => {
    const seen = new Set<number>();
    const steps = RUSH_HINTS.length - 1;
    for (let i = 0; i < steps; i++) {
      seen.add(pickRushHintIndex(0, () => (i + 0.5) / steps));
    }
    expect(seen.size).toBe(steps);
    expect(seen.has(0)).toBe(false);
  });

  it("has every headline in English and Arabic, none asking for a second tap", () => {
    for (const hint of RUSH_HINTS) {
      expect(hint.en.trim()).not.toBe("");
      expect(hint.ar.trim()).not.toBe("");
      expect(hint.en).not.toMatch(/tap again/i);
    }
  });
});
