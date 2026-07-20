import { describe, expect, it } from "vitest";
import acceptanceProfiles from "../../../../docs/acceptance/core-scoring-acceptance-profiles.json";
import { seedQuestions } from "../content/seed";
import { computeScore } from "./index";
import type { Question } from "./types";

const questions = seedQuestions.map((question) => ({
  ...question,
  options: question.options.map((option) => ({ ...option })),
})) as unknown as Question[];

function buildAnswers(overrides: Partial<Record<string, string>>) {
  return Object.fromEntries(
    questions
      .filter((question) => question.pillar > 0 && question.options.length > 0)
      .map((question) => [
        question.externalId,
        overrides[question.externalId] ?? acceptanceProfiles.defaultAnswer,
      ]),
  );
}

function acceptanceResult(result: ReturnType<typeof computeScore>) {
  return {
    topCluster: result.topCluster,
    primaryClusterScore: result.primaryClusterScore,
    confidencePercentage: result.confidencePercentage,
    confidenceLabel: result.confidenceLabel,
    isMultiCurious: result.isMultiCurious,
    multiCuriousClusters: result.multiCuriousClusters,
    archetype: result.archetype,
    ecosystemFit: result.ecosystemFit,
    clusterRaw: result.clusterRaw,
    clusterBonus: result.clusterBonus,
    clusterFinal: result.clusterFinal,
    driver: result.driver,
    primaryDrivers: result.primaryDrivers,
    axes: result.axes,
  };
}

describe("CORE scoring acceptance profiles", () => {
  it.each(acceptanceProfiles.profiles)(
    "$id produces its exact approved result",
    (profile) => {
      const answers = buildAnswers(profile.overrides);

      expect(Object.keys(answers)).toHaveLength(40);
      expect(acceptanceResult(computeScore(answers, questions))).toEqual(
        profile.expected,
      );
    },
  );
});
