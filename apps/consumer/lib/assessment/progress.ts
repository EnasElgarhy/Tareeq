import type { CompassResult } from "@/lib/scoring";
import type { AssessmentVersionRef } from "@/lib/assessment/content";

export const assessmentStorageKey = "tareeq.assessment.v4";

export type LocalAssessmentProgress = {
  assessmentId: string;
  versionId: string | null;
  versionLabel: string;
  answers: Record<string, string>;
  currentIndex: number;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  result?: CompassResult;
};

type CreateLocalAssessmentOptions = {
  assessmentId?: string;
  now?: Date;
  versionId?: string | null;
  versionLabel?: string;
};

function createAssessmentId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `local-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function isAnswerRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every((entry) => typeof entry === "string")
  );
}

function parseStoredAssessment(value: unknown): LocalAssessmentProgress | null {
  if (typeof value !== "object" || value === null) return null;

  const candidate = value as Partial<LocalAssessmentProgress>;

  const valid =
    typeof candidate.assessmentId === "string" &&
    typeof candidate.versionLabel === "string" &&
    isAnswerRecord(candidate.answers) &&
    typeof candidate.currentIndex === "number" &&
    typeof candidate.startedAt === "string" &&
    typeof candidate.updatedAt === "string";
  if (!valid) return null;

  return {
    ...(candidate as LocalAssessmentProgress),
    versionId:
      typeof candidate.versionId === "string" ? candidate.versionId : null,
  };
}

export function createLocalAssessment({
  assessmentId = createAssessmentId(),
  now = new Date(),
  versionId = null,
  versionLabel = "v4",
}: CreateLocalAssessmentOptions = {}): LocalAssessmentProgress {
  const timestamp = now.toISOString();

  return {
    assessmentId,
    versionId,
    versionLabel,
    answers: {},
    currentIndex: 0,
    startedAt: timestamp,
    updatedAt: timestamp,
  };
}

export function mergeLocalAnswer(
  progress: LocalAssessmentProgress,
  questionExternalId: string,
  value: string,
  index: number,
  now = new Date(),
): LocalAssessmentProgress {
  return {
    ...progress,
    answers: {
      ...progress.answers,
      [questionExternalId]: value,
    },
    currentIndex: index,
    updatedAt: now.toISOString(),
  };
}

export function answeredQuestionCount(
  progress: LocalAssessmentProgress | null,
) {
  if (!progress) return 0;
  return Object.keys(progress.answers).filter(
    (key) => progress.answers[key] !== "",
  ).length;
}

export function getResumeQuestionIndex(
  progress: LocalAssessmentProgress | null,
  totalQuestions: number,
) {
  if (!progress) return 0;
  if (progress.completedAt)
    return Math.min(progress.currentIndex, totalQuestions - 1);

  return Math.min(answeredQuestionCount(progress), totalQuestions - 1);
}

export function readLocalAssessment() {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(assessmentStorageKey);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return parseStoredAssessment(parsed);
  } catch {
    return null;
  }
}

export function writeLocalAssessment(progress: LocalAssessmentProgress) {
  if (typeof window === "undefined") return progress;

  window.localStorage.setItem(assessmentStorageKey, JSON.stringify(progress));
  return progress;
}

export function ensureLocalAssessment(version?: AssessmentVersionRef) {
  const existing = readLocalAssessment();
  if (existing) {
    if (!version) return existing;
    if (
      existing.versionId === version.versionId &&
      existing.versionLabel === version.versionLabel
    ) {
      return existing;
    }
    if (
      existing.versionId === null &&
      existing.versionLabel === version.versionLabel
    ) {
      return writeLocalAssessment({
        ...existing,
        versionId: version.versionId,
      });
    }
  }

  return writeLocalAssessment(createLocalAssessment(version));
}

export function saveLocalAnswer(
  questionExternalId: string,
  value: string,
  index: number,
  version?: AssessmentVersionRef,
) {
  const next = mergeLocalAnswer(
    ensureLocalAssessment(version),
    questionExternalId,
    value,
    index,
  );

  return writeLocalAssessment(next);
}

export function completeLocalAssessment(
  result: CompassResult,
  currentIndex: number,
  version?: AssessmentVersionRef,
) {
  const now = new Date().toISOString();
  const next: LocalAssessmentProgress = {
    ...ensureLocalAssessment(version),
    currentIndex,
    completedAt: now,
    updatedAt: now,
    result,
  };

  return writeLocalAssessment(next);
}

export function resetLocalAssessment() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(assessmentStorageKey);
}
