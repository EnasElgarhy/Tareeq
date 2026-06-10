import { describe, expect, it } from "vitest";
import { seedQuestions } from "../content/seed";
import { buildBaseReport, CLUSTER_PROFILES } from "./framework";
import { computeScore } from "../scoring";
import type { ClusterCode, Question } from "../scoring/types";

/**
 * Narrative-framework compliance for the DETERMINISTIC base report
 * (results_narrative_framework.docx). This is the "results without AI"
 * guarantee: every cluster must yield a complete, doc-compliant report with
 * no AI involved. The AI fine-tuner only rewrites prose on top of this.
 */

const questions = seedQuestions.map((question) => ({
  ...question,
  options: question.options.map((option) => ({ ...option })),
})) as unknown as Question[];

const clusters = Object.keys(CLUSTER_PROFILES) as ClusterCode[];

/**
 * Focus curiosity points on `code` and spread the rest thin so the target
 * reliably becomes the primary cluster (and we exercise each cluster's
 * template). Non-curiosity pillars take the first option.
 */
function answersForCluster(code: ClusterCode): Record<string, string> {
  const others = clusters.filter((c) => c !== code);
  const answers: Record<string, string> = {};
  let spread = 0;
  for (const question of questions) {
    if (question.options.length === 0) continue;
    const fallback = question.options[0]!.letter;
    const byCode = (c: ClusterCode) =>
      question.options.find((option) => option.clusterCode === c)?.letter;

    if (question.pillar !== 1) {
      answers[question.externalId] = fallback;
      continue;
    }
    const target = byCode(code);
    if (target) {
      answers[question.externalId] = target;
      continue;
    }
    let chosen = fallback;
    for (let k = 0; k < others.length; k++) {
      const letter = byCode(others[(spread + k) % others.length]!);
      if (letter) {
        chosen = letter;
        spread++;
        break;
      }
    }
    answers[question.externalId] = chosen;
  }
  return answers;
}

describe("buildBaseReport — narrative framework compliance", () => {
  it.each(clusters)(
    "produces a complete, doc-compliant base report (cluster %s)",
    (code) => {
      const result = computeScore(answersForCluster(code), questions);
      const report = buildBaseReport({ result, name: "Sara" });
      const profile = CLUSTER_PROFILES[report.clusterCode];

      // Lists are present AND come verbatim from the deterministic template.
      expect(report.highSchoolSubjects).toEqual(profile.subjects);
      expect(report.universityMajors).toEqual(profile.majors);
      expect(report.careerExamples).toEqual(profile.careers);
      expect(report.nonObviousPaths).toEqual(profile.nonObvious);
      for (const list of [
        report.highSchoolSubjects,
        report.universityMajors,
        report.careerExamples,
        report.nonObviousPaths,
      ]) {
        expect(list.length).toBeGreaterThan(0);
      }

      const prose = [
        report.headline,
        report.summary,
        report.academicPath,
        report.careerLandscape,
        report.integration,
        report.realityCheck,
        report.nextSteps,
      ].join(" ");

      // GUIDANCE, not a personality label.
      expect(prose).not.toMatch(
        /you are an? |you're an? |your personality (type )?is|people like you/i,
      );
      // Compass framing is present.
      expect(report.summary.toLowerCase()).toMatch(
        /your answers point|your compass points|curiosit/,
      );
      // Reality check tells them to watch "day in the life" first.
      expect(report.realityCheck.toLowerCase()).toContain("day in the life");
      // Regional school wording in the academic path.
      expect(report.academicPath).toMatch(/A-Levels|Tawjihi|IB|IGCSE/);
      // Next steps give a concrete weekly action.
      expect(report.nextSteps.toLowerCase()).toContain("this week");
      // Every pillar is surfaced.
      expect(report.archetype).toBeTruthy();
      expect(report.primaryDriver).toBeTruthy();
      expect(report.ecosystemFit).toBeTruthy();
    },
  );

  it("never leaves a prose field empty (fields always have content)", () => {
    const result = computeScore(answersForCluster("TECH"), questions);
    const report = buildBaseReport({ result });
    for (const field of [
      report.headline,
      report.summary,
      report.academicPath,
      report.careerLandscape,
      report.integration,
      report.realityCheck,
      report.nextSteps,
    ]) {
      expect(field.trim().length).toBeGreaterThan(0);
    }
  });
});
