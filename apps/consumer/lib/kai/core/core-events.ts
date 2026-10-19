/**
 * The three tools the client prompt tells Kai to call (spec §7.2). Gemini runs
 * here in JSON mode, which cannot be combined with function calling, so Kai
 * "calls" a tool by adding it to the reply's `events` array.
 *
 * Where they go, until kai_events exists (spec §9) and its storage is
 * approved: disagreements and shift explanations come back to the browser,
 * which keeps them on this device so later conversations get
 * PRIOR_DISAGREEMENTS. The server logs only that an event happened, never
 * the student's words. A safeguarding alert is logged as a warning; who
 * receives it and how fast is still undecided by the client (spec §15).
 */

export type CoreKaiEvent =
  | {
      tool: "record_disagreement";
      result: string;
      studentVersion: string;
      reason: string | null;
    }
  | { tool: "record_shift_explanation"; shift: string; explanation: string }
  | { tool: "safeguarding_alert" };

export const CORE_KAI_TOOLS = [
  "record_disagreement",
  "record_shift_explanation",
  "safeguarding_alert",
] as const;

const MAX_EVENT_TEXT = 300;
const MAX_EVENTS_PER_TURN = 4;

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, MAX_EVENT_TEXT) : null;
}

function normalizeEvent(raw: unknown): CoreKaiEvent | null {
  if (typeof raw !== "object" || raw === null) return null;
  const entry = raw as Record<string, unknown>;
  switch (entry.tool) {
    case "record_disagreement": {
      const result = text(entry.result);
      const studentVersion = text(entry.student_version);
      if (!result || !studentVersion) return null;
      return { tool: "record_disagreement", result, studentVersion, reason: text(entry.reason) };
    }
    case "record_shift_explanation": {
      const shift = text(entry.shift);
      const explanation = text(entry.explanation);
      if (!shift || !explanation) return null;
      return { tool: "record_shift_explanation", shift, explanation };
    }
    case "safeguarding_alert":
      return { tool: "safeguarding_alert" };
    default:
      return null;
  }
}

/** Keeps only well-formed tool calls; one safeguarding alert per turn is enough. */
export function normalizeCoreEvents(value: unknown): CoreKaiEvent[] {
  if (!Array.isArray(value)) return [];
  const events: CoreKaiEvent[] = [];
  for (const raw of value) {
    const event = normalizeEvent(raw);
    if (!event) continue;
    if (event.tool === "safeguarding_alert" && events.some((e) => e.tool === event.tool)) continue;
    events.push(event);
  }
  return events.slice(0, MAX_EVENTS_PER_TURN);
}

export interface CoreEventScope {
  threadId?: string;
  requestId?: string;
}

/**
 * The stub sink. Records that a tool was called, with the thread so support
 * can find the conversation, and nothing the student wrote.
 */
export function recordCoreKaiEvents(
  events: readonly CoreKaiEvent[],
  scope: CoreEventScope,
  log: Pick<Console, "info" | "warn"> = console,
): void {
  for (const event of events) {
    const entry = { tool: event.tool, threadId: scope.threadId, requestId: scope.requestId };
    if (event.tool === "safeguarding_alert") {
      // Escalation process pending from the client (spec §15).
      log.warn("[kai/core] safeguarding_alert", entry);
    } else {
      log.info("[kai/core] tool call", entry);
    }
  }
}
