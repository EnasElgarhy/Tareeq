import { describe, expect, it } from "vitest";
import { getAssessmentReadiness } from "@/lib/admin/assessment-readiness";

function completeInput(): Parameters<typeof getAssessmentReadiness>[0] {
  return {
    supportedLocales: ["en", "ar"],
    categories: [{ code: "CREATE", name: { en: "Creator", ar: "مبدع" } }],
    questions: [
      {
        externalId: "Q1",
        title: { en: "What energises you?", ar: "ما الذي يمنحك الطاقة؟" },
        options: [
          {
            letter: "A",
            text: { en: "Making things", ar: "صنع الأشياء" },
            categoryCode: "CREATE",
          },
        ],
      },
    ],
    profiles: [
      {
        id: "profile-1",
        code: "CREATOR",
        name: { en: "Creator", ar: "مبدع" },
        categoryCode: "CREATE",
      },
    ],
    strategy: "highest_score_wins",
    ruleCount: 0,
  };
}

describe("getAssessmentReadiness", () => {
  it("marks a complete assessment ready for review and publishing", () => {
    const result = getAssessmentReadiness(completeInput());

    expect(result.isReadyToPublish).toBe(true);
    expect(result.steps).toEqual({
      questions: "complete",
      scoring: "complete",
      translations: "complete",
      preview: "ready",
    });
  });

  it("surfaces unmapped answers, scoring gaps, and missing translations", () => {
    const input = completeInput();
    input.questions[0].options[0].categoryCode = null;
    input.profiles = [];
    delete input.questions[0].title.ar;

    const result = getAssessmentReadiness(input);

    expect(result.isReadyToPublish).toBe(false);
    expect(result.unmappedAnswerCount).toBe(1);
    expect(result.scoringIssues).toContain("Add at least one result profile.");
    expect(result.translationGaps).toContainEqual({
      kind: "question",
      ref: "Q1",
      field: "title",
      locale: "ar",
    });
    expect(result.steps.questions).toBe("attention");
    expect(result.steps.preview).toBe("todo");
  });
});
