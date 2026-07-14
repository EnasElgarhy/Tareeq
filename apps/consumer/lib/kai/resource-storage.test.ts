import { beforeEach, describe, expect, it } from "vitest";
import {
  findSavedResource,
  kaiSavedResourcesStorageKey,
  readSavedResources,
  saveResource,
  toggleActionPlan,
  unsaveResource,
} from "@/lib/kai/resource-storage";
import type { KaiLearningResource } from "@/lib/kai/resource-types";

function makeResource(overrides: Partial<KaiLearningResource> = {}): KaiLearningResource {
  return {
    type: "book",
    title: "Deep Work",
    authorOrProvider: "Cal Newport",
    reason: "Fits your Mastery driver.",
    difficulty: "beginner",
    estimatedTime: "6 hours",
    ...overrides,
  };
}

describe("resource-storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty list when nothing is saved", () => {
    expect(readSavedResources()).toEqual([]);
  });

  it("saveResource persists a new resource with id/savedAt/inActionPlan defaults", () => {
    const saved = saveResource(makeResource(), "2026-07-01T00:00:00.000Z");
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      title: "Deep Work",
      savedAt: "2026-07-01T00:00:00.000Z",
      inActionPlan: false,
    });
    expect(readSavedResources()).toHaveLength(1);
  });

  it("does not duplicate the same resource (matched by type + title, case-insensitive)", () => {
    saveResource(makeResource());
    const saved = saveResource(makeResource({ title: "deep work" }));
    expect(saved).toHaveLength(1);
  });

  it("treats the same title under a different type as a distinct resource", () => {
    saveResource(makeResource({ type: "book" }));
    const saved = saveResource(makeResource({ type: "course" }));
    expect(saved).toHaveLength(2);
  });

  it("unsaveResource removes only the targeted resource", () => {
    const afterFirst = saveResource(makeResource());
    const afterSecond = saveResource(makeResource({ title: "Atomic Habits" }));
    expect(afterSecond).toHaveLength(2);

    const next = unsaveResource(afterFirst[0].id);
    expect(next).toHaveLength(1);
    expect(next[0].title).toBe("Atomic Habits");
  });

  it("toggleActionPlan flips inActionPlan on the targeted resource only", () => {
    const saved = saveResource(makeResource());
    const id = saved[0].id;

    const afterFirstToggle = toggleActionPlan(id);
    expect(afterFirstToggle[0].inActionPlan).toBe(true);

    const afterSecondToggle = toggleActionPlan(id);
    expect(afterSecondToggle[0].inActionPlan).toBe(false);
  });

  it("findSavedResource matches by type + title regardless of case", () => {
    const saved = saveResource(makeResource());
    expect(findSavedResource(saved, makeResource({ title: "DEEP WORK" }))?.id).toBe(saved[0].id);
    expect(findSavedResource(saved, makeResource({ type: "course" }))).toBeUndefined();
  });

  it("returns an empty list for corrupted stored data (migration safety)", () => {
    window.localStorage.setItem(kaiSavedResourcesStorageKey, "{not valid json");
    expect(readSavedResources()).toEqual([]);
  });

  it("returns an empty list when stored data isn't an array of valid resources", () => {
    window.localStorage.setItem(kaiSavedResourcesStorageKey, JSON.stringify([{ id: "x" }]));
    expect(readSavedResources()).toEqual([]);
  });
});
