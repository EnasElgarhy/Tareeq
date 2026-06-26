import type { QuestionRow } from "@/lib/admin/content";

/**
 * Pure formatting helpers for the admin Responses surface. No IO — every
 * function is a deterministic transform of its inputs, so they are unit-tested
 * in isolation (response-format.test.ts) and reused by the DB read layer
 * (responses.ts) and the page components.
 *
 * Everything here is defensive: the `result` and `answers` columns are free
 * `jsonb`, written by the consumer flow, so we treat them as `unknown` and
 * narrow safely rather than trusting a shape.
 */

export type LocalizedText = Record<string, string>;

/** Best-effort localized text: requested locale → English → first value. */
export function pickText(
  text: LocalizedText | null | undefined,
  locale = "en",
): string {
  if (!text || typeof text !== "object") return "";
  const short = locale.split("-", 1)[0] ?? locale;
  return text[locale] ?? text[short] ?? text.en ?? Object.values(text)[0] ?? "";
}

export interface ResultSummary {
  topCluster: string | null;
  topClusters: string[];
  archetype: string | null;
  primaryDriver: string | null;
  secondaryDriver: string | null;
  ecosystemFit: string | null;
  confidenceLabel: string | null;
  confidencePercentage: number | null;
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function asFiniteNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * Distil a stored `CompassResult` (or anything jsonb-shaped) down to the few
 * fields the admin UI renders. Tolerates partial / unknown payloads.
 */
export function summarizeResult(result: unknown): ResultSummary {
  const r =
    result && typeof result === "object"
      ? (result as Record<string, unknown>)
      : {};

  const ranked = r.clusterRanked;
  const topClusters = Array.isArray(ranked)
    ? ranked
        .map((entry) => (Array.isArray(entry) ? entry[0] : null))
        .filter((code): code is string => typeof code === "string")
        .slice(0, 3)
    : [];

  const driverNames =
    r.driverNames && typeof r.driverNames === "object"
      ? (r.driverNames as Record<string, string>)
      : {};
  const resolveDriver = (code: string | null) =>
    code ? (driverNames[code] ?? code) : null;

  return {
    topCluster: asString(r.topCluster) ?? topClusters[0] ?? null,
    topClusters,
    archetype: asString(r.archetype),
    primaryDriver: resolveDriver(asString(r.primaryDriver)),
    secondaryDriver: resolveDriver(asString(r.secondaryDriver)),
    ecosystemFit: asString(r.ecosystemFit),
    confidenceLabel: asString(r.confidenceLabel),
    confidencePercentage: asFiniteNumber(r.confidencePercentage),
  };
}

export interface DecodedAnswer {
  externalId: string;
  pillar: number;
  questionTitle: string;
  chosenLetter: string | null;
  chosenText: string | null;
  answered: boolean;
}

/**
 * Join a respondent's raw answers (`{ externalId: letter }`) against the
 * version's questions so the admin sees the actual chosen text per question.
 * Free-text questions store the typed string directly as the value.
 */
export function decodeAnswers(
  questions: readonly QuestionRow[],
  answers: Record<string, unknown> | null | undefined,
  locale = "en",
): DecodedAnswer[] {
  const map =
    answers && typeof answers === "object"
      ? (answers as Record<string, unknown>)
      : {};

  return questions.map((q) => {
    const raw = map[q.external_id];
    const value = typeof raw === "string" ? raw : null;
    const answered = value != null && value !== "";

    if (q.kind === "text") {
      return {
        externalId: q.external_id,
        pillar: q.pillar,
        questionTitle: pickText(q.title, locale),
        chosenLetter: null,
        chosenText: answered ? value : null,
        answered,
      };
    }

    const option = value
      ? q.options.find((o) => o.letter === value)
      : undefined;
    return {
      externalId: q.external_id,
      pillar: q.pillar,
      questionTitle: pickText(q.title, locale),
      chosenLetter: value,
      chosenText: option ? pickText(option.text, locale) : null,
      answered,
    };
  });
}

export interface RespondentIdentity {
  respondentName: string | null;
  respondentEmail: string | null;
  profileName?: string | null;
  anonSessionId: string | null;
  userId: string | null;
}

/** Human label for a respondent, preferring a real name, then email, then id. */
export function respondentLabel(run: RespondentIdentity): string {
  const name = run.respondentName?.trim() || run.profileName?.trim();
  if (name) return name;
  if (run.respondentEmail?.trim()) return run.respondentEmail.trim();
  if (run.anonSessionId) return `Anonymous · ${run.anonSessionId.slice(0, 12)}`;
  if (run.userId) return `User ${run.userId.slice(0, 8)}`;
  return "Anonymous";
}
