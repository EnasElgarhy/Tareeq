import { describe, expect, it } from "vitest";
import { isKaiAccessOpen, kaiAccessEndsAt } from "./kai-access";

describe("kaiAccessEndsAt", () => {
  it("ends 3 calendar months after taking CORE", () => {
    expect(kaiAccessEndsAt("2026-10-28T09:30:00.000Z")).toBe("2027-01-28T09:30:00.000Z");
  });

  it("rolls a missing day back to the month's last day", () => {
    expect(kaiAccessEndsAt("2026-11-30T12:00:00.000Z")).toBe("2027-02-28T12:00:00.000Z");
    expect(kaiAccessEndsAt("2027-11-30T12:00:00.000Z")).toBe("2028-02-29T12:00:00.000Z");
  });

  it("returns null for an unreadable date", () => {
    expect(kaiAccessEndsAt("not a date")).toBeNull();
  });
});

describe("isKaiAccessOpen", () => {
  const takenAt = "2026-10-28T09:30:00.000Z";

  it("is open until the end instant and closed from then on", () => {
    expect(isKaiAccessOpen(takenAt, new Date("2027-01-28T09:29:59.000Z"))).toBe(true);
    expect(isKaiAccessOpen(takenAt, new Date("2027-01-28T09:30:00.000Z"))).toBe(false);
  });

  it("is closed without a completed attempt", () => {
    expect(isKaiAccessOpen(null)).toBe(false);
  });
});
