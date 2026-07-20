import type { TimelineEvent } from "@/lib/admin/users/types";

/**
 * Inputs the query layer gathers from existing tables. Kept as plain data so
 * timeline assembly stays pure and unit-testable.
 */
export interface TimelineInput {
  /** profiles.created_at */
  registeredAt: string | null;
  /** One entry per assessments row (verified records). */
  assessments: Array<{ label: string; startedAt: string | null; completedAt: string | null }>;
  /** analytics_events (event_name/event_type + occurred_at). */
  events: Array<{ name: string; at: string }>;
}

/**
 * Milestone analytics events collapsed to their FIRST occurrence (per the
 * brief — a higher-level "Opened Kai" beats a hundred raw kai_opened rows).
 * Anything not listed here is intentionally omitted from the journey view.
 */
const MILESTONE_EVENTS: Record<string, string> = {
  results_viewed: "Viewed results",
  result_downloaded: "Downloaded results",
  results_downloaded: "Downloaded results",
  result_shared: "Shared results",
  results_shared: "Shared results",
  kai_opened: "Opened Kai",
  kai_chat_started: "Started first Kai conversation",
  kai_plan_saved: "Saved first plan",
  kai_task_completed: "Completed first plan task",
};

function pushSorted(list: TimelineEvent[]): TimelineEvent[] {
  return [...list].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

/**
 * Assemble a chronological journey timeline from real records only.
 * Registration + assessment start/complete are `verified`; the first
 * occurrence of each milestone analytics event is added once.
 */
export function buildTimeline(input: TimelineInput): TimelineEvent[] {
  const out: TimelineEvent[] = [];

  if (input.registeredAt) {
    out.push({ at: input.registeredAt, code: "registered", label: "Registered", kind: "verified" });
  }

  for (const a of input.assessments) {
    if (a.startedAt) {
      out.push({
        at: a.startedAt,
        code: "assessment_started",
        label: `Started ${a.label}`,
        kind: "verified",
      });
    }
    if (a.completedAt) {
      out.push({
        at: a.completedAt,
        code: "assessment_completed",
        label: `Completed ${a.label}`,
        kind: "verified",
      });
    }
  }

  // First occurrence of each milestone event, earliest wins.
  const firstSeen = new Map<string, string>();
  for (const e of input.events) {
    if (!MILESTONE_EVENTS[e.name] || Number.isNaN(Date.parse(e.at))) continue;
    const prev = firstSeen.get(e.name);
    if (!prev || Date.parse(e.at) < Date.parse(prev)) firstSeen.set(e.name, e.at);
  }
  for (const [name, at] of firstSeen) {
    out.push({ at, code: name, label: MILESTONE_EVENTS[name], kind: "verified" });
  }

  return pushSorted(out);
}
