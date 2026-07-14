import { describe, expect, it } from "vitest";
import { generateInsights } from "./insights";
import { makeRow } from "./test-fixtures";
import type { DerivedRow } from "./types";

function repeat(n: number, overrides: Partial<DerivedRow> = {}): DerivedRow[] {
  return Array.from({ length: n }, (_, i) =>
    makeRow({ id: `row-${i}`, identityKey: `user-${i}`, ...overrides }),
  );
}

describe("generateInsights", () => {
  it("produces nothing when both periods are empty", () => {
    expect(generateInsights([], [])).toEqual([]);
  });

  it("produces nothing below the minimum sample size", () => {
    const current = repeat(2, { coreResult: { topCluster: "TECH", archetype: "Explorer", primaryDriver: null, secondaryDriver: null, ecosystemFit: null } });
    const previous = repeat(2, { coreResult: { topCluster: "BUS", archetype: "Explorer", primaryDriver: null, secondaryDriver: null, ecosystemFit: null } });
    expect(generateInsights(current, previous)).toEqual([]);
  });

  it("flags a cluster whose share moved enough", () => {
    const techResult = {
      topCluster: "TECH",
      archetype: "Explorer",
      primaryDriver: null,
      secondaryDriver: null,
      ecosystemFit: null,
    };
    const busResult = { ...techResult, topCluster: "BUS" };
    const current = repeat(8, { coreResult: techResult });
    const previous = repeat(8, { coreResult: busResult });

    const insights = generateInsights(current, previous);
    const mover = insights.find((i) => i.id === "cluster-mover");
    expect(mover).toBeDefined();
    expect(mover!.text).toContain("Technology");
    expect(mover!.text).toContain("increased");
  });

  it("flags a drop in average completion time", () => {
    const current = repeat(6, { durationSeconds: 400 });
    const previous = repeat(6, { durationSeconds: 1000 });
    const insights = generateInsights(current, previous);
    const time = insights.find((i) => i.id === "completion-time");
    expect(time).toBeDefined();
    expect(time!.severity).toBe("positive");
    expect(time!.text).toContain("dropped");
  });

  it("flags a fall in completion rate as a warning", () => {
    const current = [
      ...repeat(2, { completedAt: "2026-06-01T00:00:00Z" }),
      ...repeat(6, { completedAt: null }),
    ];
    const previous = repeat(8, { completedAt: "2026-05-01T00:00:00Z" });
    const insights = generateInsights(current, previous);
    const rate = insights.find((i) => i.id === "completion-rate");
    expect(rate).toBeDefined();
    expect(rate!.severity).toBe("warning");
    expect(rate!.text).toContain("fell");
  });

  it("announces a new leading country", () => {
    const current = repeat(6, { country: "Egypt" });
    const previous = repeat(6, { country: "UAE" });
    const insights = generateInsights(current, previous);
    const country = insights.find((i) => i.id === "top-country");
    expect(country).toBeDefined();
    expect(country!.text).toContain("Egypt");
    expect(country!.text).toContain("UAE");
  });

  it("does not announce a country change without a real previous leader", () => {
    const current = repeat(6, { country: "Egypt" });
    const previous = repeat(2, { country: "UAE" });
    const insights = generateInsights(current, previous);
    const country = insights.find((i) => i.id === "top-country");
    expect(country!.text).not.toContain("overtaking");
  });

  it("flags a rise in research consent", () => {
    const current = repeat(6, { consentResearch: true });
    const previous = repeat(6, { consentResearch: false });
    const insights = generateInsights(current, previous);
    const consent = insights.find((i) => i.id === "consent-rate");
    expect(consent).toBeDefined();
    expect(consent!.severity).toBe("positive");
  });

  it("flags a data quality score change", () => {
    const current = repeat(6, { isFlagged: false });
    const previous = repeat(6, { isFlagged: true });
    const insights = generateInsights(current, previous);
    const quality = insights.find((i) => i.id === "quality-score");
    expect(quality).toBeDefined();
    expect(quality!.severity).toBe("positive");
  });

  it("surfaces an abandonment hotspot from incomplete attempts", () => {
    const current = [
      ...repeat(4, { completedAt: null, answeredCount: 18 }),
      ...repeat(1, { completedAt: null, answeredCount: 30 }),
    ];
    const insights = generateInsights(current, []);
    const hotspot = insights.find((i) => i.id === "abandonment-hotspot");
    expect(hotspot).toBeDefined();
    expect(hotspot!.text).toContain("question 18");
  });

  it("does not surface an abandonment hotspot below the minimum sample", () => {
    const current = repeat(2, { completedAt: null, answeredCount: 18 });
    const insights = generateInsights(current, []);
    expect(insights.find((i) => i.id === "abandonment-hotspot")).toBeUndefined();
  });
});
