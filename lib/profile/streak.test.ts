import { beforeEach, describe, expect, it } from "vitest";
import { computeStreak, readVisitDates, recordVisitToday } from "@/lib/profile/streak";

describe("recordVisitToday / readVisitDates", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("has no visits before the first one is recorded", () => {
    expect(readVisitDates()).toEqual([]);
  });

  it("records today's date", () => {
    const now = new Date(2026, 5, 15);
    recordVisitToday(now);
    expect(readVisitDates()).toEqual(["2026-06-15"]);
  });

  it("is idempotent — visiting twice in one day doesn't duplicate", () => {
    const now = new Date(2026, 5, 15);
    recordVisitToday(now);
    recordVisitToday(now);
    expect(readVisitDates()).toEqual(["2026-06-15"]);
  });

  it("accumulates distinct days", () => {
    recordVisitToday(new Date(2026, 5, 15));
    recordVisitToday(new Date(2026, 5, 16));
    expect(readVisitDates()).toEqual(["2026-06-15", "2026-06-16"]);
  });
});

describe("computeStreak", () => {
  it("returns 0 for no visits at all", () => {
    expect(computeStreak([], new Date(2026, 5, 15)).count).toBe(0);
  });

  it("counts a single consecutive run ending today", () => {
    const now = new Date(2026, 5, 15); // Monday
    const dates = ["2026-06-13", "2026-06-14", "2026-06-15"];
    expect(computeStreak(dates, now).count).toBe(3);
  });

  it("stops counting at the first gap", () => {
    const now = new Date(2026, 5, 15);
    const dates = ["2026-06-10", "2026-06-14", "2026-06-15"]; // gap before the 14th
    expect(computeStreak(dates, now).count).toBe(2);
  });

  it("does not count today toward the streak until it's actually recorded", () => {
    const now = new Date(2026, 5, 15);
    const dates = ["2026-06-13", "2026-06-14"]; // today itself missing
    expect(computeStreak(dates, now).count).toBe(0);
  });

  it("builds the current Monday-to-Sunday week correctly", () => {
    const now = new Date(2026, 5, 17); // a Wednesday
    const dates = ["2026-06-15", "2026-06-16", "2026-06-17"]; // Mon, Tue, Wed
    const { weekVisited } = computeStreak(dates, now);
    expect(weekVisited).toEqual([true, true, true, false, false, false, false]);
  });

  it("unlocks the badge at exactly 7 consecutive days", () => {
    const now = new Date(2026, 5, 20);
    const dates = [
      "2026-06-14",
      "2026-06-15",
      "2026-06-16",
      "2026-06-17",
      "2026-06-18",
      "2026-06-19",
      "2026-06-20",
    ];
    const info = computeStreak(dates, now);
    expect(info.count).toBe(7);
    expect(info.badgeUnlocked).toBe(true);
    expect(info.daysUntilBadge).toBe(0);
  });

  it("reports days remaining before 7", () => {
    const now = new Date(2026, 5, 15);
    const dates = ["2026-06-13", "2026-06-14", "2026-06-15"];
    const info = computeStreak(dates, now);
    expect(info.badgeUnlocked).toBe(false);
    expect(info.daysUntilBadge).toBe(4);
  });
});
