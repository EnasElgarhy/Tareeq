import { describe, expect, it } from "vitest";
import { seedQuestions } from "../content/seed";
import { computeScore } from "./index";
import type { Question } from "./types";

const questions = seedQuestions.map((question) => ({
  ...question,
  options: question.options.map((option) => ({ ...option })),
})) as unknown as Question[];

/** Small deterministic PRNG (not Math.random()) so a given seed always
 * reproduces the exact same answer set — needed for the determinism
 * check below to be meaningful. */
function randomAnswers(seed: number): Record<string, string> {
  let state = seed;
  function next() {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  }
  const answers: Record<string, string> = {};
  for (const question of questions) {
    if (question.options.length === 0) continue;
    const index = Math.floor(next() * question.options.length);
    answers[question.externalId] = question.options[index].letter;
  }
  return answers;
}

const VALID_CLUSTERS = new Set(["TECH", "ENG", "SCI", "ART", "BUS", "LAW", "PPL", "ENV"]);
const VALID_CONFIDENCE = new Set(["High", "Moderate", "Low"]);

describe("computeScore — randomized fuzz coverage", () => {
  it("is deterministic: the same answers always produce the same result", () => {
    const answers = randomAnswers(42);
    const first = computeScore(answers, questions);
    const second = computeScore(answers, questions);
    expect(second).toEqual(first);
  });

  it("produces a well-formed CompassResult for many random answer sets", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const result = computeScore(randomAnswers(seed), questions);
      expect(VALID_CLUSTERS.has(result.topCluster)).toBe(true);
      expect(VALID_CONFIDENCE.has(result.confidenceLabel)).toBe(true);
      expect(result.confidencePercentage).toBeGreaterThanOrEqual(0);
      expect(result.confidencePercentage).toBeLessThanOrEqual(100);
      expect(result.clusterRanked).toHaveLength(8);
      expect(result.primaryDrivers.length).toBeGreaterThan(0);
    }
  });

  it("produces a genuinely varied spread of top clusters across random answer sets — not hardcoded to one value", () => {
    const seenClusters = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      seenClusters.add(computeScore(randomAnswers(seed), questions).topCluster);
    }
    // With 8 possible clusters and 100 random draws, landing on only one
    // distinct topCluster would mean the scorer isn't actually responding
    // to input — this is the direct "results genuinely differ" check.
    expect(seenClusters.size).toBeGreaterThan(1);
  });

  it("produces a varied spread of archetypes and ecosystem fits across random answer sets", () => {
    const seenArchetypes = new Set<string>();
    const seenEcosystemFits = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const result = computeScore(randomAnswers(seed), questions);
      seenArchetypes.add(result.archetype);
      seenEcosystemFits.add(result.ecosystemFit);
    }
    expect(seenArchetypes.size).toBeGreaterThan(1);
    expect(seenEcosystemFits.size).toBeGreaterThan(1);
  });

  it("changing a single cluster answer can change the outcome (the scorer is actually sensitive to input, not ignoring it)", () => {
    const base = randomAnswers(7);
    const baseResult = computeScore(base, questions);

    let anyChange = false;
    for (const question of questions.filter((q) => q.pillar === 1)) {
      const currentLetter = base[question.externalId];
      const alternative = question.options.find((option) => option.letter !== currentLetter);
      if (!alternative) continue;

      const modified = { ...base, [question.externalId]: alternative.letter };
      const modifiedResult = computeScore(modified, questions);
      if (
        modifiedResult.topCluster !== baseResult.topCluster ||
        modifiedResult.primaryClusterScore !== baseResult.primaryClusterScore
      ) {
        anyChange = true;
        break;
      }
    }
    expect(anyChange).toBe(true);
  });
});
