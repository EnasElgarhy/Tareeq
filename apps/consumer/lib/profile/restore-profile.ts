import { assessmentQuestions } from "@/lib/assessment/questions";
import {
  type LocalAssessmentProgress,
  writeLocalAssessment,
} from "@/lib/assessment/progress";
import type { Locale } from "@/lib/i18n/locale";
import { readProfileSnapshot } from "@/lib/profile/journey";
import { buildFallbackReport } from "@/lib/results/framework";
import {
  createEmptyResultConsent,
  readResultRegistration,
  writeGeneratedReport,
  writeResultRegistration,
} from "@/lib/results/storage";
import { computeScore } from "@/lib/scoring";
import type { CompassResult } from "@/lib/scoring";

export interface SavedAssessmentRecord {
  id: string;
  answers: unknown;
  completed_at: string | null;
  started_at: string | null;
  locale: string | null;
  respondent_name: string | null;
  respondent_email: string | null;
  version_id?: string | null;
  result?: unknown;
}

function readStoredResult(value: unknown): CompassResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<CompassResult>;
  if (
    typeof candidate.topCluster !== "string" ||
    typeof candidate.archetype !== "string" ||
    typeof candidate.confidencePercentage !== "number" ||
    !candidate.axes
  ) {
    return null;
  }
  return candidate as CompassResult;
}

function readAnswers(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const answers = Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );

  return Object.keys(answers).length > 0 ? answers : null;
}

export function restoreProfileFromAssessment({
  assessment,
  displayName,
  email,
  locale,
}: {
  assessment: SavedAssessmentRecord;
  displayName: string;
  email: string;
  locale: Locale;
}) {
  const answers = readAnswers(assessment.answers);
  if (!answers || !assessment.id || !assessment.completed_at) return null;

  const result =
    readStoredResult(assessment.result) ??
    computeScore(answers, assessmentQuestions);
  const completedAt = assessment.completed_at;
  const startedAt = assessment.started_at ?? completedAt;
  const savedRegistration = readResultRegistration();
  const resolvedEmail =
    email.trim() ||
    assessment.respondent_email?.trim() ||
    savedRegistration?.email ||
    "";
  const resolvedName =
    displayName.trim() ||
    assessment.respondent_name?.trim() ||
    savedRegistration?.name ||
    resolvedEmail.split("@")[0] ||
    "You";

  const progress: LocalAssessmentProgress = {
    assessmentId: assessment.id,
    versionId: assessment.version_id ?? null,
    versionLabel: "v4",
    answers,
    currentIndex: Math.max(Object.keys(answers).length - 1, 0),
    startedAt,
    updatedAt: completedAt,
    completedAt,
    result,
  };

  writeLocalAssessment(progress);
  writeResultRegistration({
    name: resolvedName,
    email: resolvedEmail,
    verifiedAt: completedAt,
    consent: savedRegistration?.consent ?? createEmptyResultConsent(),
  });
  writeGeneratedReport({
    ...buildFallbackReport({
      result,
      name: resolvedName,
      locale,
      fallbackReason:
        locale === "ar"
          ? "تمت الاستعادة من تقييمك المحفوظ."
          : "Restored from your saved assessment.",
    }),
    generatedAt: completedAt,
  });

  return readProfileSnapshot();
}
