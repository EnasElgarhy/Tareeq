import { readCoreReport } from "@/lib/core-v2/storage";
import { readGeneratedReport } from "@/lib/results/storage";

/**
 * When the student's latest report was created, whichever model built it:
 * the legacy generated report or a CORE 2.0 report (spec §6.8: the latest
 * completed attempt is the one shown). Null when there is no report yet.
 */
export function readCurrentReportGeneratedAt(): string | null {
  const stamps = [
    readGeneratedReport()?.generatedAt,
    readCoreReport()?.generatedAt,
  ]
    .filter((stamp): stamp is string => Boolean(stamp))
    .sort();
  return stamps.at(-1) ?? null;
}
