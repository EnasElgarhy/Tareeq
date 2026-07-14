import { describe, expect, it } from "vitest";
import {
  answeredQuestionCount,
  createLocalAssessment,
  getResumeQuestionIndex,
  mergeLocalAnswer,
} from "./progress";

describe("local assessment progress", () => {
  it("creates a stable local draft shape", () => {
    expect(
      createLocalAssessment({
        assessmentId: "local-test",
        now: new Date("2026-05-11T12:00:00.000Z"),
      }),
    ).toEqual({
      assessmentId: "local-test",
      versionLabel: "v4",
      answers: {},
      currentIndex: 0,
      startedAt: "2026-05-11T12:00:00.000Z",
      updatedAt: "2026-05-11T12:00:00.000Z",
    });
  });

  it("merges answers without dropping earlier choices", () => {
    const draft = createLocalAssessment({
      assessmentId: "local-test",
      now: new Date("2026-05-11T12:00:00.000Z"),
    });

    const next = mergeLocalAnswer(
      mergeLocalAnswer(
        draft,
        "QD1",
        "B",
        0,
        new Date("2026-05-11T12:01:00.000Z"),
      ),
      "QD2",
      "Jordan",
      1,
      new Date("2026-05-11T12:02:00.000Z"),
    );

    expect(next.answers).toEqual({
      QD1: "B",
      QD2: "Jordan",
    });
    expect(answeredQuestionCount(next)).toBe(2);
    expect(getResumeQuestionIndex(next, 44)).toBe(2);
  });
});
