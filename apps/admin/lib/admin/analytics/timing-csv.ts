import { rowsToCsv, type CsvColumn } from "@/lib/admin/analytics/csv";
import { CORE_PARTS, type AttemptTiming } from "@/lib/admin/analytics/timing";

function partColumns(part: number): CsvColumn<AttemptTiming>[] {
  const find = (a: AttemptTiming) => a.parts.find((p) => p.part === part);
  return [
    { key: `p${part}_avg`, header: `Part ${part} avg seconds`, value: (a) => find(a)?.avgSeconds ?? null },
    { key: `p${part}_median`, header: `Part ${part} median seconds`, value: (a) => find(a)?.medianSeconds ?? null },
    {
      key: `p${part}_same`,
      header: `Part ${part} largest same-position share`,
      value: (a) => {
        const share = find(a)?.flags.largestSamePositionShare;
        return share === null || share === undefined ? null : Math.round(share * 100) / 100;
      },
    },
  ];
}

/** No names or emails: the export carries ids only, like the other analytics exports. */
export function buildTimingCsv(attempts: readonly AttemptTiming[]): string {
  const columns: CsvColumn<AttemptTiming>[] = [
    { key: "attempt", header: "Attempt key", value: (a) => a.attemptKey },
    { key: "source", header: "Timing source", value: (a) => a.source },
    { key: "assessment_id", header: "Assessment id", value: (a) => a.assessmentId },
    { key: "version", header: "Version", value: (a) => a.versionLabel },
    { key: "started", header: "Started", value: (a) => a.startedAt },
    { key: "src", header: "Source", value: (a) => a.src },
    { key: "post", header: "Post", value: (a) => a.post },
    { key: "answered", header: "Questions timed", value: (a) => a.answered },
    { key: "avg", header: "Avg seconds per question", value: (a) => a.avgSeconds },
    ...CORE_PARTS.flatMap(partColumns),
    { key: "rushed", header: "Rushed parts", value: (a) => a.rushedParts.join(" ") },
    { key: "same", header: "Same-position parts", value: (a) => a.samePositionParts.join(" ") },
    { key: "flagged", header: "Flagged as fast", value: (a) => a.flagged },
  ];
  return rowsToCsv([...attempts], columns);
}
