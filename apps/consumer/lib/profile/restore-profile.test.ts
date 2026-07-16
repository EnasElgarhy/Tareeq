import { beforeEach, describe, expect, it } from "vitest";
import { assessmentQuestions } from "@/lib/assessment/questions";
import {
  assessmentStorageKey,
  readLocalAssessment,
} from "@/lib/assessment/progress";
import { readProfileSnapshot } from "@/lib/profile/journey";
import {
  restoreProfileFromAssessment,
  type SavedAssessmentRecord,
} from "@/lib/profile/restore-profile";
import {
  generatedReportStorageKey,
  readGeneratedReport,
  readResultRegistration,
  resultRegistrationStorageKey,
} from "@/lib/results/storage";

function completeAnswers() {
  return Object.fromEntries(
    assessmentQuestions.map((question) => [
      question.externalId,
      question.options[0]?.letter ?? "A thoughtful response",
    ]),
  );
}

function savedAssessment(
  overrides: Partial<SavedAssessmentRecord> = {},
): SavedAssessmentRecord {
  return {
    id: "assessment-123",
    answers: completeAnswers(),
    completed_at: "2026-07-15T21:00:00.000Z",
    started_at: "2026-07-15T20:45:00.000Z",
    locale: "en",
    respondent_name: "Saved Name",
    respondent_email: "saved@example.com",
    ...overrides,
  };
}

describe("restoreProfileFromAssessment", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("rebuilds the local assessment, registration, and report from a completed account assessment", () => {
    const snapshot = restoreProfileFromAssessment({
      assessment: savedAssessment(),
      displayName: "Sarah Gouda",
      email: "sarah@example.com",
      locale: "en",
    });

    const progress = readLocalAssessment();
    const registration = readResultRegistration();
    const report = readGeneratedReport();

    expect(snapshot?.hasAnyResult).toBe(true);
    expect(progress).toMatchObject({
      assessmentId: "assessment-123",
      completedAt: "2026-07-15T21:00:00.000Z",
      currentIndex: assessmentQuestions.length - 1,
    });
    expect(progress?.result).toEqual(report?.score);
    expect(registration).toMatchObject({
      name: "Sarah Gouda",
      email: "sarah@example.com",
      verifiedAt: "2026-07-15T21:00:00.000Z",
    });
    expect(report).toMatchObject({
      generatedAt: "2026-07-15T21:00:00.000Z",
      source: "fallback",
      fallbackReason: "Restored from your saved assessment.",
    });
    expect(readProfileSnapshot().completedCount).toBe(1);
  });

  it("uses the saved respondent identity when account metadata is empty", () => {
    restoreProfileFromAssessment({
      assessment: savedAssessment(),
      displayName: "",
      email: "",
      locale: "ar",
    });

    expect(readResultRegistration()).toMatchObject({
      name: "Saved Name",
      email: "saved@example.com",
    });
    expect(readGeneratedReport()?.fallbackReason).toBe(
      "تمت الاستعادة من تقييمك المحفوظ.",
    );
  });

  it("does not unlock the dashboard for an incomplete or empty record", () => {
    const restored = restoreProfileFromAssessment({
      assessment: savedAssessment({ answers: {}, completed_at: null }),
      displayName: "Sarah Gouda",
      email: "sarah@example.com",
      locale: "en",
    });

    expect(restored).toBeNull();
    expect(window.localStorage.getItem(assessmentStorageKey)).toBeNull();
    expect(
      window.localStorage.getItem(resultRegistrationStorageKey),
    ).toBeNull();
    expect(window.localStorage.getItem(generatedReportStorageKey)).toBeNull();
  });
});
