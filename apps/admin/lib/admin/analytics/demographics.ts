import type { AgeBand } from "@/lib/admin/analytics/types";

/**
 * Demographic resolution for the Analytics → Audience surface.
 *
 * The onboarding demographic questions (CORE assessment, pillar 0) are stored
 * as answers ON THE ASSESSMENT — `QD1..QD4` in `assessments.answers` — NOT on
 * the `profiles` table, whose country/gender/birth_year/education_level columns
 * are effectively never populated (measured: 0 of 4 profiles had any of them).
 * Audience previously read only those profile columns, so every dimension
 * reported ~100% "unknown". This module reads the real source instead.
 *
 *   QD1 = age band      QD2 = country (free text)
 *   QD3 = academic stage (education level)   QD4 = gender
 *
 * Letters map to option labels. QD1 maps to the fixed analytics AgeBand
 * buckets (the label wording is CMS-editable, but the age bucket is a fixed
 * analytic dimension, so it is keyed by letter). QD2 is a free-text country
 * string. QD3/QD4 map letter → the version's own option label when available,
 * falling back to the seed labels below.
 */

export const DEMO_EXTERNAL_IDS = {
  age: "QD1",
  country: "QD2",
  education: "QD3",
  gender: "QD4",
} as const;

/** QD1 option letter → analytics AgeBand. "Under 16" (A) → under-16 bucket. */
export const QD1_LETTER_TO_AGE_BAND: Record<string, AgeBand> = {
  A: "under-16",
  B: "16-17",
  C: "18-19",
  D: "20-21",
  E: "22+",
};

/**
 * Seed-content letter → label fallbacks, used when a version's own question
 * option text can't be loaded. Version-specific labels (loaded from
 * `question_options`) take precedence so CMS edits flow through to Audience.
 */
export const DEMO_FALLBACK_LABELS: Record<"QD3" | "QD4", Record<string, string>> = {
  QD3: {
    A: "Final 2 years of high school",
    B: "Gap year or transition",
    C: "Year 1 or 2 of university",
    D: "Year 3+ of university",
    E: "Not currently in formal education",
  },
  QD4: {
    A: "Female",
    B: "Male",
    C: "Prefer not to say",
  },
};

/** Per-version letter→label maps for the coded demographic questions. */
export interface DemoLabelMap {
  QD3: Record<string, string>;
  QD4: Record<string, string>;
}

export interface ResolvedDemographics {
  country: string | null;
  ageBand: AgeBand;
  gender: string | null;
  educationLevel: string | null;
}

function answerString(
  answers: Record<string, unknown>,
  key: string,
): string | null {
  const v = answers[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/**
 * "egypt" / " EGYPT " → "Egypt"; multi-word names keep each word capitalised
 * ("saudi arabia" → "Saudi Arabia"). Collapses casing/whitespace so the same
 * country isn't tallied as two entries.
 */
export function normalizeCountry(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed
    .toLocaleLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toLocaleUpperCase() + w.slice(1))
    .join(" ");
}

function labelFor(
  letter: string | null,
  versionMap: Record<string, string> | undefined,
  fallback: Record<string, string>,
): string | null {
  if (!letter) return null;
  const key = letter.trim().toUpperCase();
  return versionMap?.[key] ?? fallback[key] ?? null;
}

/**
 * Resolve the four Audience dimensions from an assessment's answers blob.
 * `labelMap` is the version's own QD3/QD4 option labels (optional; falls back
 * to seed labels). Returns "unknown"/null for anything not answered.
 */
export function resolveDemographicsFromAnswers(
  answers: unknown,
  labelMap?: DemoLabelMap,
): ResolvedDemographics {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return { country: null, ageBand: "unknown", gender: null, educationLevel: null };
  }
  const a = answers as Record<string, unknown>;

  const ageLetter = answerString(a, DEMO_EXTERNAL_IDS.age);
  const ageBand: AgeBand = ageLetter
    ? (QD1_LETTER_TO_AGE_BAND[ageLetter.toUpperCase()] ?? "unknown")
    : "unknown";

  return {
    country: normalizeCountry(answerString(a, DEMO_EXTERNAL_IDS.country)),
    ageBand,
    gender: labelFor(
      answerString(a, DEMO_EXTERNAL_IDS.gender),
      labelMap?.QD4,
      DEMO_FALLBACK_LABELS.QD4,
    ),
    educationLevel: labelFor(
      answerString(a, DEMO_EXTERNAL_IDS.education),
      labelMap?.QD3,
      DEMO_FALLBACK_LABELS.QD3,
    ),
  };
}
