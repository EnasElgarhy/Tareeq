import { describe, expect, it } from "vitest";
import { seedQuestions } from "../content/seed";
import { computeScore } from "./index";
import type { CompassResult, Question } from "./types";

const questions = seedQuestions.map((question) => ({
  ...question,
  options: question.options.map((option) => ({ ...option })),
})) as unknown as Question[];

function buildAnswers(pick: (question: Question) => string | undefined) {
  const answers: Record<string, string> = {};

  for (const question of questions) {
    if (question.options.length === 0) continue;

    const letter = pick(question);
    if (letter) answers[question.externalId] = letter;
  }

  return answers;
}

function summarize(result: CompassResult) {
  return {
    topCluster: result.topCluster,
    topClusterScore: result.cluster[result.topCluster],
    archetype: result.archetype,
    drivers: result.driverRanked.slice(0, 2).map(([code, count]) => ({
      code,
      name: result.driverNames[code],
      count,
    })),
    clusterTop: result.clusterRanked.slice(0, 5),
    driverCounts: result.driver,
    axes: result.axes,
  };
}

const techLeaningClusterAnswers: Record<string, string> = {
  Q1: "D",
  Q2: "C",
  Q3: "C",
  Q4: "D",
  Q5: "D",
  Q6: "B",
  Q7: "D",
  Q8: "B",
  Q9: "B",
  Q10: "B",
  Q11: "B",
  Q12: "B",
  Q13: "B",
  Q14: "C",
  Q15: "A",
  Q16: "B",
};

const techLeaningRewardAnswers: Record<string, string> = {
  Q25: "B",
  Q26: "B",
  Q27: "A",
  Q28: "A",
  Q29: "A",
  Q30: "A",
  Q31: "B",
  Q32: "A",
  Q33: "B",
  Q34: "A",
};

const artsPeopleClusterAnswers: Record<string, string> = {
  Q1: "C",
  Q2: "B",
  Q3: "D",
  Q4: "A",
  Q5: "C",
  Q6: "C",
  Q7: "C",
  Q8: "D",
  Q9: "C",
  Q10: "C",
  Q11: "A",
  Q12: "C",
  Q13: "A",
  Q14: "A",
  Q15: "B",
  Q16: "D",
};

const artsPeopleRewardAnswers: Record<string, string> = {
  Q25: "B",
  Q26: "A",
  Q27: "B",
  Q28: "A",
  Q29: "A",
  Q30: "B",
  Q31: "A",
  Q32: "B",
  Q33: "A",
  Q34: "B",
};

describe("computeScore", () => {
  it("pins the All-A persona", () => {
    const result = computeScore(
      buildAnswers(() => "A"),
      questions,
    );

    expect(summarize(result)).toMatchInlineSnapshot(`
      {
        "archetype": "Precisionist",
        "axes": {
          "environment": {
            "dynamic": 3,
            "predictable": 0,
          },
          "processing": "STRUCT",
          "scope": "DEEP",
          "social": {
            "collaborative": 3,
            "independent": 0,
          },
        },
        "clusterTop": [
          [
            "LAW",
            7,
          ],
          [
            "BUS",
            3,
          ],
          [
            "ART",
            2,
          ],
          [
            "PPL",
            2,
          ],
          [
            "TECH",
            1,
          ],
        ],
        "driverCounts": {
          "AUT": 1,
          "IMP": 0,
          "MAS": 3,
          "REC": 3,
          "STA": 3,
        },
        "drivers": [
          {
            "code": "REC",
            "count": 3,
            "name": "Recognition",
          },
          {
            "code": "MAS",
            "count": 3,
            "name": "Mastery",
          },
        ],
        "topCluster": "LAW",
        "topClusterScore": 7,
      }
    `);
  });

  it("pins the All-D/B persona", () => {
    const result = computeScore(
      buildAnswers((question) =>
        question.pillar === 1 ? "D" : question.pillar >= 2 ? "B" : "A",
      ),
      questions,
    );

    expect(summarize(result)).toMatchInlineSnapshot(`
      {
        "archetype": "Catalyst",
        "axes": {
          "environment": {
            "dynamic": 0,
            "predictable": 3,
          },
          "processing": "FLEX",
          "scope": "BROAD",
          "social": {
            "collaborative": 0,
            "independent": 3,
          },
        },
        "clusterTop": [
          [
            "TECH",
            4,
          ],
          [
            "BUS",
            3,
          ],
          [
            "PPL",
            3,
          ],
          [
            "SCI",
            2,
          ],
          [
            "LAW",
            2,
          ],
        ],
        "driverCounts": {
          "AUT": 3,
          "IMP": 4,
          "MAS": 1,
          "REC": 2,
          "STA": 0,
        },
        "drivers": [
          {
            "code": "IMP",
            "count": 4,
            "name": "Impact",
          },
          {
            "code": "AUT",
            "count": 3,
            "name": "Autonomy",
          },
        ],
        "topCluster": "TECH",
        "topClusterScore": 4,
      }
    `);
  });

  it("pins the Tech-leaning persona", () => {
    const result = computeScore(
      buildAnswers(
        (question) =>
          techLeaningClusterAnswers[question.externalId] ??
          (question.pillar === 2
            ? "B"
            : (techLeaningRewardAnswers[question.externalId] ?? "A")),
      ),
      questions,
    );

    expect(summarize(result)).toMatchInlineSnapshot(`
      {
        "archetype": "Catalyst",
        "axes": {
          "environment": {
            "dynamic": 3,
            "predictable": 0,
          },
          "processing": "FLEX",
          "scope": "BROAD",
          "social": {
            "collaborative": 3,
            "independent": 0,
          },
        },
        "clusterTop": [
          [
            "TECH",
            6,
          ],
          [
            "ENG",
            4,
          ],
          [
            "SCI",
            4,
          ],
          [
            "BUS",
            2,
          ],
          [
            "ART",
            0,
          ],
        ],
        "driverCounts": {
          "AUT": 4,
          "IMP": 1,
          "MAS": 3,
          "REC": 0,
          "STA": 2,
        },
        "drivers": [
          {
            "code": "AUT",
            "count": 4,
            "name": "Autonomy",
          },
          {
            "code": "MAS",
            "count": 3,
            "name": "Mastery",
          },
        ],
        "topCluster": "TECH",
        "topClusterScore": 6,
      }
    `);
  });

  it("pins the Arts/People-leaning persona", () => {
    const result = computeScore(
      buildAnswers(
        (question) =>
          artsPeopleClusterAnswers[question.externalId] ??
          (question.pillar === 2
            ? "A"
            : (artsPeopleRewardAnswers[question.externalId] ?? "A")),
      ),
      questions,
    );

    expect(summarize(result)).toMatchInlineSnapshot(`
      {
        "archetype": "Precisionist",
        "axes": {
          "environment": {
            "dynamic": 3,
            "predictable": 0,
          },
          "processing": "STRUCT",
          "scope": "DEEP",
          "social": {
            "collaborative": 3,
            "independent": 0,
          },
        },
        "clusterTop": [
          [
            "ART",
            8,
          ],
          [
            "PPL",
            5,
          ],
          [
            "LAW",
            2,
          ],
          [
            "SCI",
            1,
          ],
          [
            "TECH",
            0,
          ],
        ],
        "driverCounts": {
          "AUT": 0,
          "IMP": 4,
          "MAS": 2,
          "REC": 2,
          "STA": 2,
        },
        "drivers": [
          {
            "code": "IMP",
            "count": 4,
            "name": "Impact",
          },
          {
            "code": "REC",
            "count": 2,
            "name": "Recognition",
          },
        ],
        "topCluster": "ART",
        "topClusterScore": 8,
      }
    `);
  });
});
