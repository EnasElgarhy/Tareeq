import type { Section4 } from "./section4";
import { AXIS_CODES, type CoreResult } from "./types";

/**
 * Report structure that does not depend on wording (spec §6, §6.5).
 * Block IDs follow the patterns in the spec; the exact IDs are checked
 * against file 04 when it arrives.
 */

const TRY_LIMIT = 3;

export type SectionId = "FLAG-NOTE" | "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7";

export interface NextStepsPlan {
  /**
   * Fill [job 1] and [job 2] in S5-WATCH: the best-matching job of the first
   * family shown, then the best of the second family shown that differs
   * (agreed 8 Oct 2026; file 08 section5).
   */
  watchJobIds: [string, string];
  /** First family shown in Section 4; fills [family] in S5-TALK. */
  talkFamilyId: string;
  tryBlocks: string[];
  talkBlocks: string[];
  askBlocks: string[];
}

/** Family cards in display order: meet cards, then each direction's full cards. */
function shownCards(section4: Section4) {
  return [...section4.meetCards, ...section4.directions.flatMap((d) => d.full)];
}

export function planNextSteps(
  result: CoreResult,
  section4: Section4,
  nameOf: (jobId: string) => string,
): NextStepsPlan {
  const [first, second] = shownCards(section4);
  const job1 = first?.jobs[0];
  if (!first || !job1) {
    throw new Error("Section 4 shows no family, so next steps have nothing to point to");
  }
  const pool = [...(second?.jobs ?? []), ...first.jobs.slice(1)];
  const job2 = pool.find((job) => nameOf(job.jobId) !== nameOf(job1.jobId));
  if (!job2) throw new Error("Section 4 shows no second job for S5-WATCH");

  const tryBlocks = result.leadingCuriosities
    .slice(0, TRY_LIMIT)
    .map((code) => `S5-TRY-${code}`);

  // No small set of motivators: two general questions instead (agreed 13 Oct 2026).
  const talkBlocks =
    result.topTwoMotivators.length > 0
      ? result.topTwoMotivators.map((code) => `S5-YARD-${code}`)
      : ["S5-TALK-DAY", "S5-TALK-TRADEOFF"];

  const firstLeaningAxis = AXIS_CODES.find((axis) => result.axes[axis].lean !== null);
  const [firstTopMotivator] = result.topTwoMotivators;
  const askBlocks = [
    ...(firstLeaningAxis ? [`S5-SCHOOL-${firstLeaningAxis.toUpperCase()}`] : []),
    ...(firstTopMotivator ? [`S5-SCHOOL-${firstTopMotivator}`] : []),
  ];

  return {
    watchJobIds: [job1.jobId, job2.jobId],
    talkFamilyId: first.familyId,
    tryBlocks,
    talkBlocks,
    askBlocks,
  };
}

/** The clarity line under the curiosities card in At a glance (spec §6.2). */
export function clarityBlocks(
  result: Pick<CoreResult, "directionClarity" | "circleReading">,
): string[] {
  switch (result.directionClarity) {
    case "clear":
      return ["S2-C-CLEAR"];
    case "leaning":
      return ["S2-C-LEANING"];
    case "close":
      return [
        "S2-C-CLOSE",
        result.circleReading === "diverse" ? "S2-C-DIVERSE" : "S2-C-COHERENT",
      ];
    case "open":
      return ["S2-C-OPEN"];
  }
}

export function planSections(
  result: CoreResult,
  { isFlagged, isFlagsLive }: { isFlagged: boolean; isFlagsLive: boolean },
): SectionId[] {
  const body: SectionId[] =
    result.directionClarity === "open"
      ? ["S1", "S2", "S5", "S3", "S4", "S6", "S7"]
      : ["S1", "S2", "S3", "S4", "S5", "S6", "S7"];
  return isFlagged && isFlagsLive ? ["FLAG-NOTE", ...body] : body;
}
