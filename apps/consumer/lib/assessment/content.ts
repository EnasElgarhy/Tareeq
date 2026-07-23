import { contentVersion } from "@/lib/content/seed";
import { assessmentQuestions } from "@/lib/assessment/questions";
import {
  clusterCodes,
  driverCodes,
  type AxisCode,
  type AxisValue,
  type ClusterCode,
  type DriverCode,
  type LocalizedText,
  type Question,
  type QuestionKind,
} from "@/lib/scoring/types";

export const assessmentVersionCookieName = "tareeq-assessment-version";

export type AssessmentContentSource = "cms" | "seed";

export interface AssessmentContentSnapshot {
  versionId: string | null;
  versionLabel: string;
  source: AssessmentContentSource;
  questions: Question[];
}

export interface AssessmentVersionRef {
  versionId: string | null;
  versionLabel: string;
}

export interface CmsQuestionOptionRow {
  letter: unknown;
  position: unknown;
  text: unknown;
  cluster_code: unknown;
  driver_code: unknown;
  axis_value: unknown;
}

export interface CmsQuestionRow {
  external_id: unknown;
  pillar: unknown;
  position: unknown;
  kind: unknown;
  title: unknown;
  axis: unknown;
  is_archived?: unknown;
  question_options?: unknown;
}

const questionKinds = new Set<QuestionKind>([
  "single",
  "binary",
  "select",
  "text",
]);
const axes = new Set<AxisCode>(["PROC", "SCOPE", "SOC", "ENV"]);
const axisValues = new Set<AxisValue>([
  "STRUCT",
  "FLEX",
  "DEEP",
  "BROAD",
  "COL",
  "IND",
  "DYN",
  "PRE",
]);
const clusters = new Set<ClusterCode>(clusterCodes);
const drivers = new Set<DriverCode>(driverCodes);

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid CMS ${field}.`);
  }
  return value.trim();
}

function localizedText(value: unknown, field: string): LocalizedText {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid CMS ${field}.`);
  }

  const entries = Object.entries(value).filter(
    (entry): entry is [string, string] =>
      typeof entry[1] === "string" && Boolean(entry[1].trim()),
  );
  if (entries.length === 0) throw new Error(`Empty CMS ${field}.`);
  return Object.fromEntries(entries);
}

function optionalCode<T extends string>(
  value: unknown,
  valid: Set<T>,
  field: string,
): T | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value !== "string" || !valid.has(value as T)) {
    throw new Error(`Invalid CMS ${field}: ${String(value)}.`);
  }
  return value as T;
}

/** Convert raw Supabase rows into the scoring engine's trusted question type. */
export function mapCmsAssessmentQuestions(rows: CmsQuestionRow[]): Question[] {
  const questions = rows
    .filter((row) => row.is_archived !== true)
    .map((row): Question => {
      const pillar = row.pillar;
      if (
        !Number.isInteger(pillar) ||
        Number(pillar) < 0 ||
        Number(pillar) > 4
      ) {
        throw new Error(`Invalid CMS pillar: ${String(pillar)}.`);
      }

      const position = row.position;
      if (!Number.isInteger(position) || Number(position) < 0) {
        throw new Error(`Invalid CMS position: ${String(position)}.`);
      }

      const kind = row.kind;
      if (
        typeof kind !== "string" ||
        !questionKinds.has(kind as QuestionKind)
      ) {
        throw new Error(`Unsupported CMS question kind: ${String(kind)}.`);
      }

      const rawOptions = Array.isArray(row.question_options)
        ? (row.question_options as CmsQuestionOptionRow[])
        : [];
      const options = rawOptions
        .map((option) => ({
          letter: requiredString(option.letter, "option letter"),
          position:
            Number.isInteger(option.position) && Number(option.position) >= 0
              ? Number(option.position)
              : 0,
          text: localizedText(option.text, "option text"),
          clusterCode: optionalCode(
            option.cluster_code,
            clusters,
            "cluster code",
          ),
          driverCode: optionalCode(option.driver_code, drivers, "driver code"),
          axisValue: optionalCode(option.axis_value, axisValues, "axis value"),
        }))
        .sort((a, b) => a.position - b.position);

      return {
        externalId: requiredString(row.external_id, "external id"),
        pillar: Number(pillar) as Question["pillar"],
        position: Number(position),
        kind: kind as QuestionKind,
        title: localizedText(row.title, "question title"),
        axis: optionalCode(row.axis, axes, "axis"),
        options,
      };
    })
    .sort((a, b) => a.pillar - b.pillar || a.position - b.position);

  if (questions.length === 0)
    throw new Error("The CMS version has no questions.");
  const ids = questions.map((question) => question.externalId);
  if (new Set(ids).size !== ids.length) {
    throw new Error(
      "The CMS version contains duplicate external question ids.",
    );
  }
  return questions;
}

export function getSeedAssessmentContent(): AssessmentContentSnapshot {
  return {
    versionId: null,
    versionLabel: contentVersion.label,
    source: "seed",
    questions: assessmentQuestions,
  };
}

export function getAssessmentVersionRef(
  content: AssessmentContentSnapshot,
): AssessmentVersionRef {
  return {
    versionId: content.versionId,
    versionLabel: content.versionLabel,
  };
}

export function assessmentVersionCookieValue(ref: AssessmentVersionRef) {
  return ref.versionId ?? `seed:${encodeURIComponent(ref.versionLabel)}`;
}

export function seedLabelFromCookie(value: string) {
  if (!value.startsWith("seed:")) return null;
  try {
    return decodeURIComponent(value.slice(5));
  } catch {
    return null;
  }
}
