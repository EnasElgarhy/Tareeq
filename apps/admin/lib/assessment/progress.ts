import type { CompassResult } from "@/lib/scoring";

export const assessmentStorageKey = "tareeq.assessment.v4";

export type LocalAssessmentProgress = {
  assessmentId: string;
  versionLabel: "v4";
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

function isStoredAssessment(value: unknown): value is LocalAssessmentProgress {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Partial<LocalAssessmentProgress>;

  return (
    typeof candidate.assessmentId === "string" &&
    candidate.versionLabel === "v4" &&
    isAnswerRecord(candidate.answers) &&
    typeof candidate.currentIndex === "number" &&
    typeof candidate.startedAt === "string" &&
    typeof candidate.updatedAt === "string"
  );
}

export function createLocalAssessment({
  assessmentId = createAssessmentId(),
  now = new Date(),
}: CreateLocalAssessmentOptions = {}): LocalAssessmentProgress {
  const timestamp = now.toISOString();

  return {
    assessmentId,
    versionLabel: "v4",
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
    return isStoredAssessment(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeLocalAssessment(progress: LocalAssessmentProgress) {
  if (typeof window === "undefined") return progress;

  window.localStorage.setItem(assessmentStorageKey, JSON.stringify(progress));
  return progress;
}

export function ensureLocalAssessment() {
  const existing = readLocalAssessment();
  if (existing) return existing;

  return writeLocalAssessment(createLocalAssessment());
}

export function saveLocalAnswer(
  questionExternalId: string,
  value: string,
  index: number,
) {
  const next = mergeLocalAnswer(
    ensureLocalAssessment(),
    questionExternalId,
    value,
    index,
  );

  return writeLocalAssessment(next);
}

export function completeLocalAssessment(
  result: CompassResult,
  currentIndex: number,
) {
  const now = new Date().toISOString();
  const next: LocalAssessmentProgress = {
    ...ensureLocalAssessment(),
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
