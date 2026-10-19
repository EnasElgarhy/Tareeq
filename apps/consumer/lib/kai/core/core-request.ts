import { z } from "zod";
import {
  AXIS_CODES,
  CURIOSITY_CODES,
  MOTIVATOR_CODES,
  PART_QUESTION_COUNTS,
  QUESTIONS_PER_AXIS,
  SCORING_VERSION,
  type CoreResult,
} from "@/lib/core-v2/types";
import {
  CORE_ENTRY_PROMPT_IDS,
  type CoreDisagreement,
  type CoreEntryPromptId,
  type CoreStudentProfile,
} from "./core-context";

/**
 * What the browser sends for a CORE student (`core` on the chat request).
 * The server rebuilds Kai's payload from these codes with its own copy of the
 * bank and wording, so no free text from the client reaches the prompt except
 * the student's own words (country, prior disagreements), length-capped.
 */

const MAX_TEXT = 300;
const MAX_DISAGREEMENTS = 12;
const AXIS_SIDES = ["S", "F", "D", "B", "T", "O", "ST", "CH"] as const;

const count = (max: number) => z.number().int().min(0).max(max);
const codeCounts = <T extends string>(codes: readonly T[], max: number) =>
  z.object(Object.fromEntries(codes.map((code) => [code, count(max)])) as Record<T, z.ZodNumber>);

const axisResult = z.object({
  count: count(QUESTIONS_PER_AXIS),
  zone: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  lean: z.enum(AXIS_SIDES).nullable(),
});

const coreResultSchema = z.object({
  scoringVersion: z.literal(SCORING_VERSION),
  curiosityCounts: codeCounts(CURIOSITY_CODES, PART_QUESTION_COUNTS[1]),
  leadingCuriosities: z.array(z.enum(CURIOSITY_CODES)).min(1).max(CURIOSITY_CODES.length),
  directionClarity: z.enum(["clear", "leaning", "close", "open"]),
  margin: z.number().int().min(0).max(PART_QUESTION_COUNTS[1]),
  circleReading: z.enum(["single", "coherent", "diverse"]),
  motivatorCounts: codeCounts(MOTIVATOR_CODES, PART_QUESTION_COUNTS[3]),
  leadingMotivators: z.array(z.enum(MOTIVATOR_CODES)).max(MOTIVATOR_CODES.length),
  noSmallSet: z.boolean(),
  topTwoMotivators: z.array(z.enum(MOTIVATOR_CODES)).max(2),
  axes: z.object(
    Object.fromEntries(AXIS_CODES.map((axis) => [axis, axisResult])) as Record<
      (typeof AXIS_CODES)[number],
      typeof axisResult
    >,
  ),
  leadingShare: z.number().min(0).max(100),
});

const shortText = z.string().trim().min(1).max(MAX_TEXT);

const coreKaiRequestSchema = z.object({
  result: coreResultSchema,
  previousResult: coreResultSchema.nullish(),
  isFlagged: z.boolean(),
  entryPromptId: z.enum(CORE_ENTRY_PROMPT_IDS as [CoreEntryPromptId, ...CoreEntryPromptId[]]).nullish(),
  profile: z.object({
    gender: z.enum(["female", "male"]).nullable(),
    ageBand: z.enum(["13-17", "18+"]).nullable(),
    academicStage: shortText.nullable(),
    country: shortText.nullable(),
  }),
  priorDisagreements: z
    .array(
      z.object({
        result: shortText,
        studentVersion: shortText,
        reason: shortText.nullable(),
      }),
    )
    .max(MAX_DISAGREEMENTS),
});

export interface CoreKaiRequest {
  result: CoreResult;
  previousResult: CoreResult | null;
  isFlagged: boolean;
  entryPromptId: CoreEntryPromptId | null;
  profile: CoreStudentProfile;
  priorDisagreements: CoreDisagreement[];
}

export function parseCoreKaiRequest(
  value: unknown,
): { ok: true; value: CoreKaiRequest } | { ok: false; error: string } {
  const parsed = coreKaiRequestSchema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: `core is invalid at ${issue?.path.join(".") || "root"}.`,
    };
  }
  const data = parsed.data;
  return {
    ok: true,
    value: {
      result: data.result as CoreResult,
      previousResult: (data.previousResult ?? null) as CoreResult | null,
      isFlagged: data.isFlagged,
      entryPromptId: data.entryPromptId ?? null,
      profile: data.profile,
      priorDisagreements: data.priorDisagreements,
    },
  };
}
