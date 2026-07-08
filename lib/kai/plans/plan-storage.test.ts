import { beforeEach, describe, expect, it } from "vitest";
import type { KaiActionPlanBlock } from "@/lib/kai/chat-types";
import {
  createPlan,
  deletePlan,
  kaiPlansStorageKey,
  readPlan,
  readPlans,
  updateTaskStatus,
} from "@/lib/kai/plans/plan-storage";

function makeBlock(overrides: Partial<KaiActionPlanBlock> = {}): KaiActionPlanBlock {
  return {
    type: "action_plan",
    title: "This week",
    durationLabel: "7 days",
    tasks: [
      { id: "t1", text: "Watch a day-in-the-life video", estimatedTime: "20 min" },
      { id: "t2", text: "Message one professional" },
    ],
    ...overrides,
  };
}

describe("plan-storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty list when nothing is saved", () => {
    expect(readPlans()).toEqual([]);
  });

  it("createPlan persists a new plan with all tasks defaulting to not_started", () => {
    const plan = createPlan(makeBlock(), "2026-07-01T00:00:00.000Z");
    expect(plan).toMatchObject({
      title: "This week",
      durationLabel: "7 days",
      createdAt: "2026-07-01T00:00:00.000Z",
    });
    expect(plan.tasks).toHaveLength(2);
    expect(plan.tasks.every((task) => task.status === "not_started")).toBe(true);
    expect(plan.tasks[0]).toMatchObject({ text: "Watch a day-in-the-life video", estimatedTime: "20 min" });
    expect(readPlans()).toHaveLength(1);
  });

  it("createPlan omits durationLabel when the source block has none", () => {
    const plan = createPlan(makeBlock({ durationLabel: undefined }));
    expect(plan).not.toHaveProperty("durationLabel");
  });

  it("readPlan finds a single plan by id", () => {
    const plan = createPlan(makeBlock());
    expect(readPlan(plan.id)?.title).toBe("This week");
    expect(readPlan("not-a-real-id")).toBeUndefined();
  });

  it("deletePlan removes only the targeted plan", () => {
    const first = createPlan(makeBlock({ title: "Plan A" }));
    createPlan(makeBlock({ title: "Plan B" }));

    const next = deletePlan(first.id);
    expect(next).toHaveLength(1);
    expect(next[0].title).toBe("Plan B");
  });

  it("updateTaskStatus changes only the targeted task on the targeted plan", () => {
    const planA = createPlan(makeBlock({ title: "Plan A" }));
    const planB = createPlan(makeBlock({ title: "Plan B" }));

    const next = updateTaskStatus(planA.id, planA.tasks[0].id, "completed");
    const updatedA = next.find((p) => p.id === planA.id);
    const untouchedB = next.find((p) => p.id === planB.id);

    expect(updatedA?.tasks[0].status).toBe("completed");
    expect(updatedA?.tasks[1].status).toBe("not_started");
    expect(untouchedB?.tasks.every((t) => t.status === "not_started")).toBe(true);
  });

  it("returns an empty list for corrupted stored data (migration safety)", () => {
    window.localStorage.setItem(kaiPlansStorageKey, "{not valid json");
    expect(readPlans()).toEqual([]);
  });

  it("returns an empty list when stored data isn't an array of valid plans", () => {
    window.localStorage.setItem(kaiPlansStorageKey, JSON.stringify([{ id: "x" }]));
    expect(readPlans()).toEqual([]);
  });
});
