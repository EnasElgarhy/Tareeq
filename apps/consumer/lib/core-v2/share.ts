import type { Locale } from "@/lib/i18n/locale";
import type { CareerBank } from "./bank";
import type { ReportModel } from "./report-model";
import {
  AXIS_CODES,
  CURIOSITY_CODES,
  MOTIVATOR_CODES,
  type AxisCode,
  type AxisZone,
  type CuriosityCode,
  type MotivatorCode,
} from "./types";

/**
 * The share card (spec §11): "My CORE · From my answers today", the leading
 * curiosities (at most three), "Where it could lead" with the first family
 * Section 4 shows and its top three jobs, then short chips for how I like
 * to work, my work setting and what motivates me. The student chooses the
 * parts; there is no name by default, never age, school or a report link.
 *
 * The card travels as codes only (no free text but an optional first name),
 * so the image route can check every value against the content files.
 */

export const SHARE_FORMATS = ["story", "square"] as const;
export type ShareFormat = (typeof SHARE_FORMATS)[number];

export const SHARE_PARTS = ["curiosities", "lead", "work", "setting", "motivators"] as const;
export type SharePart = (typeof SHARE_PARTS)[number];

const MAX_CURIOSITIES = 3;
const MAX_JOBS = 3;
export const MAX_FIRST_NAME = 20;

export interface ShareCard {
  format: ShareFormat;
  locale: Locale;
  curiosities: CuriosityCode[];
  familyId: string | null;
  jobIds: string[];
  zones: Record<AxisCode, AxisZone>;
  motivators: MotivatorCode[];
  hidden: SharePart[];
  firstName: string;
}

/** Chip wording, spec §11 (proposed, pending approval). Arabic is a draft until file 04 carries it. */
const ZONE_CHIPS: Record<Locale, Record<AxisCode, [string, string, string]>> = {
  en: {
    structure: ["Clear steps", "Steps and freedom", "My own way"],
    focus: ["Going deep", "Depth and range", "Covering a range"],
    team: ["With others", "Team and solo", "On my own"],
    setting: ["A steady setting", "Steady and changing", "Something new every day"],
  },
  ar: {
    structure: ["خطوات واضحة", "خطوات وحرية", "طريقتي الخاصة"],
    focus: ["التعمّق", "العمق والتنوّع", "الإلمام بمجالات كثيرة"],
    team: ["مع الآخرين", "فريق وعمل فردي", "وحدي"],
    setting: ["بيئة ثابتة", "ثابتة ومتغيّرة", "شيء جديد كل يوم"],
  },
};

const MOTIVATOR_CHIPS: Record<Locale, Record<MotivatorCode, string>> = {
  en: {
    REC: "Being looked up to",
    IMP: "Making a difference",
    MAS: "Mastering something hard",
    AUT: "In charge of my work",
    SEC: "A secure career",
    INC: "High earnings",
    FAM: "My family's pride in my path",
    LIF: "A life beyond work",
  },
  ar: {
    REC: "أن أكون محلّ تقدير",
    IMP: "إحداث فرق",
    MAS: "إتقان شيء صعب",
    AUT: "إدارة عملي بنفسي",
    SEC: "مسار مهني آمن",
    INC: "دخل مرتفع",
    FAM: "فخر عائلتي بمساري",
    LIF: "حياة أوسع من العمل",
  },
};

export function zoneChip(locale: Locale, axis: AxisCode, zone: AxisZone): string {
  return ZONE_CHIPS[locale][axis][zone - 1];
}

export function motivatorChip(locale: Locale, code: MotivatorCode): string {
  return MOTIVATOR_CHIPS[locale][code];
}

/** The card's content for this report, before the student hides anything. */
export function shareCardFrom(model: ReportModel, locale: Locale): ShareCard {
  const { result, section4 } = model;
  const first = section4.meetCards[0] ?? section4.directions[0]?.full[0];
  return {
    format: "story",
    locale,
    curiosities: result.leadingCuriosities.slice(0, MAX_CURIOSITIES),
    familyId: first?.familyId ?? null,
    jobIds: (first?.jobs ?? []).slice(0, MAX_JOBS).map((job) => job.jobId),
    zones: Object.fromEntries(
      AXIS_CODES.map((axis) => [axis, result.axes[axis].zone]),
    ) as Record<AxisCode, AxisZone>,
    motivators: result.leadingMotivators,
    hidden: [],
    firstName: "",
  };
}

/** Letters, spaces, hyphens and apostrophes only, in any script. */
export function cleanFirstName(value: string): string {
  return value
    .replace(/[^\p{L}\p{M} '-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_FIRST_NAME);
}

export function shareCardQuery(card: ShareCard): string {
  const params = new URLSearchParams({
    f: card.format,
    l: card.locale,
    c: card.curiosities.join(","),
    z: AXIS_CODES.map((axis) => card.zones[axis]).join(""),
    m: card.motivators.join(","),
  });
  if (card.familyId) params.set("fam", card.familyId);
  if (card.jobIds.length > 0) params.set("j", card.jobIds.join(","));
  if (card.hidden.length > 0) params.set("hide", card.hidden.join(","));
  const name = cleanFirstName(card.firstName);
  if (name) params.set("n", name);
  return params.toString();
}

function list(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

function oneOf<T extends string>(values: readonly T[], value: string): value is T {
  return (values as readonly string[]).includes(value);
}

/**
 * Reads a card back from the image route's query. Anything unknown is
 * rejected (null) rather than drawn: only content-file values reach the image.
 */
export function parseShareCardQuery(
  params: URLSearchParams,
  bank: (locale: Locale) => CareerBank,
): ShareCard | null {
  const format = params.get("f") ?? "story";
  const locale = params.get("l") ?? "en";
  if (!oneOf(SHARE_FORMATS, format) || (locale !== "en" && locale !== "ar")) return null;

  const curiosities = list(params.get("c"));
  const motivators = list(params.get("m"));
  const hidden = list(params.get("hide"));
  const zoneText = params.get("z") ?? "";
  if (
    curiosities.length < 1 ||
    curiosities.length > MAX_CURIOSITIES ||
    !curiosities.every((code) => oneOf(CURIOSITY_CODES, code)) ||
    !motivators.every((code) => oneOf(MOTIVATOR_CODES, code)) ||
    !hidden.every((part) => oneOf(SHARE_PARTS, part)) ||
    !/^[123]{4}$/.test(zoneText)
  ) {
    return null;
  }

  const familyId = params.get("fam");
  const jobIds = list(params.get("j"));
  if (jobIds.length > MAX_JOBS) return null;
  if (familyId) {
    const family = bank("en").families.find((f) => f.id === familyId);
    if (!family || !jobIds.every((id) => family.jobs.some((job) => job.id === id))) return null;
  } else if (jobIds.length > 0) {
    return null;
  }

  return {
    format,
    locale,
    curiosities: curiosities as CuriosityCode[],
    familyId,
    jobIds,
    zones: Object.fromEntries(
      AXIS_CODES.map((axis, i) => [axis, Number(zoneText[i]) as AxisZone]),
    ) as Record<AxisCode, AxisZone>,
    motivators: motivators as MotivatorCode[],
    hidden: hidden as SharePart[],
    firstName: cleanFirstName(params.get("n") ?? ""),
  };
}

/** Card labels (spec §11). Arabic is a draft until the founder approves it. */
export const SHARE_LABELS: Record<
  Locale,
  {
    title: string;
    subtitle: string;
    curiosities: string;
    lead: string;
    work: string;
    setting: string;
    motivators: string;
    find: string;
  }
> = {
  en: {
    title: "My CORE",
    subtitle: "From my answers today",
    curiosities: "What sparks my curiosity",
    lead: "Where it could lead",
    work: "How I like to work",
    setting: "My work setting",
    motivators: "What motivates me most",
    find: "Find your CORE",
  },
  ar: {
    title: "كور الخاص بي",
    subtitle: "من إجاباتي اليوم",
    curiosities: "ما يثير فضولي",
    lead: "إلى أين قد يقودني",
    work: "طريقتي في العمل",
    setting: "بيئة عملي",
    motivators: "أكثر ما يحفّزني",
    find: "اكتشف كور الخاص بك",
  },
};

export const SHARE_SITE = "tareeq.me";
