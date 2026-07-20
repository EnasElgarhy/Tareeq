import { describe, expect, it } from "vitest";
import {
  DEMO_FALLBACK_LABELS,
  normalizeCountry,
  resolveDemographicsFromAnswers,
  type DemoLabelMap,
} from "@/lib/admin/analytics/demographics";

describe("normalizeCountry", () => {
  it("title-cases and trims a single-word country", () => {
    expect(normalizeCountry("  egypt ")).toBe("Egypt");
    expect(normalizeCountry("EGYPT")).toBe("Egypt");
  });

  it("capitalises each word of a multi-word country", () => {
    expect(normalizeCountry("saudi arabia")).toBe("Saudi Arabia");
  });

  it("returns null for empty / whitespace / null", () => {
    expect(normalizeCountry("")).toBeNull();
    expect(normalizeCountry("   ")).toBeNull();
    expect(normalizeCountry(null)).toBeNull();
  });
});

describe("resolveDemographicsFromAnswers", () => {
  it("reads all four dimensions from QD1..QD4 (seed labels)", () => {
    const r = resolveDemographicsFromAnswers({
      Q1: "A",
      QD1: "C", // 18 or 19
      QD2: "Egypt",
      QD3: "C", // Year 1 or 2 of university
      QD4: "A", // Female
    });
    expect(r).toEqual({
      country: "Egypt",
      ageBand: "18-19",
      educationLevel: "Year 1 or 2 of university",
      gender: "Female",
    });
  });

  it("maps QD1 'A' to the under-16 band", () => {
    expect(resolveDemographicsFromAnswers({ QD1: "A" }).ageBand).toBe("under-16");
  });

  it("maps QD1 'E' to 22+", () => {
    expect(resolveDemographicsFromAnswers({ QD1: "E" }).ageBand).toBe("22+");
  });

  it("normalises a lowercase free-text country", () => {
    expect(resolveDemographicsFromAnswers({ QD2: "jordan" }).country).toBe("Jordan");
  });

  it("prefers version-specific labels over the seed fallback", () => {
    const labelMap: DemoLabelMap = {
      QD3: { A: "Senior year" },
      QD4: { A: "Woman", B: "Man" },
    };
    const r = resolveDemographicsFromAnswers({ QD3: "A", QD4: "B" }, labelMap);
    expect(r.educationLevel).toBe("Senior year");
    expect(r.gender).toBe("Man");
  });

  it("falls back to seed labels when a letter is missing from the version map", () => {
    const labelMap: DemoLabelMap = { QD3: {}, QD4: { A: "Woman" } };
    // QD4 "B" not in version map → seed fallback
    expect(resolveDemographicsFromAnswers({ QD4: "B" }, labelMap).gender).toBe(
      DEMO_FALLBACK_LABELS.QD4.B,
    );
  });

  it("returns unknown/null for a response that answered no demographic questions", () => {
    expect(resolveDemographicsFromAnswers({ Q1: "A", Q2: "B" })).toEqual({
      country: null,
      ageBand: "unknown",
      gender: null,
      educationLevel: null,
    });
  });

  it("handles a lowercase letter code", () => {
    expect(resolveDemographicsFromAnswers({ QD1: "c" }).ageBand).toBe("18-19");
  });

  it("handles an unrecognised QD1 letter as unknown", () => {
    expect(resolveDemographicsFromAnswers({ QD1: "Z" }).ageBand).toBe("unknown");
  });

  it("handles null / non-object answers safely", () => {
    for (const bad of [null, undefined, "string", 42, []]) {
      expect(resolveDemographicsFromAnswers(bad)).toEqual({
        country: null,
        ageBand: "unknown",
        gender: null,
        educationLevel: null,
      });
    }
  });
});
