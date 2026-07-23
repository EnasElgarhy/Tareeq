import { describe, expect, it } from "vitest";
import { mapCmsAssessmentQuestions } from "./content";

describe("mapCmsAssessmentQuestions", () => {
  it("maps, sorts, localizes, and excludes archived CMS questions", () => {
    const questions = mapCmsAssessmentQuestions([
      {
        external_id: "Q2",
        pillar: 1,
        position: 1,
        kind: "single",
        title: { en: "Second", ar: "الثاني" },
        axis: null,
        is_archived: false,
        question_options: [
          {
            letter: "B",
            position: 1,
            text: { en: "Beta" },
            cluster_code: "SCI",
            driver_code: null,
            axis_value: null,
          },
          {
            letter: "A",
            position: 0,
            text: { en: "Alpha" },
            cluster_code: "TECH",
            driver_code: null,
            axis_value: null,
          },
        ],
      },
      {
        external_id: "Q1",
        pillar: 1,
        position: 0,
        kind: "binary",
        title: { en: "First" },
        axis: "PROC",
        question_options: [
          {
            letter: "A",
            position: 0,
            text: { en: "Structured" },
            cluster_code: null,
            driver_code: null,
            axis_value: "STRUCT",
          },
        ],
      },
      {
        external_id: "OLD",
        pillar: 1,
        position: 2,
        kind: "text",
        title: { en: "Archived" },
        axis: null,
        is_archived: true,
        question_options: [],
      },
    ]);

    expect(questions.map((question) => question.externalId)).toEqual([
      "Q1",
      "Q2",
    ]);
    expect(questions[0]).toMatchObject({ axis: "PROC" });
    expect(questions[1]?.title.ar).toBe("الثاني");
    expect(questions[1]?.options.map((option) => option.letter)).toEqual([
      "A",
      "B",
    ]);
  });

  it("rejects unsupported scoring codes instead of silently mis-scoring", () => {
    expect(() =>
      mapCmsAssessmentQuestions([
        {
          external_id: "Q1",
          pillar: 1,
          position: 0,
          kind: "single",
          title: { en: "Question" },
          axis: null,
          question_options: [
            {
              letter: "A",
              position: 0,
              text: { en: "Answer" },
              cluster_code: "UNKNOWN",
              driver_code: null,
              axis_value: null,
            },
          ],
        },
      ]),
    ).toThrow("Invalid CMS cluster code");
  });
});
