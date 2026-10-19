import { describe, expect, it } from "vitest";
import cases from "@/lib/core-v2/__fixtures__/core-08-test-cases.json";
import { coreAnswersFromLetters } from "@/lib/core-v2/assessment";
import { CORE_QUESTIONS, coreBank, coreWording } from "@/lib/core-v2/content/core-content";
import { scoreCore } from "@/lib/core-v2/scoring";
import {
  AXIS_CODES,
  CURIOSITY_CODES,
  MOTIVATOR_CODES,
  type CoreResult,
} from "@/lib/core-v2/types";
import type { Locale } from "@/lib/i18n/locale";
import { buildCoreKaiContext, type CoreKaiContextInput } from "./core-context";

/* eslint-disable @typescript-eslint/no-explicit-any -- fixture JSON */
type Case = any;
const all = cases as Case[];
const LETTERS = ["A", "B", "C", "D"];

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

function byCase(name: string): Case {
  const found = all.find((c) => c.case === name);
  if (!found) throw new Error(`No fixture case ${name}`);
  return found;
}

function build(
  result: CoreResult,
  overrides: Partial<CoreKaiContextInput> = {},
  locale: Locale = "en",
) {
  return buildCoreKaiContext({
    locale,
    result,
    bank: coreBank(locale),
    wording: (id) => coreWording(locale, id),
    profile: { gender: "female", ageBand: "13-17", academicStage: "Final two years of high school", country: "Jordan" },
    entryPromptId: null,
    previousResult: null,
    isAttemptFlagged: false,
    priorDisagreements: [],
    ...overrides,
  });
}

/** kai_context() in CORE_08_Reference_Scorer.py, applied to the fixture's expected report. */
function referenceShown(report: Case) {
  const cards = [...report.S4.meet, ...report.S4.directions.flatMap((d: Case) => d.full)];
  return {
    families: cards.map((card: Case) => card.family),
    highlighted: cards.flatMap((card: Case) =>
      card.jobs.filter((job: Case) => job.highlight).map((job: Case) => job.job),
    ),
  };
}

const reportCases = all.filter((c) => c.expected_report);

describe("buildCoreKaiContext", () => {
  it.each(reportCases.map((c) => [c.case, c]))(
    "%s: families shown and highlighted jobs match kai_context()",
    (_name, c: Case) => {
      const context = build(score(c.answers));
      const expected = referenceShown(c.expected_report);
      expect(context.REPORT.families_shown).toEqual(expected.families);
      expect(context.REPORT.highlighted_jobs).toEqual(expected.highlighted);
    },
  );

  it.each(reportCases.map((c) => [c.case, c]))(
    "%s: results match the reference scorer, by student-facing name",
    (_name, c: Case) => {
      const expected = c.expected_results;
      const context = build(score(c.answers));
      const curiosity = (code: string) => coreWording("en", `CUR-${code}-NAME`);
      const motivator = (code: string) => coreWording("en", `DRV-${code}-NAME`);

      expect(context.REPORT.leading_curiosities).toEqual(expected.p1.leaders.map(curiosity));
      expect(context.REPORT.direction_clarity).toBe(expected.p1.clarity);
      expect(context.REPORT.circle_reading).toBe(expected.p1.reading);
      expect(context.REPORT.curiosity_counts).toEqual(
        Object.fromEntries(Object.entries(expected.p1.counts).map(([k, v]) => [curiosity(k), v])),
      );
      expect(context.REPORT.leading_motivators).toEqual(expected.p3.leading.map(motivator));
      expect(context.REPORT.no_small_set).toBe(expected.p3.no_small_set);
      expect(context.REPORT.motivator_counts).toEqual(
        Object.fromEntries(Object.entries(expected.p3.counts).map(([k, v]) => [motivator(k), v])),
      );
      expect(Object.values(context.REPORT.axes).map((axis) => axis.count)).toEqual(
        AXIS_CODES.map((axis) => expected.axes[axis].count),
      );
    },
  );

  it("never hands Kai an internal code", () => {
    for (const c of reportCases) {
      const json = JSON.stringify(build(score(c.answers)));
      for (const code of [...CURIOSITY_CODES, ...MOTIVATOR_CODES, ...AXIS_CODES]) {
        expect(json).not.toMatch(new RegExp(`"${code}"`));
      }
      expect(json).not.toMatch(/F-[A-Z]{2}-\d|cluster|driver|RIASEC/i);
    }
  });

  it("names axis leanings by the report's bar ends, and an even split as a mix", () => {
    const result = score(byCase("01_clear_single").answers);
    const axes = build(result).REPORT.axes;
    expect(axes["How set out you like the work"]).toEqual({
      lean: "Steps and expectations set out for you",
      counted_option: "Steps and expectations set out for you",
      count: 4,
    });
    expect(axes["Team or individual work"]).toEqual({
      lean: "Working on your own",
      counted_option: "Working side by side with others",
      count: 1,
    });

    const evenTeam = { ...result.axes.team, count: 2, zone: 2 as const, lean: null };
    const even = build({ ...result, axes: { ...result.axes, team: evenTeam } });
    expect(even.REPORT.axes["Team or individual work"].lean).toBe("A mix of both");
  });

  it("lists the shown jobs marked as changing", () => {
    const c = byCase("12_no_repeat_and_changing_note");
    const cards = [...c.expected_report.S4.meet, ...c.expected_report.S4.directions.flatMap((d: Case) => d.full)];
    const changing = cards.flatMap((card: Case) =>
      card.jobs.filter((job: Case) => job.changing_work).map((job: Case) => job.job),
    );
    expect(changing.length).toBeGreaterThan(0);
    expect(build(score(c.answers)).REPORT.changing_jobs).toEqual(changing);
  });

  it("uses Arabic names for an Arabic-speaking student", () => {
    const context = build(score(byCase("01_clear_single").answers), {}, "ar");
    expect(context.STUDENT_PROFILE.language).toBe("ar");
    expect(context.REPORT.leading_curiosities).toEqual(["البحث والاكتشاف"]);
    expect(context.REPORT.families_shown.every((name) => /[؀-ۿ]/.test(name))).toBe(true);
  });

  it("passes the student profile with the payload's field names", () => {
    const context = build(score(byCase("01_clear_single").answers));
    expect(context.STUDENT_PROFILE).toEqual({
      language: "en",
      gender: "female",
      age_band: "13-17",
      academic_stage: "Final two years of high school",
      country: "Jordan",
    });
  });

  it("sends the report button's question as ENTRY_PROMPT, in the student's language", () => {
    const result = score(byCase("01_clear_single").answers);
    expect(build(result).ENTRY_PROMPT).toBeNull();
    expect(build(result, { entryPromptId: "S3-KAI-Q" }).ENTRY_PROMPT).toBe(
      coreWording("en", "S3-KAI-Q"),
    );
    expect(build(result, { entryPromptId: "S4-KAI-Q" }, "ar").ENTRY_PROMPT).toBe(
      coreWording("ar", "S4-KAI-Q"),
    );
  });

  it("raises at most two shifts, curiosities first, then motivators", () => {
    const c = byCase("10_shift_example");
    const context = build(score(c.answers), { previousResult: score(c.previous_answers) });
    // The fixture has six shifts (both pillars and four axes); Kai gets two.
    expect(c.expected_shifts).toHaveLength(6);
    const [p1, p3] = c.expected_shifts;
    const curiosity = (code: string) => coreWording("en", `CUR-${code}-NAME`);
    const motivator = (code: string) => coreWording("en", `DRV-${code}-NAME`);
    expect(context.PREVIOUS_SHIFTS).toEqual([
      { part: "What sparks your curiosity", from: p1.from.map(curiosity), to: p1.to.map(curiosity) },
      {
        part: coreWording("en", "S2-R-TITLE"),
        from: p3.from.map(motivator),
        to: p3.to.map(motivator),
      },
    ]);
  });

  it("has no shifts without a previous attempt", () => {
    expect(build(score(byCase("01_clear_single").answers)).PREVIOUS_SHIFTS).toEqual([]);
  });

  it("passes the flag, prior disagreements and the empty pending lists", () => {
    const context = build(score(byCase("09_flagged").answers), {
      isAttemptFlagged: true,
      priorDisagreements: [
        { result: "Planning & Execution", studentVersion: "I like the idea, not the lists", reason: null },
      ],
    });
    expect(context.ATTEMPT_FLAGGED).toBe(true);
    expect(context.PRIOR_DISAGREEMENTS).toEqual([
      { result: "Planning & Execution", student_version: "I like the idea, not the lists", reason: null },
    ]);
    expect(context.VERIFIED_LINKS).toEqual([]);
    expect(context.SAFETY_CONTACTS).toEqual([]);
  });

  it("fails loudly instead of falling back to a code when wording is missing", () => {
    const result = score(byCase("01_clear_single").answers);
    expect(() =>
      build(result, { wording: (id) => (id === "CUR-RD-NAME" ? null : coreWording("en", id)) }),
    ).toThrow(/CUR-RD-NAME/);
  });
});
