import { readLocalAssessment } from "@/lib/assessment/progress";
import { IS_CORE_V2_LIVE } from "@/lib/core-v2/live";
import { readCoreReport } from "@/lib/core-v2/storage";
import type { CoreDisagreement, CoreEntryPromptId } from "./core-context";
import type { CoreKaiEvent } from "./core-events";
import { coreStudentProfile } from "./core-profile";
import type { CoreKaiRequest } from "./core-request";

/**
 * Browser half of Kai for CORE students. Reads the latest result on this
 * device (tareeq.core.result.v2) and keeps what Kai recorded, per attempt,
 * until the server's kai_events table exists (spec §9).
 */

const EVENTS_KEY = "tareeq.core.kai-events.v1";
const MAX_STORED = 12;

interface StoredAttemptEvents {
  disagreements: CoreDisagreement[];
  shiftExplanations: Array<{ shift: string; explanation: string }>;
}

type EventStore = Record<string, StoredAttemptEvents>;

function readStore(): EventStore {
  try {
    const raw = window.localStorage.getItem(EVENTS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return typeof parsed === "object" && parsed !== null ? (parsed as EventStore) : {};
  } catch {
    return {};
  }
}

function isDisagreement(value: unknown): value is CoreDisagreement {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Partial<CoreDisagreement>;
  return (
    typeof entry.result === "string" &&
    typeof entry.studentVersion === "string" &&
    (entry.reason === null || typeof entry.reason === "string")
  );
}

/** The CORE result Kai uses: shown only while CORE 2.0 is live, as on the Compass tab. */
function readLiveCoreReport() {
  return IS_CORE_V2_LIVE ? readCoreReport() : null;
}

export function hasCoreKaiResult(): boolean {
  return readLiveCoreReport() !== null;
}

/** The `core` field of a chat request, or null for a student without a CORE result. */
export function readCoreKaiRequest(entryPromptId: CoreEntryPromptId | null): CoreKaiRequest | null {
  const report = readLiveCoreReport();
  if (!report) return null;
  const stored = readStore()[report.generatedAt];
  return {
    result: report.result,
    // Only the latest attempt is kept on this device, so there is nothing to
    // compare yet; PREVIOUS_SHIFTS stays empty until attempts are stored.
    previousResult: null,
    isFlagged: report.isFlagged,
    entryPromptId,
    profile: coreStudentProfile(readLocalAssessment()?.answers ?? {}),
    priorDisagreements: Array.isArray(stored?.disagreements)
      ? stored.disagreements.filter(isDisagreement).slice(-MAX_STORED)
      : [],
  };
}

/** Keeps the disagreements and shift explanations from one Kai reply. */
export function storeCoreKaiEvents(events: readonly CoreKaiEvent[]): void {
  const report = readCoreReport();
  if (!report || events.length === 0) return;
  const store = readStore();
  const current = store[report.generatedAt];
  const disagreements = [
    ...(Array.isArray(current?.disagreements) ? current.disagreements : []),
    ...events.flatMap((event) =>
      event.tool === "record_disagreement"
        ? [{ result: event.result, studentVersion: event.studentVersion, reason: event.reason }]
        : [],
    ),
  ].slice(-MAX_STORED);
  const shiftExplanations = [
    ...(Array.isArray(current?.shiftExplanations) ? current.shiftExplanations : []),
    ...events.flatMap((event) =>
      event.tool === "record_shift_explanation"
        ? [{ shift: event.shift, explanation: event.explanation }]
        : [],
    ),
  ].slice(-MAX_STORED);
  try {
    window.localStorage.setItem(
      EVENTS_KEY,
      JSON.stringify({ ...store, [report.generatedAt]: { disagreements, shiftExplanations } }),
    );
  } catch {
    // Storage unavailable (private mode): Kai simply starts without them.
  }
}
