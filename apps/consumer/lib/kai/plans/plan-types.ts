export type KaiPlanTaskStatus = "not_started" | "in_progress" | "completed";

export interface KaiPlanTask {
  id: string;
  text: string;
  estimatedTime?: string;
  status: KaiPlanTaskStatus;
}

/** A saved, trackable action plan — created from a chat message's
 * `action_plan` block (see lib/kai/chat-types.ts) via `createPlan()`.
 * Fields are snapshotted at save-time, same as KaiSavedResource. */
export interface KaiPlan {
  id: string;
  title: string;
  durationLabel?: string;
  tasks: KaiPlanTask[];
  createdAt: string;
}
