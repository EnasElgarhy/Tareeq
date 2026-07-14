import { describe, expect, it } from "vitest";
import {
  buildAverageSeries,
  buildBucketDates,
  buildCountSeries,
  buildRatioSeries,
} from "./trends";

const NOW = new Date("2026-06-30T00:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;

describe("buildBucketDates", () => {
  it("produces 8 daily buckets for 7d (inclusive of today)", () => {
    const dates = buildBucketDates(NOW, "7d");
    expect(dates).toHaveLength(8);
    expect(dates[0].toISOString().slice(0, 10)).toBe("2026-06-23");
    expect(dates.at(-1)?.toISOString().slice(0, 10)).toBe("2026-06-30");
  });

  it("produces 31 daily buckets for 30d", () => {
    const dates = buildBucketDates(NOW, "30d");
    expect(dates).toHaveLength(31);
    expect(dates[0].toISOString().slice(0, 10)).toBe("2026-05-31");
  });

  it("spaces weekly buckets exactly 7 days apart for 90d", () => {
    const dates = buildBucketDates(NOW, "90d");
    expect(dates.length).toBeGreaterThan(1);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i].getTime() - dates[i - 1].getTime()).toBe(7 * DAY_MS);
    }
    expect(dates.at(-1)!.getTime()).toBeLessThanOrEqual(NOW.getTime());
  });

  it("spaces monthly buckets one calendar month apart for 12m", () => {
    const dates = buildBucketDates(NOW, "12m");
    expect(dates.length).toBeGreaterThan(1);
    for (let i = 1; i < dates.length; i++) {
      const prev = dates[i - 1];
      const cur = dates[i];
      const monthsApart =
        (cur.getUTCFullYear() - prev.getUTCFullYear()) * 12 +
        (cur.getUTCMonth() - prev.getUTCMonth());
      expect(monthsApart).toBe(1);
      expect(cur.getUTCDate()).toBe(1);
    }
  });
});

describe("buildCountSeries", () => {
  it("zero-fills empty buckets and counts matching timestamps", () => {
    const series = buildCountSeries(
      ["2026-06-23T10:00:00Z", "2026-06-23T22:00:00Z", "2026-06-30T01:00:00Z"],
      NOW,
      "7d",
    );
    expect(series).toHaveLength(8);
    expect(series[0]).toEqual({ date: "2026-06-23", value: 2 });
    expect(series.at(-1)).toEqual({ date: "2026-06-30", value: 1 });
    expect(series.filter((p) => p.value === 0)).toHaveLength(6);
  });

  it("ignores null and unparseable timestamps", () => {
    const series = buildCountSeries([null, "not-a-date"], NOW, "7d");
    expect(series.every((p) => p.value === 0)).toBe(true);
  });
});

describe("buildAverageSeries", () => {
  it("averages values within each bucket", () => {
    const items = [
      { date: "2026-06-23T00:00:00Z", duration: 100 },
      { date: "2026-06-23T00:00:00Z", duration: 300 },
      { date: "2026-06-30T00:00:00Z", duration: 50 },
    ];
    const series = buildAverageSeries(
      items,
      (i) => i.date,
      (i) => i.duration,
      NOW,
      "7d",
    );
    expect(series[0]).toEqual({ date: "2026-06-23", value: 200 });
    expect(series.at(-1)).toEqual({ date: "2026-06-30", value: 50 });
  });

  it("reports 0 for empty buckets", () => {
    const series = buildAverageSeries<{ date: string; duration: number | null }>(
      [],
      (i) => i.date,
      (i) => i.duration,
      NOW,
      "7d",
    );
    expect(series.every((p) => p.value === 0)).toBe(true);
  });

  it("ignores items with a null value", () => {
    const items = [{ date: "2026-06-23T00:00:00Z", duration: null }];
    const series = buildAverageSeries(
      items,
      (i) => i.date,
      (i) => i.duration,
      NOW,
      "7d",
    );
    expect(series[0].value).toBe(0);
  });
});

describe("buildRatioSeries", () => {
  it("computes the percentage of numerator items per bucket", () => {
    const items = [
      { date: "2026-06-23T00:00:00Z", done: true },
      { date: "2026-06-23T00:00:00Z", done: false },
      { date: "2026-06-30T00:00:00Z", done: true },
    ];
    const series = buildRatioSeries(
      items,
      (i) => i.date,
      (i) => i.done,
      NOW,
      "7d",
    );
    expect(series[0]).toEqual({ date: "2026-06-23", value: 50 });
    expect(series.at(-1)).toEqual({ date: "2026-06-30", value: 100 });
  });

  it("reports 0 for buckets with no items rather than null", () => {
    const series = buildRatioSeries<{ date: string; done: boolean }>(
      [],
      (i) => i.date,
      (i) => i.done,
      NOW,
      "7d",
    );
    expect(series.every((p) => p.value === 0)).toBe(true);
  });
});
