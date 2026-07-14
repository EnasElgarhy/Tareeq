import { describe, expect, it } from "vitest";
import { seedQuestions } from "../content/seed";
import { computeScore } from "./index";
import type { ClusterCode, DriverCode, Question } from "./types";

/**
 * The 5 validation profiles from scoring_logic.docx, asserted against the
 * real engine. Answers are built by SEMANTIC selection (by clusterCode /
 * driverCode / axisValue), so they're robust to option-letter ordering.
 */

const questions = seedQuestions.map((question) => ({
  ...question,
  options: question.options.map((option) => ({ ...option })),
})) as unknown as Question[];

function build(pick: (question: Question) => string | undefined) {
  const answers: Record<string, string> = {};
  for (const question of questions) {
    if (question.options.length === 0) continue;
    const letter = pick(question);
    if (letter) answers[question.externalId] = letter;
  }
  return answers;
}

const first = (q: Question) => q.options[0]?.letter;
const byCluster = (q: Question, code: ClusterCode) =>
  q.options.find((o) => o.clusterCode === code)?.letter;
const byDriver = (q: Question, code: DriverCode) =>
  q.options.find((o) => o.driverCode === code)?.letter;
const byAxis = (q: Question, value: string) =>
  q.options.find((o) => o.axisValue === value)?.letter;

const CLUSTERS: ClusterCode[] = [
  "TECH",
  "ENG",
  "SCI",
  "ART",
  "BUS",
  "LAW",
  "PPL",
  "ENV",
];

/**
 * Concentrate curiosity points on `code`; spread the remaining curiosity
 * questions thinly across the OTHER clusters so no single competitor
 * accumulates (otherwise the first-option fallback piles points on one
 * cluster). This makes the target reliably the primary cluster.
 */
function focusedAnswers(code: ClusterCode) {
  const others = CLUSTERS.filter((c) => c !== code);
  let spread = 0;
  return build((q) => {
    if (q.pillar !== 1) return first(q);
    const target = byCluster(q, code);
    if (target) return target;
    for (let k = 0; k < others.length; k++) {
      const letter = byCluster(q, others[(spread + k) % others.length]!);
      if (letter) {
        spread++;
        return letter;
      }
    }
    return first(q);
  });
}

describe("CORE scoring — doc validation profiles", () => {
  // Profile 1: a clear single-cluster focus must win for every cluster.
  it.each(CLUSTERS)(
    "Profile 1 — focusing on %s makes it the primary cluster",
    (code) => {
      const result = computeScore(focusedAnswers(code), questions);
      expect(result.topCluster).toBe(code);
      expect(result.clusterFinal[code]).toBeGreaterThan(0);
    },
  );

  // Profile 2: evenly distributed interests → low confidence + tight lead.
  it("Profile 2 — distributed interests yield low confidence and a tight lead", () => {
    let i = 0;
    const result = computeScore(
      build((q) => {
        if (q.pillar !== 1) return first(q);
        for (let k = 0; k < CLUSTERS.length; k++) {
          const letter = byCluster(q, CLUSTERS[(i + k) % CLUSTERS.length]!);
          if (letter) {
            i++;
            return letter;
          }
        }
        return first(q);
      }),
      questions,
    );
    expect(result.confidencePercentage).toBeLessThan(40);
    const lead =
      (result.clusterRanked[0]?.[1] ?? 0) - (result.clusterRanked[2]?.[1] ?? 0);
    expect(lead).toBeLessThanOrEqual(2);
  });

  // Profile 3: a 2-2 tie on both operations axes resolves via Q18/Q21.
  it("Profile 3 — 2-2 operations tie resolves to Precisionist via Q18=STRUCT, Q21=DEEP", () => {
    const result = computeScore(
      build((q) => {
        if (q.externalId === "Q17" || q.externalId === "Q18")
          return byAxis(q, "STRUCT");
        if (q.externalId === "Q19" || q.externalId === "Q20")
          return byAxis(q, "FLEX");
        if (q.externalId === "Q21" || q.externalId === "Q22")
          return byAxis(q, "DEEP");
        if (q.externalId === "Q23" || q.externalId === "Q24")
          return byAxis(q, "BROAD");
        return first(q);
      }),
      questions,
    );
    // Processing tied 2-2 (Q18 → STRUCT), Scope tied 2-2 (Q21 → DEEP).
    expect(result.axes.processing).toBe("STRUCT");
    expect(result.axes.scope).toBe("DEEP");
    expect(result.archetype).toBe("Precisionist");
  });

  // Profile 4: maxing Stability makes it the primary reward driver.
  it("Profile 4 — choosing Stability everywhere makes it the primary driver", () => {
    const result = computeScore(
      build((q) => byDriver(q, "STA") ?? first(q)),
      questions,
    );
    expect(result.primaryDrivers).toContain("STA");
    expect(result.driver.STA).toBeGreaterThanOrEqual(2);
  });

  // Profile 5: operational + ecosystem bonuses are applied as +0.5 each.
  it("Profile 5 — operational/ecosystem bonuses are applied to final scores", () => {
    const result = computeScore(
      build((q) => byCluster(q, "SCI") ?? first(q)),
      questions,
    );
    // final = raw + bonus, exactly, for every cluster
    for (const code of CLUSTERS) {
      expect(result.clusterFinal[code]).toBeCloseTo(
        result.clusterRaw[code] + result.clusterBonus[code],
      );
    }
    // bonuses are only ever 0, +0.5, or +1 (two affinities stacking)
    for (const code of CLUSTERS) {
      expect([0, 0.5, 1]).toContain(result.clusterBonus[code]);
    }
    // at least one cluster actually received a bonus
    expect(
      CLUSTERS.some((code) => result.clusterBonus[code] > 0),
    ).toBe(true);
  });
});
