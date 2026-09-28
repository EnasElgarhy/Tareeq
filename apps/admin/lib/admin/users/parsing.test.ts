import { describe, expect, it } from "vitest";
import {
  filtersToSearchParams,
  isDefaultFilter,
  parseUserFilters,
} from "@/lib/admin/users/filters";
import { parseSort } from "@/lib/admin/users/sort";
import { pageCount, parsePagination } from "@/lib/admin/users/pagination";
import { buildTimeline } from "@/lib/admin/users/timeline";

describe("parseUserFilters", () => {
  it("defaults everything to 'all' with no params", () => {
    const f = parseUserFilters({});
    expect(isDefaultFilter(f)).toBe(true);
    expect(f.search).toBeNull();
  });

  it("accepts allowlisted values and rejects junk", () => {
    const f = parseUserFilters({ account: "deleted", risk: "high_risk", language: "zz", kai: "used" });
    expect(f.account).toBe("deleted");
    expect(f.risk).toBe("high_risk");
    expect(f.language).toBe("all"); // junk → default
    expect(f.kai).toBe("used");
  });

  it("trims and caps search, drops empty", () => {
    expect(parseUserFilters({ q: "  sara  " }).search).toBe("sara");
    expect(parseUserFilters({ q: "   " }).search).toBeNull();
    expect(parseUserFilters({ q: "x".repeat(500) }).search?.length).toBe(100);
  });

  it("round-trips non-default filters through search params, omitting defaults", () => {
    const f = parseUserFilters({ q: "ali", risk: "needs_attention" });
    const p = filtersToSearchParams(f);
    expect(p.get("q")).toBe("ali");
    expect(p.get("risk")).toBe("needs_attention");
    expect(p.get("account")).toBeNull(); // default omitted
  });

  it("takes the first value of a repeated param", () => {
    expect(parseUserFilters({ account: ["active", "deleted"] }).account).toBe("active");
  });
});

describe("parseSort", () => {
  it("defaults to registered_desc for missing/unknown", () => {
    expect(parseSort(undefined)).toBe("registered_desc");
    expect(parseSort("'; DROP TABLE users; --")).toBe("registered_desc");
  });
  it("passes an allowlisted key", () => {
    expect(parseSort("risk")).toBe("risk");
    expect(parseSort("name")).toBe("name");
  });
});

describe("parsePagination", () => {
  it("defaults to page 1 / 25 per page", () => {
    expect(parsePagination(undefined, undefined)).toEqual({ page: 1, perPage: 25, offset: 0 });
  });
  it("computes offset and clamps perPage to the allowlist", () => {
    expect(parsePagination("3", "50")).toEqual({ page: 3, perPage: 50, offset: 100 });
    expect(parsePagination("1", "9999").perPage).toBe(25); // not allowlisted → default
  });
  it("clamps page to >= 1 for junk/negative", () => {
    expect(parsePagination("-4", "25").page).toBe(1);
    expect(parsePagination("abc", "25").page).toBe(1);
  });
  it("pageCount is at least 1", () => {
    expect(pageCount(0, 25)).toBe(1);
    expect(pageCount(51, 25)).toBe(3);
  });
});

describe("buildTimeline", () => {
  it("orders registration, assessments and first milestone events chronologically", () => {
    const t = buildTimeline({
      registeredAt: "2026-01-01T00:00:00Z",
      assessments: [
        { label: "CORE Compass", startedAt: "2026-01-02T00:00:00Z", completedAt: "2026-01-02T01:00:00Z" },
      ],
      events: [
        { name: "results_viewed", at: "2026-01-03T00:00:00Z" },
        { name: "kai_opened", at: "2026-01-04T00:00:00Z" },
      ],
    });
    expect(t.map((e) => e.code)).toEqual([
      "registered",
      "assessment_started",
      "assessment_completed",
      "results_viewed",
      "kai_opened",
    ]);
  });

  it("collapses repeated milestone events to the first occurrence", () => {
    const t = buildTimeline({
      registeredAt: null,
      assessments: [],
      events: [
        { name: "kai_opened", at: "2026-02-02T00:00:00Z" },
        { name: "kai_opened", at: "2026-02-01T00:00:00Z" },
        { name: "kai_opened", at: "2026-02-03T00:00:00Z" },
      ],
    });
    const opens = t.filter((e) => e.code === "kai_opened");
    expect(opens).toHaveLength(1);
    expect(opens[0].at).toBe("2026-02-01T00:00:00Z"); // earliest
  });

  it("ignores unknown/noisy event names and invalid timestamps", () => {
    const t = buildTimeline({
      registeredAt: null,
      assessments: [],
      events: [
        { name: "some_debug_event", at: "2026-01-01T00:00:00Z" },
        { name: "kai_opened", at: "not-a-date" },
      ],
    });
    expect(t).toEqual([]);
  });
});
