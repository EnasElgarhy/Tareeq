import {
  CORE_AXES,
  CORE_AXIS_SIDES,
  codeLabel,
  type CoreAxis,
  type CoreQuestionSetDoc,
} from "@/lib/admin/core/framework";

/**
 * Display summary of a stored CORE 2.0 result (consumer CoreResult plus
 * contentVersions). Reads only CORE fields; a v4 result yields `null` so the
 * two are never shown or compared as the same thing.
 */

export interface CoreAxisSummary {
  axis: CoreAxis;
  zone: 1 | 2 | 3 | null;
  lean: string | null;
}

export interface CoreResultSummary {
  scoringVersion: string;
  leadingCuriosities: string[];
  leadingMotivators: string[];
  directionClarity: string | null;
  axes: CoreAxisSummary[];
  contentVersions: Record<string, string>;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

export function summarizeCoreResult(
  doc: CoreQuestionSetDoc,
  result: unknown,
): CoreResultSummary | null {
  if (!result || typeof result !== "object") return null;
  const r = result as Record<string, unknown>;
  if (r.scoringVersion !== "2.0") return null;

  const axesRaw =
    r.axes && typeof r.axes === "object"
      ? (r.axes as Record<string, unknown>)
      : {};
  const axes = CORE_AXES.map((axis): CoreAxisSummary => {
    const a = axesRaw[axis];
    const entry =
      a && typeof a === "object" ? (a as Record<string, unknown>) : {};
    const zone =
      entry.zone === 1 || entry.zone === 2 || entry.zone === 3
        ? entry.zone
        : null;
    const lean = typeof entry.lean === "string" ? entry.lean : null;
    return { axis, zone, lean };
  });

  const versionsRaw =
    r.contentVersions && typeof r.contentVersions === "object"
      ? (r.contentVersions as Record<string, unknown>)
      : {};
  const contentVersions = Object.fromEntries(
    Object.entries(versionsRaw).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );

  return {
    scoringVersion: "2.0",
    leadingCuriosities: stringList(r.leadingCuriosities).map((c) =>
      codeLabel(doc, c),
    ),
    leadingMotivators: stringList(r.leadingMotivators).map((c) =>
      codeLabel(doc, c),
    ),
    directionClarity:
      typeof r.directionClarity === "string" ? r.directionClarity : null,
    axes,
    contentVersions,
  };
}

/** "Steps set out", "A mix of both" or the side-B name for an axis result. */
export function axisZoneLabel(
  doc: CoreQuestionSetDoc,
  a: CoreAxisSummary,
): string {
  if (a.zone === null) return "—";
  if (a.zone === 2) return "A mix of both";
  const { sideA, sideB } = CORE_AXIS_SIDES[a.axis];
  const side = a.zone === 1 ? sideA : sideB;
  const name = codeLabel(doc, side);
  // axis_options read "structure: toward side A (steps set out)"; keep the bracket.
  const match = /\(([^)]+)\)/.exec(name);
  return match ? match[1] : name;
}

/**
 * How often each curiosity leads across CORE 2.0 results (a result can lead
 * with several). Non-CORE results are skipped. Returned in code-list order.
 */
export function tallyLeadingCuriosities(
  doc: CoreQuestionSetDoc,
  results: readonly unknown[],
): { code: string; name: string; count: number }[] {
  const counts = new Map(Object.keys(doc.codes.curiosities).map((c) => [c, 0]));
  for (const result of results) {
    if (!result || typeof result !== "object") continue;
    const r = result as Record<string, unknown>;
    if (r.scoringVersion !== "2.0") continue;
    for (const code of stringList(r.leadingCuriosities)) {
      if (counts.has(code)) counts.set(code, (counts.get(code) ?? 0) + 1);
    }
  }
  return [...counts.entries()].map(([code, count]) => ({
    code,
    name: codeLabel(doc, code),
    count,
  }));
}
