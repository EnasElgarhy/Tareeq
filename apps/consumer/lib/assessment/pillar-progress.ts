import type { Question } from "@/lib/scoring";

/**
 * The four CORE pillars Tareeq scores on.
 *
 * Pillar 0 ("About You") collects demographics and isn't scored — it's
 * excluded from the Compass progress display. The Compass fills as
 * questions 1–4 (C-O-R-E) are answered.
 */
export const COMPASS_PILLARS = [1, 2, 3, 4] as const;
export type CompassPillar = (typeof COMPASS_PILLARS)[number];

export interface PillarMeta {
  pillar: CompassPillar;
  /** Single-letter code used in CORE acronym */
  letter: "C" | "O" | "R" | "E";
  /** Display name */
  name: string;
  /** Short, friendly description */
  blurb: string;
}

export const PILLAR_META: Record<CompassPillar, PillarMeta> = {
  1: {
    pillar: 1,
    letter: "C",
    name: "Curiosities",
    blurb: "What pulls your attention",
  },
  2: {
    pillar: 2,
    letter: "O",
    name: "Operations",
    blurb: "How you actually work",
  },
  3: {
    pillar: 3,
    letter: "R",
    name: "Rewards",
    blurb: "What actually moves you",
  },
  4: {
    pillar: 4,
    letter: "E",
    name: "Ecosystems",
    blurb: "Where you thrive",
  },
};

export interface CompassSnapshot {
  /** Per-pillar progress in [0, 1] */
  byPillar: Record<CompassPillar, number>;
  /** Pillar of the active question, or null if not on a scored pillar */
  activePillar: CompassPillar | null;
  /** Overall progress in [0, 1] across the four scored pillars */
  overall: number;
}

interface BuildSnapshotArgs {
  questions: ReadonlyArray<Pick<Question, "pillar" | "kind">>;
  /** Number of questions completed (assumes sequential) */
  completedCount: number;
  /** Optional explicit active question index */
  activeIndex?: number | null;
}

/**
 * Compute per-pillar progress assuming the user has answered the first
 * `completedCount` questions in order. This matches the current
 * sequential flow exactly.
 *
 * Text-kind reflection questions are excluded from the Compass — they
 * don't feed the C-O-R-E score, so they shouldn't fill the dial.
 */
export function buildCompassSnapshot({
  questions,
  completedCount,
  activeIndex,
}: BuildSnapshotArgs): CompassSnapshot {
  const totals: Record<CompassPillar, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const done: Record<CompassPillar, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

  questions.forEach((q, idx) => {
    if (!isScoredPillar(q.pillar)) return;
    if (q.kind === "text") return;
    totals[q.pillar] += 1;
    if (idx < completedCount) done[q.pillar] += 1;
  });

  const byPillar: Record<CompassPillar, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let overallNumer = 0;
  let overallDenom = 0;
  for (const p of COMPASS_PILLARS) {
    byPillar[p] = totals[p] === 0 ? 0 : done[p] / totals[p];
    overallNumer += done[p];
    overallDenom += totals[p];
  }

  const activeQ =
    activeIndex != null && activeIndex >= 0 && activeIndex < questions.length
      ? questions[activeIndex]
      : null;
  const activePillar =
    activeQ && activeQ.kind !== "text" && isScoredPillar(activeQ.pillar)
      ? activeQ.pillar
      : null;

  return {
    byPillar,
    activePillar,
    overall: overallDenom === 0 ? 0 : overallNumer / overallDenom,
  };
}

function isScoredPillar(pillar: number): pillar is CompassPillar {
  return pillar === 1 || pillar === 2 || pillar === 3 || pillar === 4;
}
