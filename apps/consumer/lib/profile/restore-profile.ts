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
import {
  CORE_QUESTION_SET_LABEL,
  coreAnswersFromLetters,
} from "@/lib/core-v2/assessment";
import { scoreCore } from "@/lib/core-v2/scoring";
import { writeCoreReport } from "@/lib/core-v2/storage";
import type { CoreResult } from "@/lib/core-v2/types";
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

  // A CORE 2.0 attempt (question set 5.1) restores the new report; scoring its
  // answers with the legacy rules would produce a meaningless legacy result.
  const coreResult = readStoredCoreResult(assessment.result, answers);
  if (coreResult) {
    return restoreCoreProfile({
      assessment,
      answers,
      coreResult,
      completedAt: assessment.completed_at,
      displayName,
      email,
    });
  }

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
    assessmentId: assessment.id,
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

/**
 * The CORE 2.0 result of a saved attempt: the stored result when it is one,
 * otherwise re-scored from answers that belong to question set 5.1.
 */
function readStoredCoreResult(
  value: unknown,
  answers: Record<string, string>,
): CoreResult | null {
  const stored = value as Partial<CoreResult> | null;
  if (stored && typeof stored === "object" && stored.scoringVersion === "2.0") {
    return stored as CoreResult;
  }
  if (!("P1-01" in answers)) return null;
  try {
    return scoreCore(coreAnswersFromLetters(answers));
  } catch {
    return null;
  }
}

function restoreCoreProfile({
  assessment,
  answers,
  coreResult,
  completedAt,
  displayName,
  email,
}: {
  assessment: SavedAssessmentRecord;
  answers: Record<string, string>;
  coreResult: CoreResult;
  completedAt: string;
  displayName: string;
  email: string;
}) {
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

  writeLocalAssessment({
    assessmentId: assessment.id,
    versionId: assessment.version_id ?? null,
    versionLabel: CORE_QUESTION_SET_LABEL,
    answers,
    currentIndex: Math.max(Object.keys(answers).length - 1, 0),
    startedAt: assessment.started_at ?? completedAt,
    updatedAt: completedAt,
    completedAt,
    coreResult,
  });
  writeResultRegistration({
    name: resolvedName,
    email: resolvedEmail,
    verifiedAt: completedAt,
    consent: savedRegistration?.consent ?? createEmptyResultConsent(),
    assessmentId: assessment.id,
  });
  writeCoreReport({
    generatedAt: completedAt,
    result: coreResult,
    isFlagged: false,
  });

  return readProfileSnapshot();
}
