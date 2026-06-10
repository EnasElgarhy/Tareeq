import { assessmentQuestions } from "@/lib/assessment/questions";
import {
  createAnswerDigest,
  getArchetypeClusterHint,
  getMultiCuriousClusters,
} from "@/lib/results/framework";
import type { PersonalizedCompassReport } from "@/lib/results/types";
import type { CompassResult } from "@/lib/scoring";

/**
 * Prompt + payload + normalization for the results FINE-TUNER.
 *
 * Architecture: the deterministic engine already produced a complete,
 * doc-compliant BASE report (cluster + fixed lists + base prose). The AI's
 * only job is to REWRITE the prose to feel warmer, sharper, and more
 * personal — it never changes the cluster, the lists, or the score. So the
 * model receives the base prose to polish + the fixed lists + personalization
 * hints, and returns ONLY the rewritten prose fields.
 */

export const RESULTS_SYSTEM_PROMPT = [
  "You are Kai, Tareeq's career guide. A deterministic scoring engine has ALREADY computed this learner's career-compass result: a fixed cluster, fixed lists (high-school subjects, university majors, career families, non-obvious paths), and a deterministic BASE version of the prose.",
  "",
  "Your ONLY job is to REWRITE the prose so it feels warmer, sharper, and more personal than the base — without changing any facts.",
  "",
  "HARD RULES:",
  "- Do NOT change the cluster, the lists, the archetype, the drivers, or the score. Treat `fixedLists` as truth: weave those exact subjects/majors/careers/paths into the prose; never replace them with different ones or invent new ones.",
  "- GUIDANCE, not a label. NEVER write 'you are a [type]', 'your personality is', or 'people like you'. Use 'your answers point toward…' / 'your compass points to…'.",
  "- Order things in the prose: career families/jobs first, then university majors, then high-school subjects.",
  "- Reality check: tune it to the primary reward driver — Stability → income stability/volatility; Impact → how tangible the impact is; Autonomy → hierarchy vs independence; Mastery → depth/specialisation; Recognition → visibility. Tell them to watch 'day in the life of [role]' videos before choosing.",
  "- Use `archetypeClusterWorkStyle` to make the integration paragraph specific to how this learner works.",
  "- Hedge in proportion to confidence: low/moderate confidence → read less definitively; if multi-curious, frame the intersections as a strength, not confusion.",
  "- Kai voice: direct second person, confident, concrete, warm. No hedge words (might/maybe/perhaps), no corporate-speak (leverage/synergize/optimize), no clichés (follow your dreams / sky's the limit). Keep each field tight.",
  "- Use regional school wording where natural (A-Levels, Tawjihi, IB, IGCSE; 'Mathematics', 'Physics').",
  "",
  "Return ONLY the rewritten prose as JSON: headline, summary, academicPath, careerLandscape, integration, realityCheck, nextSteps. Do not return any lists.",
].join("\n");

/** The instruction wrapper around the payload (provider-agnostic). */
export function buildUserContent(payload: unknown): string {
  return `Rewrite the prose for this compass result. Keep every fact, cluster, and list exactly as given; only improve the writing per the rules. Return JSON with the 7 prose fields.\n\n${JSON.stringify(
    payload,
  )}`;
}

/**
 * Build the fine-tune payload: the deterministic base prose to polish, the
 * fixed lists (truth), and personalization hints. Email is never included.
 */
export function buildFineTunePayload(
  result: CompassResult,
  name: string | undefined,
  base: PersonalizedCompassReport,
  answers: Record<string, string>,
) {
  return {
    learner: { name: name || "the learner" },
    compass: {
      clusterName: base.clusterName,
      archetype: result.archetype,
      primaryDriver: base.primaryDriver,
      secondaryDriver: base.secondaryDriver,
      ecosystemFit: base.ecosystemFit,
      confidencePercentage: result.confidencePercentage,
      confidenceLabel: result.confidenceLabel,
      isMultiCurious: base.isMultiCurious,
      multiCuriousClusters: base.multiCuriousClusters,
    },
    personalizationHints: {
      archetypeClusterWorkStyle: getArchetypeClusterHint(
        result.archetype,
        result.topCluster,
      ),
      multiCuriousIntersections: getMultiCuriousClusters(result),
    },
    // DETERMINISTIC truth — must appear in the prose, never be replaced:
    fixedLists: {
      careerExamples: base.careerExamples,
      universityMajors: base.universityMajors,
      highSchoolSubjects: base.highSchoolSubjects,
      nonObviousPaths: base.nonObviousPaths,
    },
    // The base prose to rewrite (keep the meaning, improve the writing):
    baseProse: {
      headline: base.headline,
      summary: base.summary,
      academicPath: base.academicPath,
      careerLandscape: base.careerLandscape,
      integration: base.integration,
      realityCheck: base.realityCheck,
      nextSteps: base.nextSteps,
    },
    // Light nuance from the raw answers (use only to personalize tone):
    answerNuance: createAnswerDigest(answers, assessmentQuestions),
  };
}

/**
 * Gemini structured-output schema — ONLY the prose fields. The lists are
 * never requested, so the model cannot change them. Schema `type` enum is
 * upper-case for Gemini.
 */
export const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    headline: { type: "STRING" },
    summary: { type: "STRING" },
    academicPath: { type: "STRING" },
    careerLandscape: { type: "STRING" },
    integration: { type: "STRING" },
    realityCheck: { type: "STRING" },
    nextSteps: { type: "STRING" },
  },
  required: [
    "headline",
    "summary",
    "academicPath",
    "careerLandscape",
    "integration",
    "realityCheck",
    "nextSteps",
  ],
} as const;

/** The prose fields the fine-tuner is allowed to rewrite. */
export type ProseFields = Pick<
  PersonalizedCompassReport,
  | "headline"
  | "summary"
  | "academicPath"
  | "careerLandscape"
  | "integration"
  | "realityCheck"
  | "nextSteps"
>;

function normalizeString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

/**
 * Take the model's rewritten prose, falling back to the deterministic base
 * prose for any field that's missing/empty. Lists are NOT touched here — the
 * route keeps them from the base report.
 */
export function normalizeProseFields(
  generated: Partial<PersonalizedCompassReport>,
  base: PersonalizedCompassReport,
): ProseFields {
  return {
    headline: normalizeString(generated.headline, base.headline),
    summary: normalizeString(generated.summary, base.summary),
    academicPath: normalizeString(generated.academicPath, base.academicPath),
    careerLandscape: normalizeString(
      generated.careerLandscape,
      base.careerLandscape,
    ),
    integration: normalizeString(generated.integration, base.integration),
    realityCheck: normalizeString(generated.realityCheck, base.realityCheck),
    nextSteps: normalizeString(generated.nextSteps, base.nextSteps),
  };
}
