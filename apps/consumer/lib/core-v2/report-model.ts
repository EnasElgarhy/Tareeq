import type { Locale } from "@/lib/i18n/locale";
import type { CareerBank, CareerFamily, CareerJob } from "./bank";
import {
  clarityBlocks,
  planNextSteps,
  planSections,
  type NextStepsPlan,
  type SectionId,
} from "./report-plan";
import { buildSection4, type Section4 } from "./section4";
import { MOTIVATOR_CODES, type CoreResult } from "./types";

/**
 * Everything the report screens need, assembled once from a scored result
 * and the career bank (spec §6). Components read names and wording from
 * here and from the wording map; they make no decisions of their own.
 */

/** Names starting with these keep their first letter inside a sentence (spec §6.5). */
const KEEP_CASE_PREFIXES = ["AI", "UX", "IT", "Arabic", "3D", "E-"];
/** Letters whose spoken name starts with a vowel sound, for acronyms (an AI, an IT, a UX). */
const VOWEL_SOUND_LETTERS = new Set("AEFHILMNORSX");

function keepsCase(name: string): boolean {
  return KEEP_CASE_PREFIXES.some((prefix) => name.startsWith(prefix));
}

/** A job or family name as it reads inside an English sentence. */
export function inlineName(name: string): string {
  if (keepsCase(name) || name.length === 0) return name;
  return name[0].toLowerCase() + name.slice(1);
}

/** "a pharmacist", "an occupational therapist", "a UX designer". To verify against file 08. */
export function withArticle(name: string): string {
  const inline = inlineName(name);
  const first = inline[0] ?? "";
  const isVowelSound = keepsCase(name)
    ? VOWEL_SOUND_LETTERS.has(first.toUpperCase())
    : "aeiou".includes(first.toLowerCase());
  return `${isVowelSound ? "an" : "a"} ${inline}`;
}

export interface ReportModel {
  result: CoreResult;
  section4: Section4;
  nextSteps: NextStepsPlan;
  sections: SectionId[];
  clarity: string[];
  /** Motivators not leading (all eight when no small set), in fixed order. */
  otherMotivators: string[];
  /** Fills [job 1] and [job 2] in S5-WATCH: in English, article + name as it reads mid-sentence. */
  watchFills: { "job 1": string; "job 2": string };
  /** Fills [family] in S5-TALK. */
  talkFill: string;
  /** Ordered block IDs shown, for core_report_renders (spec §6.8). */
  blocksShown: string[];
  family(id: string): CareerFamily;
  job(id: string): CareerJob;
}

function indexBank(bank: CareerBank) {
  const families = new Map(bank.families.map((family) => [family.id, family]));
  const jobs = new Map(
    bank.families.flatMap((family) => family.jobs.map((job) => [job.id, job] as const)),
  );
  return {
    family(id: string): CareerFamily {
      const found = families.get(id);
      if (!found) throw new Error(`Career bank has no family ${id}`);
      return found;
    },
    job(id: string): CareerJob {
      const found = jobs.get(id);
      if (!found) throw new Error(`Career bank has no job ${id}`);
      return found;
    },
  };
}

function sectionBlocks(
  section: SectionId,
  result: CoreResult,
  section4: Section4,
  nextSteps: NextStepsPlan,
  clarity: string[],
): string[] {
  const curiosityBlocks = (code: string) => [`CUR-${code}-NAME`, `CUR-${code}-PULL`];
  switch (section) {
    case "FLAG-NOTE":
      return ["FLAG-NOTE"];
    case "S1":
      return [
        "S1-TITLE",
        ...["B1", "B2", "B3", "B4", "B5", "B6"].map((b) => `S1-${b}`),
        "S1-KEY-TITLE",
        ...["C", "O", "R", "E"].map((letter) => `S1-KEY-${letter}`),
      ];
    case "S2":
      return [
        "S2-TITLE",
        "S2-C-TITLE",
        ...result.leadingCuriosities.flatMap(curiosityBlocks),
        ...clarity,
        "S2-O-TITLE",
        "S2-O-BAR1-HEAD",
        "S2-O-BAR2-HEAD",
        "BAR-MID",
        "P2-QUALIFIER",
        "S2-R-TITLE",
        ...(result.noSmallSet ? ["S2-R-NOSET"] : ["S2-R-OTHERS"]),
        ...MOTIVATOR_CODES.map((code) => `DRV-${code}-NAME`),
        "S2-E-TITLE",
        "S2-E-LINE",
        "S2-E-BAR1-HEAD",
        "S2-E-BAR2-HEAD",
        "S2-NEXT",
      ];
    case "S3":
      return [
        "S3-TITLE",
        "S3-INTRO",
        ...result.leadingCuriosities.flatMap((code) => [
          `S3-${code}-DESC`,
          `S3-${code}-EX1`,
          `S3-${code}-EX2`,
          `S3-${code}-EX3`,
        ]),
        "S3-NOTICE-LABEL",
        "S3-KAI-Q",
      ];
    case "S4":
      return [
        "S4-TITLE",
        "S4-INTRO",
        ...(section4.noMatch ? ["S4-NOMATCH"] : []),
        ...(section4.meetCards.length > 0 ? ["S4-MEET-TITLE"] : []),
        ...section4.meetCards.map((card) => card.line),
        ...(section4.alsoCuriosities.length > 0 ? ["S4-ALSO"] : []),
        ...([...section4.meetCards, ...section4.directions.flatMap((d) => d.full)].some(
          (card) => card.hasChangingNote,
        )
          ? ["S4-CHANGING"]
          : []),
        ...(section4.directions.some((d) => d.full.some((f) => f.isClosest))
          ? ["S4-CLOSEST"]
          : []),
        "S4-STUDY-LABEL",
        "S4-CHECK-LABEL",
        ...section4.directions.flatMap((d) => d.full.map((f) => f.worthChecking)),
        ...(section4.directions.some((d) => d.more.length > 0) ? ["S4-MORE-LABEL"] : []),
        "S4-REQ-NOTE",
        "P2-QUALIFIER",
        "S4-KAI-Q",
      ];
    case "S5":
      return [
        "S5-TITLE",
        "S5-INTRO",
        "S5-WATCH",
        "S5-TRY-LABEL",
        ...nextSteps.tryBlocks,
        "S5-TALK",
        ...nextSteps.talkBlocks,
        "S5-ASK",
        ...nextSteps.askBlocks,
        "S5-KAI-Q",
      ];
    case "S6":
      return ["S6-TITLE", "S6-B1", "S6-B2", "S6-B3", "S6-B4", "S6-B5"];
    case "S7":
      return [
        "S7-TITLE",
        "S7-IS-LABEL",
        "S7-IS-1",
        "S7-IS-2",
        "S7-ISNT-LABEL",
        "S7-ISNT-1",
        "S7-ISNT-2",
        "S7-ISNT-3",
        "S7-ISNT-4",
        "S7-CREDIT",
      ];
  }
}

export function buildReportModel(
  result: CoreResult,
  bank: CareerBank,
  flags: { isFlagged: boolean; isFlagsLive: boolean },
  locale: Locale = "en",
): ReportModel {
  const lookup = indexBank(bank);
  const section4 = buildSection4(result, bank);
  const nextSteps = planNextSteps(result, section4, (id) => lookup.job(id).nameEn);
  // Arabic names read as they are; English takes an article mid-sentence.
  const watchName = (id: string) =>
    locale === "ar" ? lookup.job(id).name : withArticle(lookup.job(id).name);
  const familyName = (id: string) =>
    locale === "ar" ? lookup.family(id).name : inlineName(lookup.family(id).name);
  const sections = planSections(result, flags);
  const clarity = clarityBlocks(result);

  const blocksShown = [
    ...new Set(
      sections.flatMap((section) =>
        sectionBlocks(section, result, section4, nextSteps, clarity),
      ),
    ),
  ];

  return {
    result,
    section4,
    nextSteps,
    sections,
    clarity,
    otherMotivators: MOTIVATOR_CODES.filter(
      (code) => !result.leadingMotivators.includes(code),
    ),
    watchFills: {
      "job 1": watchName(nextSteps.watchJobIds[0]),
      "job 2": watchName(nextSteps.watchJobIds[1]),
    },
    talkFill: familyName(nextSteps.talkFamilyId),
    blocksShown,
    family: lookup.family,
    job: lookup.job,
  };
}
