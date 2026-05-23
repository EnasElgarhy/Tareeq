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
    topClusterScore: result.primaryClusterScore,
    confidence: {
      label: result.confidenceLabel,
      percentage: result.confidencePercentage,
    },
    ecosystemFit: result.ecosystemFit,
    archetype: result.archetype,
    drivers: result.driverRanked.slice(0, 2).map(([code, count]) => ({
      code,
      name: result.driverNames[code],
      count,
    })),
    primaryDrivers: result.primaryDrivers.map(
      (code) => result.driverNames[code],
    ),
    clusterTop: result.clusterRanked.slice(0, 5),
    rawClusterTop: result.clusterRankedRaw.slice(0, 5),
    driverCounts: result.driver,
    axes: result.axes,
  };
}

function findQuestion(externalId: string) {
  const question = questions.find((entry) => entry.externalId === externalId);
  if (!question) throw new Error(`Missing question ${externalId}`);
  return question;
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
  it("matches the May 21 Pillar 1 cluster mapping corrections", () => {
    expect(
      findQuestion("Q7").options.find((option) => option.letter === "D")
        ?.clusterCode,
    ).toBe("ART");
    expect(
      findQuestion("Q15").options.find((option) => option.letter === "B")
        ?.clusterCode,
    ).toBe("LAW");
  });

  it("uses the specified tie-breakers for operations", () => {
    const result = computeScore(
      buildAnswers((question) => {
        const tieAnswers: Record<string, string> = {
          Q17: "A",
          Q18: "B",
          Q19: "A",
          Q20: "B",
          Q21: "A",
          Q22: "B",
          Q23: "B",
          Q24: "A",
        };

        return tieAnswers[question.externalId] ?? "A";
      }),
      questions,
    );

    expect(result.axes.processing).toBe("FLEX");
    expect(result.axes.scope).toBe("DEEP");
    expect(result.archetype).toBe("Explorer");
  });

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
            3.5,
          ],
          [
            "PPL",
            2.5,
          ],
          [
            "ART",
            2,
          ],
          [
            "TECH",
            1,
          ],
        ],
        "confidence": {
          "label": "High",
          "percentage": 44,
        },
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
        "ecosystemFit": "High-Energy Team Player",
        "primaryDrivers": [
          "Recognition",
          "Mastery",
          "Stability",
        ],
        "rawClusterTop": [
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
            "PPL",
            3.5,
          ],
          [
            "TECH",
            3,
          ],
          [
            "BUS",
            3,
          ],
          [
            "SCI",
            2.5,
          ],
          [
            "ART",
            2.5,
          ],
        ],
        "confidence": {
          "label": "Low",
          "percentage": 22,
        },
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
        "ecosystemFit": "Solo Specialist",
        "primaryDrivers": [
          "Impact",
        ],
        "rawClusterTop": [
          [
            "TECH",
            3,
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
            "ART",
            2,
          ],
        ],
        "topCluster": "PPL",
        "topClusterScore": 3.5,
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
            5,
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
            2.5,
          ],
          [
            "ART",
            1.5,
          ],
        ],
        "confidence": {
          "label": "Moderate",
          "percentage": 31,
        },
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
        "ecosystemFit": "High-Energy Team Player",
        "primaryDrivers": [
          "Autonomy",
        ],
        "rawClusterTop": [
          [
            "TECH",
            5,
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
            1,
          ],
        ],
        "topCluster": "TECH",
        "topClusterScore": 5,
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
            4.5,
          ],
          [
            "LAW",
            3,
          ],
          [
            "SCI",
            1.5,
          ],
          [
            "ENG",
            0.5,
          ],
        ],
        "confidence": {
          "label": "High",
          "percentage": 50,
        },
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
        "ecosystemFit": "High-Energy Team Player",
        "primaryDrivers": [
          "Impact",
        ],
        "rawClusterTop": [
          [
            "ART",
            8,
          ],
          [
            "PPL",
            4,
          ],
          [
            "LAW",
            3,
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
        "topCluster": "ART",
        "topClusterScore": 8,
      }
    `);
  });
});
