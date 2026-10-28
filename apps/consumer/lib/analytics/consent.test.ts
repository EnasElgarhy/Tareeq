import { describe, expect, it } from "vitest";
import {
  CONSENT_STORAGE_KEY,
  posthogSourceProperties,
  readConsent,
  writeConsent,
} from "./consent";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe("analytics consent storage", () => {
  it("round-trips a choice and ignores anything else", () => {
    const storage = memoryStorage();
    expect(readConsent(storage)).toBeNull();
    writeConsent(storage, "granted");
    expect(readConsent(storage)).toBe("granted");
    expect(readConsent(memoryStorage({ [CONSENT_STORAGE_KEY]: "maybe" }))).toBeNull();
  });

  it("treats blocked storage as no choice and never throws", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readConsent(blocked)).toBeNull();
    expect(() => writeConsent(blocked, "denied")).not.toThrow();
  });
});

describe("posthogSourceProperties", () => {
  it("names all four utm tags for first and latest touch, leaving out empty ones", () => {
    expect(
      posthogSourceProperties({
        src: "instagram",
        medium: "paid",
        campaign: "launch-m1",
        post: "p2-carousel-03-ar",
        src_last: "whatsapp",
        medium_last: null,
        campaign_last: null,
        post_last: null,
      }),
    ).toEqual({
      utm_source_first: "instagram",
      utm_medium_first: "paid",
      utm_campaign_first: "launch-m1",
      utm_content_first: "p2-carousel-03-ar",
      utm_source_latest: "whatsapp",
    });
  });
});
