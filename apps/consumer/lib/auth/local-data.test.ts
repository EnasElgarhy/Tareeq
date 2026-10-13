import { describe, expect, it } from "vitest";
import { clearLocalUserData } from "./local-data";

function makeStorage(entries: Record<string, string>): Storage {
  const map = new Map(Object.entries(entries));
  return {
    get length() {
      return map.size;
    },
    key: (index: number) => [...map.keys()][index] ?? null,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    clear: () => map.clear(),
  };
}

function keysOf(storage: Storage): string[] {
  return Array.from(
    { length: storage.length },
    (_, i) => storage.key(i)!,
  ).sort();
}

describe("clearLocalUserData", () => {
  it("removes every account-scoped Tareeq key", () => {
    const storage = makeStorage({
      "tareeq.assessment.v4": "{}",
      "tareeq.result.registration.v1": "{}",
      "tareeq.result.report.v1": "{}",
      "tareeq.kai.memory.v1": "{}",
      "tareeq.kai.threads.v2": "[]",
      "tareeq.kai.seenCelebration.core": "1",
      "tareeq.report.access.v1:abc": "{}",
      "tareeq.platform.consent.v1": "1",
      "tareeq:interstitials-seen": "[]",
    });

    clearLocalUserData([storage]);

    expect(keysOf(storage)).toEqual([]);
  });

  it("keeps device preferences and non-Tareeq keys", () => {
    const storage = makeStorage({
      "tareeq.locale": "ar",
      "tareeq:sound": "off",
      "tareeq.staging-replay-consent.v1": "yes",
      tareeq_analytics_session_id: "s1",
      "other-app.key": "x",
      "tareeq.result.report.v1": "{}",
    });

    clearLocalUserData([storage]);

    expect(keysOf(storage)).toEqual([
      "other-app.key",
      "tareeq.locale",
      "tareeq.staging-replay-consent.v1",
      "tareeq:sound",
      "tareeq_analytics_session_id",
    ]);
  });

  it("clears every storage it is given", () => {
    const local = makeStorage({ "tareeq.result.report.v1": "{}" });
    const session = makeStorage({ "tareeq.question.attempts.v1": "{}" });

    clearLocalUserData([local, session]);

    expect(keysOf(local)).toEqual([]);
    expect(keysOf(session)).toEqual([]);
  });
});
