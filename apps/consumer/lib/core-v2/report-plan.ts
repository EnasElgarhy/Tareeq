import type { Section4 } from "./section4";
import { AXIS_CODES, type CoreResult } from "./types";

/**
 * Report structure that does not depend on wording (spec §6, §6.5).
 * Block IDs follow the patterns in the spec; the exact IDs are checked
 * against file 04 when it arrives.
 */

const TRY_LIMIT = 3;
const TALK_AND_ASK_LIMIT = 4;

export type SectionId = "FLAG-NOTE" | "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7";

export interface NextStepsPlan {
  /** Best-matching job of the first family shown in Section 4; fills [job] in S5-WATCH. */
  watchJobId: string;
  /** First family shown in Section 4; fills [family] in S5-TALK. */
  talkFamilyId: string;
  tryBlocks: string[];
  talkBlocks: string[];
  askBlocks: string[];
}

/** The first family Section 4 shows: the first meet card, else the first direction's first family. */
function firstShownFamily(section4: Section4) {
  const [meet] = section4.meetCards;
  if (meet) return { familyId: meet.familyId, bestJobId: meet.jobs[0]?.jobId };
  const family = section4.directions[0]?.full[0];
  if (family) return { familyId: family.familyId, bestJobId: family.jobs[0]?.jobId };
  return null;
}

export function planNextSteps(result: CoreResult, section4: Section4): NextStepsPlan {
  const first = firstShownFamily(section4);
  if (!first?.bestJobId) {
    throw new Error("Section 4 shows no family, so next steps have nothing to point to");
  }

  const tryBlocks = result.leadingCuriosities
    .slice(0, TRY_LIMIT)
    .map((code) => `S5-TRY-${code}`);

  // No small set: the typical-day question stands in (pending founder decision).
  const talkBlocks = result.noSmallSet
    ? ["S4-CHECK-DAY"]
    : result.topTwoMotivators.map((code) => `S5-YARD-${code}`);

  const firstLeaningAxis = AXIS_CODES.find((axis) => result.axes[axis].lean !== null);
  const [firstTopMotivator] = result.topTwoMotivators;
  const askBlocks = [
    ...(firstLeaningAxis ? [`S5-SCHOOL-${firstLeaningAxis.toUpperCase()}`] : []),
    ...(firstTopMotivator ? [`S5-SCHOOL-${firstTopMotivator}`] : []),
  ].slice(0, Math.max(0, TALK_AND_ASK_LIMIT - talkBlocks.length));

  return {
    watchJobId: first.bestJobId,
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
