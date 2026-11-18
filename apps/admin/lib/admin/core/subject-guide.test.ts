import { describe, expect, it } from "vitest";
import guideFile from "@/lib/admin/core/data/kai-subject-guide-1.0.json";
import {
  BUNDLED_SUBJECT_GUIDE,
  parseSubjectGuide,
  summarizeSubjectGuide,
} from "./subject-guide";

describe("parseSubjectGuide (admin upload check)", () => {
  it("accepts the approved file", () => {
    expect(parseSubjectGuide(guideFile).ok).toBe(true);
  });

  it("names what is wrong with a file that is not a subject guide", () => {
    const result = parseSubjectGuide({ name: "x", version: "2" });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.error).toMatch(
        /status|rule_for_kai|field_groups|job_families|countries/,
      );
  });
});

describe("summarizeSubjectGuide", () => {
  it("counts what the guide covers and the entries still to check", () => {
    const summary = summarizeSubjectGuide(BUNDLED_SUBJECT_GUIDE);
    expect(summary).toMatchObject({
      version: "1.0 (2026-11-17)",
      fieldGroups: 19,
      jobFamilies: 76,
      countries: ["UAE", "Saudi Arabia", "Egypt"],
    });
    // "Not yet researched" and "Partly sourced" rows are what Kai must hedge on.
    expect(summary.entriesToCheck).toBeGreaterThan(0);
    expect(summary.entriesToCheck).toBeLessThan(summary.entries);
  });
});
