import type { KaiActionPlanBlock } from "@/lib/kai/chat-types";
import type { KaiPlan, KaiPlanTask, KaiPlanTaskStatus } from "@/lib/kai/plans/plan-types";

export const kaiPlansStorageKey = "tareeq.kai.plans.v1";

const TASK_STATUSES = new Set<KaiPlanTaskStatus>(["not_started", "in_progress", "completed"]);

function isKaiPlanTask(value: unknown): value is KaiPlanTask {
  if (typeof value !== "object" || value === null) return false;
  const task = value as Partial<KaiPlanTask>;
  return (
    typeof task.id === "string" &&
    typeof task.text === "string" &&
    typeof task.status === "string" &&
    TASK_STATUSES.has(task.status as KaiPlanTaskStatus)
  );
}

function isKaiPlan(value: unknown): value is KaiPlan {
  if (typeof value !== "object" || value === null) return false;
  const plan = value as Partial<KaiPlan>;
  return (
    typeof plan.id === "string" &&
    typeof plan.title === "string" &&
    typeof plan.createdAt === "string" &&
    Array.isArray(plan.tasks) &&
    plan.tasks.every(isKaiPlanTask)
  );
}

export function readPlans(): KaiPlan[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(kaiPlansStorageKey);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every(isKaiPlan) ? parsed : [];
  } catch {
    return [];
  }
}

function writePlans(plans: KaiPlan[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(kaiPlansStorageKey, JSON.stringify(plans));
}

export function readPlan(id: string): KaiPlan | undefined {
  return readPlans().find((plan) => plan.id === id);
}

export function createPlan(from: KaiActionPlanBlock, now = new Date().toISOString()): KaiPlan {
  const plan: KaiPlan = {
    // URL-safe id — the raw ISO timestamp's colons/dots break the dynamic
    // route round-trip (/kai/plans/[id]), so strip to alphanumerics only.
    id: `plan-${now.replace(/[^\dA-Za-z]/g, "")}-${Math.random().toString(36).slice(2, 8)}`,
    title: from.title,
    ...(from.durationLabel ? { durationLabel: from.durationLabel } : {}),
    tasks: from.tasks.map((task) => ({
      id: task.id,
      text: task.text,
      ...(task.estimatedTime ? { estimatedTime: task.estimatedTime } : {}),
      status: "not_started" as const,
    })),
    createdAt: now,
  };
  writePlans([...readPlans(), plan]);
  return plan;
}

export function deletePlan(id: string): KaiPlan[] {
  const next = readPlans().filter((plan) => plan.id !== id);
  writePlans(next);
  return next;
}

export function updateTaskStatus(planId: string, taskId: string, status: KaiPlanTaskStatus): KaiPlan[] {
  const next = readPlans().map((plan) =>
    plan.id === planId
      ? { ...plan, tasks: plan.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)) }
      : plan,
  );
  writePlans(next);
  return next;
}
