import bankFile from "@/lib/admin/core/data/bank-1.1.json";
import questionFile from "@/lib/admin/core/data/questions-5.2.json";
import wordingFile from "@/lib/admin/core/data/wording-2026-10-19.json";

/**
 * The CORE 2.0 framework as the CMS sees it: the client's content package
 * (question set 5.2, report wording 2026-10-19, career bank 1.1) copied
 * unchanged from apps/consumer/lib/core-v2/content/data. The consumer reads its
 * own copy; core-package.test.ts fails when the two drift.
 *
 * CORE has its own structure (four parts, curiosity and motivator codes, four
 * two-sided axes) and is never mapped onto the v4 pillar/cluster model.
 */

export const CORE_PACKAGE_VERSIONS = {
  questionSet: "5.2",
  scoring: "2.0",
  reportWording: "2026-10-19",
  bank: "1.1",
} as const;

export const CORE_PILLARS = ["P1", "P2", "P3", "P4"] as const;
export type CorePillar = (typeof CORE_PILLARS)[number];

export const CORE_AXES = ["structure", "focus", "team", "setting"] as const;
export type CoreAxis = (typeof CORE_AXES)[number];

export interface CorePartMeta {
  pillar: CorePillar;
  part: 1 | 2 | 3 | 4;
  name: string;
  /** What an answer in this part scores toward. */
  scores: "curiosities" | "axes" | "motivators";
  axes: readonly CoreAxis[];
}

export const CORE_PARTS: readonly CorePartMeta[] = [
  {
    pillar: "P1",
    part: 1,
    name: "Curiosities",
    scores: "curiosities",
    axes: [],
  },
  {
    pillar: "P2",
    part: 2,
    name: "Ways of working",
    scores: "axes",
    axes: ["structure", "focus"],
  },
  { pillar: "P3", part: 3, name: "Motivators", scores: "motivators", axes: [] },
  {
    pillar: "P4",
    part: 4,
    name: "Team and setting",
    scores: "axes",
    axes: ["team", "setting"],
  },
];

/** Each axis: the option code for side A and side B (spec §4.3). */
export const CORE_AXIS_SIDES: Record<
  CoreAxis,
  { sideA: string; sideB: string }
> = {
  structure: { sideA: "S", sideB: "F" },
  focus: { sideA: "D", sideB: "B" },
  team: { sideA: "T", sideB: "O" },
  setting: { sideA: "ST", sideB: "CH" },
};

// ------------------------------------------------------------ file shapes

export interface CoreOption {
  option_id: string;
  code: string;
  scores_to?: string;
  text_en: string;
  text_ar: string;
}

export interface CoreItem {
  item_id: string;
  pillar: CorePillar;
  context_zone?: string;
  axis: CoreAxis | null;
  review_status?: string;
  stem_en: string;
  stem_ar: string;
  fixed_order_position: number;
  options: CoreOption[];
}

export interface CoreScreen {
  screen_id: string;
  purpose: string;
  purpose_ar?: string;
  text_en: string;
  text_ar: string;
}

export interface CoreBackgroundQuestion {
  question_id: string;
  heading_en: string;
  heading_ar: string;
  text_en: string;
  text_ar: string;
  options: { option_id: string; text_en: string; text_ar: string }[];
}

export interface CoreQuestionSetDoc {
  name: string;
  version: string;
  scoring_version: string;
  date: string;
  notes: string[];
  codes: {
    curiosities: Record<string, string>;
    motivators: Record<string, string>;
    axis_options: Record<string, string>;
  };
  screens: CoreScreen[];
  background_questions: CoreBackgroundQuestion[];
  items: Record<CorePillar, CoreItem[]>;
}

export interface CoreWordingBlock {
  block_id: string;
  section: string;
  purpose: string;
  text_en: string;
  text_ar: string;
}

export interface CoreWordingDoc {
  name: string;
  date: string;
  languages: string[];
  notes: string[];
  blocks: CoreWordingBlock[];
}

export interface CoreBankJob {
  job_id: string;
  job: string;
  job_ar: string;
  onet_code: string | null;
  onet_title: string | null;
  structure: string;
  focus: string;
  team: string;
  setting: string;
  changing_work: boolean;
}

export interface CoreBankFamily {
  family_id: string;
  type: string;
  clusters: string[];
  bank_order: number;
  family: string;
  family_ar: string;
  study_fields: string;
  study_fields_ar: string;
  jobs: CoreBankJob[];
}

export interface CoreBankDoc {
  name: string;
  version: string;
  status: string;
  date: string;
  source_credit: string;
  notes: string[];
  families: CoreBankFamily[];
}

export const CORE_QUESTION_SET = questionFile as unknown as CoreQuestionSetDoc;
export const CORE_WORDING = wordingFile as unknown as CoreWordingDoc;
export const CORE_BANK = bankFile as unknown as CoreBankDoc;

// ------------------------------------------------------------ reading

export function itemsInOrder(
  doc: CoreQuestionSetDoc,
  pillar: CorePillar,
): CoreItem[] {
  return [...(doc.items[pillar] ?? [])].sort(
    (a, b) => a.fixed_order_position - b.fixed_order_position,
  );
}

export function countItems(doc: CoreQuestionSetDoc): number {
  return CORE_PILLARS.reduce((n, p) => n + (doc.items[p]?.length ?? 0), 0);
}

/** Valid option codes for a part: curiosity, motivator or the axis sides. */
export function codesForPart(
  doc: CoreQuestionSetDoc,
  part: CorePartMeta,
): string[] {
  if (part.scores === "curiosities") return Object.keys(doc.codes.curiosities);
  if (part.scores === "motivators") return Object.keys(doc.codes.motivators);
  return part.axes.flatMap((axis) => [
    CORE_AXIS_SIDES[axis].sideA,
    CORE_AXIS_SIDES[axis].sideB,
  ]);
}

/** Every code the framework knows, with its name, for display. */
export function codeLabel(doc: CoreQuestionSetDoc, code: string): string {
  return (
    doc.codes.curiosities[code] ??
    doc.codes.motivators[code] ??
    doc.codes.axis_options[code] ??
    code
  );
}

/**
 * Structural check of a question set: four parts, unique ids, axis items only
 * in P2/P4 with that axis's two sides, every option code valid for its part,
 * and English and Arabic text on every stem, option and screen.
 */
export function validateQuestionSet(doc: CoreQuestionSetDoc): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const meta of CORE_PARTS) {
    const items = doc.items[meta.pillar];
    if (!Array.isArray(items) || items.length === 0) {
      errors.push(`${meta.pillar} has no questions.`);
      continue;
    }
    const allowed = new Set(codesForPart(doc, meta));
    for (const item of items) {
      if (seen.has(item.item_id)) errors.push(`${item.item_id} appears twice.`);
      seen.add(item.item_id);
      if (item.pillar !== meta.pillar) {
        errors.push(
          `${item.item_id} is filed under ${meta.pillar} but says ${item.pillar}.`,
        );
      }
      if (meta.scores === "axes") {
        if (!item.axis || !meta.axes.includes(item.axis)) {
          errors.push(
            `${item.item_id} needs one of the ${meta.pillar} axes (${meta.axes.join(", ")}).`,
          );
        } else {
          const { sideA, sideB } = CORE_AXIS_SIDES[item.axis];
          const codes = item.options
            .map((o) => o.code)
            .sort()
            .join(",");
          if (codes !== [sideA, sideB].sort().join(",")) {
            errors.push(
              `${item.item_id} must offer exactly ${sideA} and ${sideB}.`,
            );
          }
        }
      } else if (item.axis) {
        errors.push(`${item.item_id} is in ${meta.pillar}, which has no axes.`);
      }
      if (!item.stem_en.trim())
        errors.push(`${item.item_id} has no English text.`);
      if (!item.stem_ar.trim())
        errors.push(`${item.item_id} has no Arabic text.`);
      const optionIds = new Set<string>();
      for (const option of item.options) {
        if (optionIds.has(option.option_id)) {
          errors.push(`${option.option_id} appears twice.`);
        }
        optionIds.add(option.option_id);
        if (!allowed.has(option.code)) {
          errors.push(
            `${option.option_id} scores to ${option.code}, which ${meta.pillar} does not use.`,
          );
        }
        if (!option.text_en.trim())
          errors.push(`${option.option_id} has no English text.`);
        if (!option.text_ar.trim())
          errors.push(`${option.option_id} has no Arabic text.`);
      }
    }
  }
  for (const screen of doc.screens) {
    if (!screen.text_en.trim() || !screen.text_ar.trim()) {
      errors.push(`Screen ${screen.screen_id} needs English and Arabic text.`);
    }
  }
  return errors;
}

/**
 * A draft may change wording only. Ids, codes, axes, order and the number of
 * questions and options stay as in the base set, so scoring 2.0 still applies.
 */
export function compareStructure(
  base: CoreQuestionSetDoc,
  draft: CoreQuestionSetDoc,
): string[] {
  const errors: string[] = [];
  if (draft.scoring_version !== base.scoring_version) {
    errors.push(`Scoring version must stay ${base.scoring_version}.`);
  }
  for (const pillar of CORE_PILLARS) {
    const a = base.items[pillar] ?? [];
    const b = draft.items[pillar] ?? [];
    if (a.length !== b.length) {
      errors.push(`${pillar} must keep ${a.length} questions.`);
      continue;
    }
    a.forEach((item, i) => {
      const other = b[i];
      if (
        other.item_id !== item.item_id ||
        other.axis !== item.axis ||
        other.fixed_order_position !== item.fixed_order_position
      ) {
        errors.push(`${item.item_id} changed id, axis or order.`);
        return;
      }
      const shape = (o: CoreOption) => `${o.option_id}:${o.code}`;
      if (
        other.options.map(shape).join("|") !== item.options.map(shape).join("|")
      ) {
        errors.push(`${item.item_id} changed its options or codes.`);
      }
    });
  }
  return errors;
}

export interface CoreItemTextEdit {
  stem_en: string;
  stem_ar: string;
  options: Record<string, { text_en: string; text_ar: string }>;
}

/** A copy of the draft with one question's wording replaced. */
export function applyItemTextEdit(
  doc: CoreQuestionSetDoc,
  itemId: string,
  edit: CoreItemTextEdit,
): CoreQuestionSetDoc {
  let found = false;
  const items = Object.fromEntries(
    CORE_PILLARS.map((pillar) => [
      pillar,
      (doc.items[pillar] ?? []).map((item) => {
        if (item.item_id !== itemId) return item;
        found = true;
        return {
          ...item,
          stem_en: edit.stem_en.trim(),
          stem_ar: edit.stem_ar.trim(),
          options: item.options.map((option) => {
            const text = edit.options[option.option_id];
            return text
              ? {
                  ...option,
                  text_en: text.text_en.trim(),
                  text_ar: text.text_ar.trim(),
                }
              : option;
          }),
        };
      }),
    ]),
  ) as Record<CorePillar, CoreItem[]>;
  if (!found)
    throw new Error(`Question ${itemId} is not in this question set.`);
  return { ...doc, items };
}

// ------------------------------------------------------------ attempts

/** Display letters the consumer gives options, in file order (assessment.ts). */
const LETTERS = ["A", "B", "C", "D"] as const;

export interface DecodedCoreAnswer {
  itemId: string;
  pillar: CorePillar | null;
  stem: string;
  letter: string;
  optionId: string | null;
  code: string | null;
  codeName: string | null;
  answerText: string | null;
}

/**
 * A CORE attempt's stored answers (item id → display letter) read against the
 * CORE question set. Never decoded with v4 questions or rules.
 */
export function decodeCoreAnswers(
  doc: CoreQuestionSetDoc,
  answers: Record<string, unknown> | null,
  locale: string,
): DecodedCoreAnswer[] {
  if (!answers) return [];
  const isArabic = locale === "ar";
  const decoded: DecodedCoreAnswer[] = [];
  for (const meta of CORE_PARTS) {
    for (const item of itemsInOrder(doc, meta.pillar)) {
      const letter = answers[item.item_id];
      if (typeof letter !== "string") continue;
      const index = LETTERS.indexOf(letter as (typeof LETTERS)[number]);
      const option = index >= 0 ? item.options[index] : undefined;
      decoded.push({
        itemId: item.item_id,
        pillar: meta.pillar,
        stem: isArabic ? item.stem_ar : item.stem_en,
        letter,
        optionId: option?.option_id ?? null,
        code: option?.code ?? null,
        codeName: option ? codeLabel(doc, option.code) : null,
        answerText: option
          ? isArabic
            ? option.text_ar
            : option.text_en
          : null,
      });
    }
  }
  const known = new Set(decoded.map((d) => d.itemId));
  for (const [key, value] of Object.entries(answers)) {
    if (known.has(key)) continue;
    decoded.push({
      itemId: key,
      pillar: null,
      stem: key,
      letter: typeof value === "string" ? value : JSON.stringify(value),
      optionId: null,
      code: null,
      codeName: null,
      answerText: null,
    });
  }
  return decoded;
}

/** Ids of questions whose wording differs between two sets. */
export function changedItemIds(
  base: CoreQuestionSetDoc,
  draft: CoreQuestionSetDoc,
): string[] {
  const baseById = new Map(
    CORE_PILLARS.flatMap((p) => base.items[p] ?? []).map((i) => [i.item_id, i]),
  );
  const text = (i: CoreItem) =>
    JSON.stringify([
      i.stem_en,
      i.stem_ar,
      i.options.map((o) => [o.text_en, o.text_ar]),
    ]);
  return CORE_PILLARS.flatMap((p) => draft.items[p] ?? [])
    .filter((item) => {
      const original = baseById.get(item.item_id);
      return !original || text(original) !== text(item);
    })
    .map((item) => item.item_id);
}

const CORE_ITEM_IDS = new Set(
  CORE_PILLARS.flatMap((p) => CORE_QUESTION_SET.items[p] ?? []).map(
    (i) => i.item_id,
  ),
);

/**
 * True when any answer key is a CORE question id. Such answers must only be
 * scored by scoring 2.0, never by a v4 engine.
 */
export function hasCoreAnswers(answers: Record<string, unknown>): boolean {
  return Object.keys(answers).some((key) => CORE_ITEM_IDS.has(key));
}
