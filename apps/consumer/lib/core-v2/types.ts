/**
 * CORE model, scoring 2.0 (question set 5.1). Source of truth:
 * CORE_01_Developer_Specification_V1 §4–5 and the reference scorer (file 08).
 * Kept separate from lib/scoring, which still scores legacy v4 attempts (1.x).
 */

export const SCORING_VERSION = "2.0";
export const QUESTION_SET_VERSION = "5.1";

/** Fixed order = position on the interest circle. Ties always break in this order. */
export const CURIOSITY_CODES = [
  "RD",
  "IE",
  "PW",
  "EI",
  "PE",
  "TS",
  "IR",
  "AE",
] as const;
export type CuriosityCode = (typeof CURIOSITY_CODES)[number];

/** Fixed display order. Leading and other motivators are always shown in this order. */
export const MOTIVATOR_CODES = [
  "REC",
  "IMP",
  "MAS",
  "AUT",
  "SEC",
  "INC",
  "FAM",
  "LIF",
] as const;
export type MotivatorCode = (typeof MOTIVATOR_CODES)[number];

export const AXIS_CODES = ["structure", "focus", "team", "setting"] as const;
export type AxisCode = (typeof AXIS_CODES)[number];

export type AxisSide = "S" | "F" | "D" | "B" | "T" | "O" | "ST" | "CH";

export interface AxisDefinition {
  part: 2 | 4;
  /** The option whose answers are counted (spec §4.3). */
  counted: AxisSide;
  /** First zone of the bar. */
  sideA: AxisSide;
  /** Last zone of the bar. */
  sideB: AxisSide;
}

export const AXES: Record<AxisCode, AxisDefinition> = {
  structure: { part: 2, counted: "S", sideA: "S", sideB: "F" },
  focus: { part: 2, counted: "D", sideA: "D", sideB: "B" },
  team: { part: 4, counted: "T", sideA: "T", sideB: "O" },
  setting: { part: 4, counted: "CH", sideA: "ST", sideB: "CH" },
};

export const PART_QUESTION_COUNTS = { 1: 16, 2: 8, 3: 14, 4: 8 } as const;
export const QUESTIONS_PER_AXIS = 4;

export type DirectionClarity = "clear" | "leaning" | "close" | "open";
export type CircleReading = "single" | "coherent" | "diverse";
/** 1 = side A, 2 = evenly split ("A mix of both"), 3 = side B. */
export type AxisZone = 1 | 2 | 3;

export interface AxisAnswer {
  axis: AxisCode;
  side: AxisSide;
}

/** A complete attempt, reduced to what each chosen option scores toward. */
export interface CoreAnswers {
  curiosities: readonly CuriosityCode[];
  motivators: readonly MotivatorCode[];
  axes: readonly AxisAnswer[];
}

export interface AxisResult {
  /** Answers for the counted option, 0–4. */
  count: number;
  zone: AxisZone;
  /** The side leaned toward, or null when evenly split. */
  lean: AxisSide | null;
}

export interface CoreResult {
  scoringVersion: typeof SCORING_VERSION;
  curiosityCounts: Record<CuriosityCode, number>;
  /** By score, highest first; ties in fixed order. */
  leadingCuriosities: CuriosityCode[];
  directionClarity: DirectionClarity;
  margin: number;
  circleReading: CircleReading;
  motivatorCounts: Record<MotivatorCode, number>;
  /** Fixed display order. Empty when no small set stood out. */
  leadingMotivators: MotivatorCode[];
  noSmallSet: boolean;
  /** Leading motivators by score (ties fixed order), at most two. Next-steps questions only. */
  topTwoMotivators: MotivatorCode[];
  axes: Record<AxisCode, AxisResult>;
  /** L / 8 × 100. For Kai only; never shown to students. */
  leadingShare: number;
}
