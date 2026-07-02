import { describe, expect, it } from "vitest";
import { generateAlerts } from "./alerts";
import { makeRow } from "./test-fixtures";
import type { DerivedRow } from "./types";

function repeat(n: number, overrides: Partial<DerivedRow> = {}): DerivedRow[] {
  return Array.from({ length: n }, (_, i) =>
    makeRow({ id: `row-${i}`, ...overrides }),
  );
}

describe("generateAlerts", () => {
  it("produces nothing for a small, healthy sample", () => {
    expect(generateAlerts(repeat(2))).toEqual([]);
  });

  it("produces nothing for a healthy, sufficiently large sample", () => {
    expect(generateAlerts(repeat(10))).toEqual([]);
  });

  it("flags high abandonment as critical below 50% completion", () => {
    const rows = [
      ...repeat(2, { completedAt: "2026-06-01T00:00:00Z" }),
      ...repeat(8, { completedAt: null }),
    ];
    const alert = generateAlerts(rows).find((a) => a.id === "high-abandonment");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("critical");
  });

  it("flags high abandonment as a warning between 50% and 70%", () => {
    const rows = [
      ...repeat(6, { completedAt: "2026-06-01T00:00:00Z" }),
      ...repeat(4, { completedAt: null }),
    ];
    const alert = generateAlerts(rows).find((a) => a.id === "high-abandonment");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("warning");
  });

  it("flags mostly-missing demographics", () => {
    const rows = repeat(10, { country: null, gender: null });
    const alert = generateAlerts(rows).find(
      (a) => a.id === "missing-demographics",
    );
    expect(alert).toBeDefined();
  });

  it("flags low research consent only when consent was actually asked", () => {
    const rows = repeat(10, { consentResearch: false });
    const alert = generateAlerts(rows).find((a) => a.id === "low-consent");
    expect(alert).toBeDefined();
  });

  it("does not flag consent when none was collected", () => {
    const rows = repeat(10, { consentResearch: null });
    expect(generateAlerts(rows).find((a) => a.id === "low-consent")).toBeUndefined();
  });

  it("flags low data quality score", () => {
    const rows = repeat(10, { isFlagged: true });
    const alert = generateAlerts(rows).find((a) => a.id === "low-quality");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("critical");
  });
});
