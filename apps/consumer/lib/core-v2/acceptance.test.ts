import { describe, expect, it } from "vitest";
import cases from "./__fixtures__/core-08-test-cases.json";
import { coreAnswersFromLetters } from "./assessment";
import { CORE_QUESTIONS, coreBank } from "./content/core-content";
import { flagPart } from "./flags";
import { buildReportModel } from "./report-model";
import { SCORE_SCALE, type FamilyView, type MeetCard } from "./section4";
import { scoreCore } from "./scoring";
import { findShifts } from "./shifts";
import { AXIS_CODES, type CoreResult } from "./types";

/**
 * The client's acceptance check (change instructions 17 Oct 2026, step 9):
 * the twelve cases of CORE_08_Test_Cases.json, produced by the reference
 * scorer, must come out of this platform unchanged.
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- fixture JSON */
type Case = any;
const all = cases as Case[];
const reportCases = all.filter((c) => c.expected_report);
const LETTERS = ["A", "B", "C", "D"];

/** Fixture answers are option codes; the platform stores display letters. */
function score(answers: Record<string, string>): CoreResult {
  const letters = Object.fromEntries(
    CORE_QUESTIONS.map((question) => {
      const index = question.options.findIndex((o) => o.code === answers[question.id]);
      if (index < 0) throw new Error(`No option ${answers[question.id]} on ${question.id}`);
      return [question.id, LETTERS[index]];
    }),
  );
  return scoreCore(coreAnswersFromLetters(letters));
}

const bank = coreBank("en");
const jobName = (id: string) =>
  bank.families.flatMap((f) => f.jobs).find((job) => job.id === id)!.nameEn;
const familyScore = (score: number) => Math.round((score / SCORE_SCALE) * 1e4) / 1e4;

function jobsOf(card: MeetCard | FamilyView) {
  return card.jobs.map((job) => ({
    job_id: job.jobId,
    highlight: job.isHighlighted,
    changing_work: job.isChangingWork,
  }));
}

function cardOf(card: MeetCard | FamilyView) {
  return {
    family_id: card.familyId,
    family_score: familyScore(card.score),
    jobs: jobsOf(card),
    repeated_jobs_hidden: card.hiddenRepeatJobIds.map(jobName),
    changing_note: card.hasChangingNote ? "S4-CHANGING" : null,
  };
}

function expectedCard(v: Case) {
  return {
    family_id: v.family_id,
    family_score: v.family_score,
    jobs: v.jobs.map((j: Case) => ({
      job_id: j.job_id,
      highlight: j.highlight,
      changing_work: j.changing_work,
    })),
    repeated_jobs_hidden: v.repeated_jobs_hidden,
    changing_note: v.changing_note,
  };
}

describe("CORE_08 test cases: results", () => {
  it.each(reportCases.map((c) => [c.case, c]))("%s", (_name, c: Case) => {
    const result = score(c.answers);
    const expected = c.expected_results;
    expect(result.curiosityCounts).toEqual(expected.p1.counts);
    expect(result.leadingCuriosities).toEqual(expected.p1.leaders);
    expect(result.directionClarity).toBe(expected.p1.clarity.toLowerCase());
    expect(result.margin).toBe(expected.p1.margin);
    expect(result.circleReading).toBe(expected.p1.reading);
    for (const axis of AXIS_CODES) {
      const want = expected.axes[axis];
      expect(result.axes[axis].count, axis).toBe(want.count);
      expect(result.axes[axis].zone, axis).toBe(want.zone);
      expect(result.axes[axis].lean ?? "MIX", axis).toBe(want.lean);
    }
    expect(result.motivatorCounts).toEqual(expected.p3.counts);
    expect(result.leadingMotivators).toEqual(expected.p3.leading);
    expect(result.noSmallSet).toBe(expected.p3.no_small_set);
    expect(result.topTwoMotivators).toEqual(expected.p3.top_two);
  });
});

describe("CORE_08 test cases: report", () => {
  it.each(reportCases.map((c) => [c.case, c]))("%s", (_name, c: Case) => {
    const result = score(c.answers);
    const isFlagged = c.expected_report.flag_note === "FLAG-NOTE";
    const model = buildReportModel(result, bank, { isFlagged, isFlagsLive: isFlagged });
    const want = c.expected_report;

    expect(model.sections.filter((s) => s !== "FLAG-NOTE")).toEqual(want.section_order);
    expect(model.sections.includes("FLAG-NOTE")).toBe(want.flag_note === "FLAG-NOTE");

    const s4 = model.section4;
    expect(s4.meetCards.map((card) => ({ ...cardOf(card), curiosities: card.pair, meet_line: card.line })))
      .toEqual(want.S4.meet.map((v: Case) => ({ ...expectedCard(v), curiosities: v.curiosities, meet_line: v.meet_line })));
    expect(
      s4.directions.map((d) => ({
        curiosity: d.curiosity,
        full: d.full.map((v) => ({ ...cardOf(v), worth_checking: v.worthChecking })),
        more: d.more,
        closest_label: d.full[0]?.isClosest ? d.full[0].familyId : null,
      })),
    ).toEqual(
      want.S4.directions.map((d: Case) => ({
        curiosity: d.curiosity,
        full: d.full.map((v: Case) => ({ ...expectedCard(v), worth_checking: v.worth_checking })),
        more: d.more.map((m: Case) => m.family_id),
        closest_label: d.closest_label,
      })),
    );
    expect(s4.noMatch).toBe(want.S4.no_match);
    expect(s4.alsoCuriosities.map((code) => `CUR-${code}-NAME`)).toEqual(
      want.S4.also?.curiosities ?? [],
    );

    const s5 = want.S5;
    const [job1, job2] = model.nextSteps.watchJobIds.map(jobName);
    expect([job1, job2]).toEqual([s5.watch.job1, s5.watch.job2]);
    expect(model.watchFills).toEqual({ "job 1": s5.watch.job1_en_fill, "job 2": s5.watch.job2_en_fill });
    expect(model.nextSteps.tryBlocks).toEqual(s5.try);
    expect(model.talkFill).toBe(s5.talk.family_en_fill);
    expect(model.nextSteps.talkBlocks).toEqual(s5.talk.questions);
    expect(model.nextSteps.askBlocks).toEqual(s5.ask.questions);

    expect(result.leadingCuriosities.length >= 4).toBe(want.S3.compact);
  });
});

describe("CORE_08 test cases: shifts and flags", () => {
  it("10_shift_example", () => {
    const c = all.find((x) => x.case === "10_shift_example");
    const shifts = findShifts(score(c.previous_answers), score(c.answers)).map((s) =>
      s.kind === "axis"
        ? { pillar: s.axis === "structure" || s.axis === "focus" ? 2 : 4, axis: s.axis, from_zone: s.from, to_zone: s.to }
        : { pillar: s.kind === "curiosities" ? 1 : 3, from: s.from, to: s.to },
    );
    expect(shifts).toEqual(c.expected_shifts);
  });

  it("11_flag_example", () => {
    const c = all.find((x) => x.case === "11_flag_example");
    for (const part of [1, 2, 3, 4] as const) {
      const ids = CORE_QUESTIONS.filter((q) => q.part === part).map((q) => q.id);
      const flags = flagPart(ids.map((id) => ({ timeMs: c.timings_ms[id], position: c.positions[id] })));
      const want = c.expected_flags[`P${part}`];
      expect(flags).toEqual({
        medianMs: want.median_ms,
        largestSamePositionShare: expect.closeTo(want.max_same_position_share, 3),
        rushed: want.rushed,
        samePosition: want.same_position,
        flagged: want.flagged,
      });
    }
  });
});
