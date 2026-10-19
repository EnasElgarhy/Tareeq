import type { CareerBank, CareerFamily, CareerJob } from "@/lib/core-v2/bank";
import { buildSection4, type FamilyView, type MeetCard } from "@/lib/core-v2/section4";
import { findShifts, shiftsToRaise, type Shift } from "@/lib/core-v2/shifts";
import {
  AXES,
  AXIS_CODES,
  CURIOSITY_CODES,
  MOTIVATOR_CODES,
  type AxisCode,
  type AxisSide,
  type AxisZone,
  type CoreResult,
  type CuriosityCode,
  type DirectionClarity,
  type MotivatorCode,
} from "@/lib/core-v2/types";
import type { Locale } from "@/lib/i18n/locale";

/**
 * The payload Kai receives with every CORE conversation (spec §7.1), built
 * like kai_context() in the reference scorer (file 08) with one deliberate
 * difference: every code is replaced by its student-facing report name, in
 * the student's language. The client prompt forbids internal terms, so Kai
 * is never handed a code it could repeat ("RD", "structure", "S").
 *
 * Additive to kai_context(): REPORT.changing_jobs, the shown jobs marked as
 * changing, because the prompt tells Kai how to talk about them.
 */

export type CoreKaiGender = "female" | "male";
export type CoreKaiAgeBand = "13-17" | "18+";
export type CoreEntryPromptId = "S3-KAI-Q" | "S4-KAI-Q" | "S5-KAI-Q";

export const CORE_ENTRY_PROMPT_IDS: readonly CoreEntryPromptId[] = [
  "S3-KAI-Q",
  "S4-KAI-Q",
  "S5-KAI-Q",
];

export interface CoreStudentProfile {
  gender: CoreKaiGender | null;
  ageBand: CoreKaiAgeBand | null;
  academicStage: string | null;
  country: string | null;
}

/** One record_disagreement call, as stored for later conversations. */
export interface CoreDisagreement {
  result: string;
  studentVersion: string;
  reason: string | null;
}

/** Report wording by block ID in one language (file 04). */
export type WordingLookup = (blockId: string) => string | null;

export interface CoreKaiContextInput {
  locale: Locale;
  result: CoreResult;
  /** The career bank in the student's language. */
  bank: CareerBank;
  wording: WordingLookup;
  profile: CoreStudentProfile;
  entryPromptId: CoreEntryPromptId | null;
  /** The previous attempt of the same scoring version, if any. */
  previousResult: CoreResult | null;
  /** Already gated by flags_live: a flag students cannot see is not raised. */
  isAttemptFlagged: boolean;
  priorDisagreements: readonly CoreDisagreement[];
}

export interface CoreKaiAxisReading {
  lean: string;
  counted_option: string;
  count: number;
}

export type CoreKaiShift =
  | { part: string; from: string[]; to: string[] }
  | { part: string; about: string; from: string; to: string };

export interface CoreKaiContext {
  STUDENT_PROFILE: {
    language: Locale;
    gender: CoreKaiGender | null;
    age_band: CoreKaiAgeBand | null;
    academic_stage: string | null;
    country: string | null;
  };
  REPORT: {
    leading_curiosities: string[];
    direction_clarity: string;
    circle_reading: CoreResult["circleReading"];
    curiosity_counts: Record<string, number>;
    axes: Record<string, CoreKaiAxisReading>;
    leading_motivators: string[];
    no_small_set: boolean;
    motivator_counts: Record<string, number>;
    families_shown: string[];
    highlighted_jobs: string[];
    changing_jobs: string[];
  };
  ENTRY_PROMPT: string | null;
  PREVIOUS_SHIFTS: CoreKaiShift[];
  ATTEMPT_FLAGGED: boolean;
  PRIOR_DISAGREEMENTS: Array<{
    result: string;
    student_version: string;
    reason: string | null;
  }>;
  /** Empty at launch (spec §15 default). */
  VERIFIED_LINKS: string[];
  /** Pending from the client (spec §15); Kai uses its built-in fallback. */
  SAFETY_CONTACTS: string[];
}

/** Report bars per axis: the heading and the two ends (file 04, Section 2). */
const AXIS_BARS: Record<AxisCode, string> = {
  structure: "S2-O-BAR1",
  focus: "S2-O-BAR2",
  team: "S2-E-BAR1",
  setting: "S2-E-BAR2",
};

const PART_TITLES = {
  curiosities: "S2-C-TITLE",
  motivators: "S2-R-TITLE",
  2: "S2-O-TITLE",
  4: "S2-E-TITLE",
} as const;

const CLARITY_LABELS: Record<DirectionClarity, string> = {
  clear: "Clear",
  leaning: "Leaning",
  close: "Close",
  open: "Open",
};

function required(wording: WordingLookup, blockId: string): string {
  const text = wording(blockId)?.trim();
  if (!text) throw new Error(`Kai context needs report wording ${blockId}`);
  return text;
}

function curiosityName(wording: WordingLookup, code: CuriosityCode): string {
  return required(wording, `CUR-${code}-NAME`);
}

function motivatorName(wording: WordingLookup, code: MotivatorCode): string {
  return required(wording, `DRV-${code}-NAME`);
}

function sideName(wording: WordingLookup, axis: AxisCode, side: AxisSide): string {
  const end = AXES[axis].sideA === side ? "A" : "B";
  return required(wording, `${AXIS_BARS[axis]}-${end}`);
}

function zoneName(wording: WordingLookup, axis: AxisCode, zone: AxisZone): string {
  if (zone === 2) return required(wording, "BAR-MID");
  return sideName(wording, axis, zone === 1 ? AXES[axis].sideA : AXES[axis].sideB);
}

function axisReadings(
  result: CoreResult,
  wording: WordingLookup,
): Record<string, CoreKaiAxisReading> {
  return Object.fromEntries(
    AXIS_CODES.map((axis) => {
      const { lean, count } = result.axes[axis];
      return [
        required(wording, `${AXIS_BARS[axis]}-HEAD`),
        {
          lean: lean === null ? required(wording, "BAR-MID") : sideName(wording, axis, lean),
          counted_option: sideName(wording, axis, AXES[axis].counted),
          count,
        },
      ];
    }),
  );
}

function shiftView(shift: Shift, wording: WordingLookup): CoreKaiShift {
  switch (shift.kind) {
    case "curiosities":
      return {
        part: required(wording, PART_TITLES.curiosities),
        from: shift.from.map((code) => curiosityName(wording, code)),
        to: shift.to.map((code) => curiosityName(wording, code)),
      };
    case "motivators":
      return {
        part: required(wording, PART_TITLES.motivators),
        from: shift.from.map((code) => motivatorName(wording, code)),
        to: shift.to.map((code) => motivatorName(wording, code)),
      };
    case "axis":
      return {
        part: required(wording, PART_TITLES[AXES[shift.axis].part]),
        about: required(wording, `${AXIS_BARS[shift.axis]}-HEAD`),
        from: zoneName(wording, shift.axis, shift.from),
        to: zoneName(wording, shift.axis, shift.to),
      };
  }
}

function indexBank(bank: CareerBank) {
  const families = new Map<string, CareerFamily>(bank.families.map((f) => [f.id, f]));
  const jobs = new Map<string, CareerJob>(
    bank.families.flatMap((f) => f.jobs.map((job) => [job.id, job] as const)),
  );
  const find = <T>(map: Map<string, T>, id: string): T => {
    const found = map.get(id);
    if (!found) throw new Error(`Career bank has no entry ${id}`);
    return found;
  };
  return {
    familyName: (id: string) => find(families, id).name,
    jobName: (id: string) => find(jobs, id).name,
  };
}

export function buildCoreKaiContext(input: CoreKaiContextInput): CoreKaiContext {
  const { result, wording } = input;
  const lookup = indexBank(input.bank);
  const section4 = buildSection4(result, input.bank);
  // kai_context(): meet cards first, then the full cards of each direction.
  const cards: Array<MeetCard | FamilyView> = [
    ...section4.meetCards,
    ...section4.directions.flatMap((direction) => direction.full),
  ];
  const shownJobs = cards.flatMap((card) => card.jobs);
  const shifts = input.previousResult ? findShifts(input.previousResult, result) : [];

  return {
    STUDENT_PROFILE: {
      language: input.locale,
      gender: input.profile.gender,
      age_band: input.profile.ageBand,
      academic_stage: input.profile.academicStage,
      country: input.profile.country,
    },
    REPORT: {
      leading_curiosities: result.leadingCuriosities.map((code) => curiosityName(wording, code)),
      direction_clarity: CLARITY_LABELS[result.directionClarity],
      circle_reading: result.circleReading,
      curiosity_counts: Object.fromEntries(
        CURIOSITY_CODES.map((code) => [curiosityName(wording, code), result.curiosityCounts[code]]),
      ),
      axes: axisReadings(result, wording),
      leading_motivators: result.leadingMotivators.map((code) => motivatorName(wording, code)),
      no_small_set: result.noSmallSet,
      motivator_counts: Object.fromEntries(
        MOTIVATOR_CODES.map((code) => [motivatorName(wording, code), result.motivatorCounts[code]]),
      ),
      families_shown: cards.map((card) => lookup.familyName(card.familyId)),
      highlighted_jobs: shownJobs
        .filter((job) => job.isHighlighted)
        .map((job) => lookup.jobName(job.jobId)),
      changing_jobs: shownJobs
        .filter((job) => job.isChangingWork)
        .map((job) => lookup.jobName(job.jobId)),
    },
    ENTRY_PROMPT: input.entryPromptId ? required(wording, input.entryPromptId) : null,
    PREVIOUS_SHIFTS: shiftsToRaise(shifts).map((shift) => shiftView(shift, wording)),
    ATTEMPT_FLAGGED: input.isAttemptFlagged,
    PRIOR_DISAGREEMENTS: input.priorDisagreements.map((entry) => ({
      result: entry.result,
      student_version: entry.studentVersion,
      reason: entry.reason,
    })),
    VERIFIED_LINKS: [],
    SAFETY_CONTACTS: [],
  };
}
