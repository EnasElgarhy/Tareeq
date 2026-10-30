import type { Locale } from "@/lib/i18n/locale";
import type { CareerBank, CareerFamily, CareerJob, RouteTag } from "../bank";
import {
  AXIS_CODES,
  CURIOSITY_CODES,
  MOTIVATOR_CODES,
  type AxisCode,
  type CuriosityCode,
  type MotivatorCode,
} from "../types";
import bankFile from "./data/bank-1.1.json";
import questionFile from "./data/questions-5.2.json";
import wordingFile from "./data/wording-2026-10-19.json";

/**
 * The client's CORE content files (developer package of 17 Oct 2026):
 * 03 questions V5.2, 04 report wording, 05 career bank v1.1. The JSON in
 * ./data is copied from the package unchanged; this module adapts it to the
 * shapes the scorer and the report use. Update the files by replacing them.
 */

/** Stored with every new attempt (change instructions, step 8). */
export const CORE_CONTENT_VERSIONS = {
  questionSet: "5.2",
  scoring: "2.0",
  reportWording: "2026-10-19",
  bank: "1.1",
} as const;

// ---------------------------------------------------------------- 03 questions

interface RawOption {
  option_id: string;
  code: string;
  text_en: string;
  text_ar: string;
}

interface RawItem {
  item_id: string;
  pillar: "P1" | "P2" | "P3" | "P4";
  axis: AxisCode | null;
  fixed_order_position: number;
  stem_en: string;
  stem_ar: string;
  options: RawOption[];
}

interface RawScreen {
  screen_id: string;
  text_en: string;
  text_ar: string;
}

export interface CoreQuestionOption {
  id: string;
  /** What the option scores toward: a curiosity, motivator or axis-side code. */
  code: string;
  text: Record<Locale, string>;
}

export interface CoreQuestion {
  id: string;
  part: 1 | 2 | 3 | 4;
  fixedOrderPosition: number;
  axis: AxisCode | null;
  text: Record<Locale, string>;
  options: CoreQuestionOption[];
}

const PILLARS = ["P1", "P2", "P3", "P4"] as const;
const rawQuestions = questionFile as unknown as {
  version: string;
  screens: RawScreen[];
  items: Record<(typeof PILLARS)[number], RawItem[]>;
};

if (rawQuestions.version !== CORE_CONTENT_VERSIONS.questionSet) {
  throw new Error(`Question file is ${rawQuestions.version}, expected 5.2`);
}

export const CORE_QUESTIONS: readonly CoreQuestion[] = PILLARS.flatMap(
  (pillar, i) =>
    rawQuestions.items[pillar].map((item) => ({
      id: item.item_id,
      part: (i + 1) as CoreQuestion["part"],
      fixedOrderPosition: item.fixed_order_position,
      axis: item.axis,
      text: { en: item.stem_en, ar: item.stem_ar },
      options: item.options.map((option) => ({
        id: option.option_id,
        code: option.code,
        text: { en: option.text_en, ar: option.text_ar },
      })),
    })),
);

/** Intro and end screens by screen_id (S-WELCOME, S-P1 … S-P4, S-BG, S-END). */
export function coreScreenText(locale: Locale, screenId: string): string | null {
  const screen = rawQuestions.screens.find((s) => s.screen_id === screenId);
  return screen ? screen[locale === "ar" ? "text_ar" : "text_en"] : null;
}

// ---------------------------------------------------------------- 04 wording

interface RawBlock {
  block_id: string;
  text_en: string;
  text_ar: string;
}

/** Arabic placeholders, renamed to the English keys the renderer fills. */
const AR_PLACEHOLDERS: Readonly<Record<string, string>> = {
  "[أسماء الجوانب]": "[curiosities]",
  "[المهنة 1]": "[job 1]",
  "[المهنة 2]": "[job 2]",
  "[المجموعة]": "[family]",
};

function normaliseArabic(text: string): string {
  return Object.entries(AR_PLACEHOLDERS).reduce(
    (current, [from, to]) => current.split(from).join(to),
    text,
  );
}

const WORDING: Record<Locale, ReadonlyMap<string, string>> = (() => {
  const blocks = (wordingFile as unknown as { blocks: RawBlock[] }).blocks;
  return {
    en: new Map(blocks.map((b) => [b.block_id, b.text_en])),
    ar: new Map(blocks.map((b) => [b.block_id, normaliseArabic(b.text_ar)])),
  };
})();

/**
 * Founder-approved changes not yet in file 04. Each wins over the file until
 * the client ships a wording file that carries it; remove the entry then.
 * - S2-TITLE: drop "picture" (Enas, voice note of 21 Oct 2026).
 */
const WORDING_OVERRIDES: Readonly<Record<string, Record<Locale, string>>> = {
  "S2-TITLE": { en: "Your CORE at a glance", ar: "لمحة عن كور الخاص بك" },
  // Final Arabic part names, decided 29 Oct (staging corrections v4, rows 20 to 23).
  "S1-KEY-C": { en: "C · Curiosities: what sparks your curiosity", ar: "ما يثير فضولك: ما يشدّ اهتمامك" },
  "S1-KEY-O": { en: "O · Operating style: how you like to work", ar: "طريقتك في العمل: كيف تحبّ أن تعمل" },
  "S1-KEY-R": { en: "R · Rewards: why one path appeals more than another", ar: "ما يحفّزك: لماذا يجذبك مسار أكثر من غيره" },
  "S1-KEY-E": { en: "E · Ecosystem: where, meaning your work setting", ar: "أجواء العمل: أين تحبّ أن تعمل" },
};

export function coreWording(locale: Locale, blockId: string): string | null {
  return WORDING_OVERRIDES[blockId]?.[locale] ?? (WORDING[locale].get(blockId) || null);
}

// ---------------------------------------------------------------- 05 career bank

interface RawJob {
  job_id: string;
  job: string;
  job_ar: string;
  structure: string;
  focus: string;
  team: string;
  setting: string;
  often_offers: string[];
  changing_work: boolean;
}

interface RawFamily {
  family_id: string;
  clusters: string[];
  family: string;
  family_ar: string;
  study_fields: string;
  study_fields_ar: string;
  jobs: RawJob[];
}

const ROUTE_TAGS: readonly RouteTag[] = [
  "Set out",
  "Open",
  "Deep",
  "Broad",
  "Together",
  "Own",
  "Steady",
  "Changing",
  "Mixed",
  "No data",
];

/** Bank motivator names → codes. Security and Family are never matched (spec §6.4). */
const MOTIVATOR_BY_NAME: Readonly<Record<string, MotivatorCode>> = {
  Recognition: "REC",
  Impact: "IMP",
  Mastery: "MAS",
  Autonomy: "AUT",
  Income: "INC",
  Lifestyle: "LIF",
};

const isCuriosity = (code: string): code is CuriosityCode =>
  (CURIOSITY_CODES as readonly string[]).includes(code);
const isRouteTag = (tag: string): tag is RouteTag =>
  (ROUTE_TAGS as readonly string[]).includes(tag);

function toJob(job: RawJob, locale: Locale): CareerJob {
  const routes = Object.fromEntries(
    AXIS_CODES.map((axis) => {
      const tag = job[axis];
      if (!isRouteTag(tag)) throw new Error(`Job ${job.job_id} has route "${tag}"`);
      return [axis, tag];
    }),
  ) as CareerJob["routes"];
  const offers = job.often_offers.map((name) => {
    const code = MOTIVATOR_BY_NAME[name];
    if (!code || !MOTIVATOR_CODES.includes(code)) {
      throw new Error(`Job ${job.job_id} offers unknown "${name}"`);
    }
    return code;
  });
  return {
    id: job.job_id,
    name: locale === "ar" ? job.job_ar : job.job,
    nameEn: job.job,
    routes,
    offers,
    isChangingWork: job.changing_work,
  };
}

/** "a, b, c" (English) or "أ، ب، ج" (Arabic) → list. */
function splitFields(text: string): string[] {
  return text
    .split(/[,،]/)
    .map((field) => field.trim())
    .filter(Boolean);
}

function toFamily(family: RawFamily, locale: Locale): CareerFamily {
  const curiosities = family.clusters.filter(isCuriosity);
  if (curiosities.length !== family.clusters.length || curiosities.length < 1 || curiosities.length > 2) {
    throw new Error(`Bank family ${family.family_id} has invalid curiosities`);
  }
  return {
    id: family.family_id,
    name: locale === "ar" ? family.family_ar : family.family,
    curiosities: curiosities as unknown as CareerFamily["curiosities"],
    jobs: family.jobs.map((job) => toJob(job, locale)),
    studyFields: splitFields(locale === "ar" ? family.study_fields_ar : family.study_fields),
  };
}

const bankByLocale = new Map<Locale, CareerBank>();

/** File order is bank order: it breaks every Section 4 tie (file 08, section4). */
export function coreBank(locale: Locale): CareerBank {
  const cached = bankByLocale.get(locale);
  if (cached) return cached;
  const families = (bankFile as unknown as { families: RawFamily[] }).families;
  const bank: CareerBank = { families: families.map((family) => toFamily(family, locale)) };
  bankByLocale.set(locale, bank);
  return bank;
}
