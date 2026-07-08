import { beforeEach, describe, expect, it } from "vitest";
import { kaiMemoryStorageKey, LocalMemoryProvider } from "@/lib/kai/memory/memory-storage";

describe("LocalMemoryProvider", () => {
  let provider: LocalMemoryProvider;

  beforeEach(() => {
    window.localStorage.clear();
    provider = new LocalMemoryProvider();
  });

  it("returns an empty profile when nothing is stored", async () => {
    const profile = await provider.read();
    expect(profile).toEqual({ items: [], personSummary: "", updatedAt: expect.any(String) });
  });

  it("round-trips a written profile", async () => {
    const profile = {
      items: [
        {
          id: "mem-1",
          category: "goal" as const,
          value: "Study abroad",
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
      personSummary: "Ahmed wants to study abroad.",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };

    await provider.write(profile);
    expect(await provider.read()).toEqual(profile);
  });

  it("clear() empties the stored profile", async () => {
    await provider.write({ items: [], personSummary: "x", updatedAt: "2026-06-01T00:00:00.000Z" });
    await provider.clear();
    expect(await provider.read()).toEqual({ items: [], personSummary: "", updatedAt: expect.any(String) });
  });

  // --- Migration safety: malformed / legacy-shaped stored data must
  // never crash the app, only fall back to an empty profile. ---

  it("returns an empty profile for corrupted (non-JSON) stored data", async () => {
    window.localStorage.setItem(kaiMemoryStorageKey, "{not valid json");
    expect(await provider.read()).toEqual({ items: [], personSummary: "", updatedAt: expect.any(String) });
  });

  it("returns an empty profile when the stored value is missing required fields", async () => {
    window.localStorage.setItem(kaiMemoryStorageKey, JSON.stringify({ items: [] }));
    expect(await provider.read()).toEqual({ items: [], personSummary: "", updatedAt: expect.any(String) });
  });

  it("returns an empty profile when items contains a malformed entry", async () => {
    window.localStorage.setItem(
      kaiMemoryStorageKey,
      JSON.stringify({ items: [{ id: "mem-1" }], personSummary: "", updatedAt: "2026-06-01T00:00:00.000Z" }),
    );
    expect(await provider.read()).toEqual({ items: [], personSummary: "", updatedAt: expect.any(String) });
  });

  it("returns an empty profile for a totally unrelated stored shape (e.g. a future schema)", async () => {
    window.localStorage.setItem(kaiMemoryStorageKey, JSON.stringify({ version: 2, facts: ["AI"] }));
    expect(await provider.read()).toEqual({ items: [], personSummary: "", updatedAt: expect.any(String) });
  });

  it("returns an empty profile for a JSON array instead of an object", async () => {
    window.localStorage.setItem(kaiMemoryStorageKey, JSON.stringify([1, 2, 3]));
    expect(await provider.read()).toEqual({ items: [], personSummary: "", updatedAt: expect.any(String) });
  });
});
