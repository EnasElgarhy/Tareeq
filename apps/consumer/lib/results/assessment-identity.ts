import {
  readResultRegistration,
  writeResultRegistration,
} from "@/lib/results/storage";

function readAssessmentId(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return null;
  const assessmentId = (value as { assessmentId?: unknown }).assessmentId;
  return typeof assessmentId === "string" ? assessmentId : null;
}

export async function resolveCurrentAssessmentId(
  versionId: string | null,
): Promise<string | null> {
  const savedRegistration = readResultRegistration();
  if (!savedRegistration) return null;
  if (savedRegistration.assessmentId) return savedRegistration.assessmentId;
  if (!versionId) return null;

  try {
    const response = await fetch(
      `/api/assessments/current?${new URLSearchParams({ versionId })}`,
    );
    if (!response.ok) return null;

    const assessmentId = readAssessmentId(await response.json());
    if (!assessmentId) return null;

    const latestRegistration = readResultRegistration();
    if (latestRegistration?.assessmentId) {
      return latestRegistration.assessmentId;
    }
    if (latestRegistration) {
      writeResultRegistration({ ...latestRegistration, assessmentId });
    }
    return assessmentId;
  } catch {
    return null;
  }
}
