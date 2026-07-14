import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { applyMemoryUpdates, clearAllMemory, forgetMemoryItem, readMemory, setMemoryProvider } from "@/lib/kai/memory/memory";
import { LocalMemoryProvider } from "@/lib/kai/memory/memory-storage";
import type { KaiMemoryProfile, KaiMemoryProvider } from "@/lib/kai/memory/memory-types";

describe("memory facade (default LocalMemoryProvider)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    setMemoryProvider(new LocalMemoryProvider());
  });

  it("reads an empty profile when nothing has been stored", async () => {
    const profile = await readMemory();
    expect(profile.items).toEqual([]);
  });

  it("applyMemoryUpdates persists new items and reports them as created", async () => {
    const { profile, created, updated } = await applyMemoryUpdates([
      { category: "career_interest", value: "Artificial Intelligence" },
    ]);
    expect(profile.items).toHaveLength(1);
    expect(created).toHaveLength(1);
    expect(updated).toHaveLength(0);
    expect((await readMemory()).items).toHaveLength(1);
  });

  it("applyMemoryUpdates reports a duplicate as updated, not created", async () => {
    await applyMemoryUpdates([{ category: "goal", value: "Study abroad" }]);
    const second = await applyMemoryUpdates([{ category: "goal", value: "Study abroad" }]);
    expect(second.created).toHaveLength(0);
    expect(second.updated).toHaveLength(1);
    expect((await readMemory()).items).toHaveLength(1);
  });

  it("forgetMemoryItem removes exactly one item and persists the change", async () => {
    const { profile } = await applyMemoryUpdates([
      { category: "goal", value: "Study abroad" },
      { category: "goal", value: "Become entrepreneur" },
    ]);
    const [first] = profile.items;

    const next = await forgetMemoryItem(first.id);
    expect(next.items).toHaveLength(1);
    expect((await readMemory()).items).toHaveLength(1);
  });

  it("clearAllMemory empties stored memory entirely", async () => {
    await applyMemoryUpdates([{ category: "goal", value: "Study abroad" }]);
    await clearAllMemory();
    expect((await readMemory()).items).toEqual([]);
  });
});

describe("memory facade adapter seam", () => {
  afterEach(() => {
    setMemoryProvider(new LocalMemoryProvider());
  });

  it("routes every call through whichever provider is set — proving the adapter pattern, not just localStorage, is what the facade depends on", async () => {
    let writeCount = 0;
    let stored: KaiMemoryProfile = { items: [], personSummary: "", updatedAt: "2026-01-01T00:00:00.000Z" };

    const fakeProvider: KaiMemoryProvider = {
      async read() {
        return stored;
      },
      async write(profile) {
        writeCount += 1;
        stored = profile;
      },
      async clear() {
        stored = { items: [], personSummary: "", updatedAt: "2026-01-01T00:00:00.000Z" };
      },
    };

    setMemoryProvider(fakeProvider);

    await applyMemoryUpdates([{ category: "career_interest", value: "Robotics" }]);
    expect(writeCount).toBe(1);
    expect((await readMemory()).items).toHaveLength(1);

    // localStorage itself must be untouched — everything went through the
    // fake provider instead, which is the whole point of the adapter seam.
    expect(window.localStorage.getItem("tareeq.kai.memory.v1")).toBeNull();
  });
});
