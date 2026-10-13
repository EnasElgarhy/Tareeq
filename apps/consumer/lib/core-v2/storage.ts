import type { CoreResult } from "./types";

/**
 * The latest CORE 2.0 result on this device, mirroring how the legacy report
 * is cached for the Compass tab. The server copy (core_results) stays the
 * source of truth once the assessment flow writes it.
 */

const STORAGE_KEY = "tareeq.core.result.v2";

export interface StoredCoreReport {
  generatedAt: string;
  result: CoreResult;
  isFlagged: boolean;
}

function isStoredCoreReport(value: unknown): value is StoredCoreReport {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<StoredCoreReport>;
  return (
    typeof candidate.generatedAt === "string" &&
    typeof candidate.isFlagged === "boolean" &&
    candidate.result?.scoringVersion === "2.0"
  );
}

export function readCoreReport(): StoredCoreReport | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredCoreReport(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCoreReport(report: StoredCoreReport): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(report));
  } catch {
    // Storage can be unavailable (private mode); the server copy still exists.
  }
}
