import { describe, expect, it } from "vitest";
import {
  matchesFilters,
  parseFiltersFromSearchParams,
  parseRangeFromSearchParams,
} from "./filters";
import { makeRow } from "./test-fixtures";
import { DEFAULT_FILTERS } from "./types";

describe("parseRangeFromSearchParams", () => {
  it("defaults to 30d when unset", () => {
    expect(parseRangeFromSearchParams({})).toBe("30d");
  });

  it("accepts a valid range", () => {
    expect(parseRangeFromSearchParams({ range: "90d" })).toBe("90d");
  });

  it("falls back to the default for an invalid range", () => {
    expect(parseRangeFromSearchParams({ range: "5y" })).toBe("30d");
  });
});

describe("parseFiltersFromSearchParams", () => {
  it("defaults to including all data when no params are given", () => {
    expect(parseFiltersFromSearchParams({})).toEqual(DEFAULT_FILTERS);
  });

  it("parses valid filter values", () => {
    const filters = parseFiltersFromSearchParams({
      from: "2026-01-01",
      to: "2026-01-31",
      country: "UAE",
      ageBand: "18-19",
      gender: "F",
      catalog: "catalog-1",
      flagged: "only",
      completedOnly: "true",
      researchOnly: "true",
    });
    expect(filters).toEqual({
      from: "2026-01-01",
      to: "2026-01-31",
      country: "UAE",
      ageBand: "18-19",
      gender: "F",
      catalogId: "catalog-1",
      flagged: "only",
      completedOnly: true,
      researchOnly: true,
    });
  });

  it("falls back to defaults for invalid enum values", () => {
    const filters = parseFiltersFromSearchParams({
      ageBand: "ancient",
      flagged: "everything",
    });
    expect(filters.ageBand).toBeNull();
    expect(filters.flagged).toBe("include");
  });

  it("takes the first value when a param is duplicated", () => {
    const filters = parseFiltersFromSearchParams({ country: ["UAE", "KSA"] });
    expect(filters.country).toBe("UAE");
  });
});

describe("matchesFilters", () => {
  it("matches a row with no filters applied", () => {
    expect(matchesFilters(makeRow(), DEFAULT_FILTERS)).toBe(true);
  });

  it("excludes a row completed before the from-date", () => {
    const row = makeRow({ completedAt: "2026-05-31T23:59:00Z" });
    expect(matchesFilters(row, { ...DEFAULT_FILTERS, from: "2026-06-01" })).toBe(
      false,
    );
  });

  it("includes a row completed exactly on the from-date", () => {
    const row = makeRow({ completedAt: "2026-06-01T00:00:00.000Z" });
    expect(matchesFilters(row, { ...DEFAULT_FILTERS, from: "2026-06-01" })).toBe(
      true,
    );
  });

  it("excludes a row completed after the to-date", () => {
    const row = makeRow({ completedAt: "2026-07-01T00:00:01Z" });
    expect(matchesFilters(row, { ...DEFAULT_FILTERS, to: "2026-06-30" })).toBe(
      false,
    );
  });

  it("excludes a never-completed row when a date filter is set", () => {
    const row = makeRow({ completedAt: null });
    expect(matchesFilters(row, { ...DEFAULT_FILTERS, from: "2026-06-01" })).toBe(
      false,
    );
  });

  it("filters by exact country match", () => {
    const row = makeRow({ country: "Egypt" });
    expect(matchesFilters(row, { ...DEFAULT_FILTERS, country: "UAE" })).toBe(
      false,
    );
  });

  it("filters by age band", () => {
    const row = makeRow({ ageBand: "22+" });
    expect(matchesFilters(row, { ...DEFAULT_FILTERS, ageBand: "18-19" })).toBe(
      false,
    );
  });

  it("filters by gender", () => {
    const row = makeRow({ gender: "M" });
    expect(matchesFilters(row, { ...DEFAULT_FILTERS, gender: "F" })).toBe(false);
  });

  it("matches legacy-core rows with no catalog link", () => {
    const row = makeRow({ catalogId: null });
    expect(
      matchesFilters(row, { ...DEFAULT_FILTERS, catalogId: "legacy-core" }),
    ).toBe(true);
  });

  it("excludes catalog-linked rows from the legacy-core filter", () => {
    const row = makeRow({ catalogId: "catalog-1" });
    expect(
      matchesFilters(row, { ...DEFAULT_FILTERS, catalogId: "legacy-core" }),
    ).toBe(false);
  });

  it("filters by a specific catalog id", () => {
    const row = makeRow({ catalogId: "catalog-2" });
    expect(
      matchesFilters(row, { ...DEFAULT_FILTERS, catalogId: "catalog-1" }),
    ).toBe(false);
  });

  it("excludes flagged rows when flagged=exclude", () => {
    const row = makeRow({ isFlagged: true });
    expect(matchesFilters(row, { ...DEFAULT_FILTERS, flagged: "exclude" })).toBe(
      false,
    );
  });

  it("keeps only flagged rows when flagged=only", () => {
    const clean = makeRow({ isFlagged: false });
    const flagged = makeRow({ isFlagged: true });
    const filters = { ...DEFAULT_FILTERS, flagged: "only" as const };
    expect(matchesFilters(clean, filters)).toBe(false);
    expect(matchesFilters(flagged, filters)).toBe(true);
  });

  it("excludes incomplete rows when completedOnly is set", () => {
    const row = makeRow({ completedAt: null });
    expect(matchesFilters(row, { ...DEFAULT_FILTERS, completedOnly: true })).toBe(
      false,
    );
  });

  it("excludes non-consented rows when researchOnly is set", () => {
    const declined = makeRow({ consentResearch: false });
    const unset = makeRow({ consentResearch: null });
    const consented = makeRow({ consentResearch: true });
    const filters = { ...DEFAULT_FILTERS, researchOnly: true };
    expect(matchesFilters(declined, filters)).toBe(false);
    expect(matchesFilters(unset, filters)).toBe(false);
    expect(matchesFilters(consented, filters)).toBe(true);
  });
});
