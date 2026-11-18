import { describe, expect, it } from "vitest";
import guideFile from "@/lib/core-v2/content/data/kai-subject-guide-1.0.json";
import {
  BUNDLED_SUBJECT_GUIDE,
  guideCountryKey,
  parseSubjectGuide,
  subjectGuideFor,
} from "./subject-guide";

describe("guideCountryKey", () => {
  it("maps the profile's country to the guide's entries", () => {
    expect(guideCountryKey("United Arab Emirates")).toBe("UAE");
    expect(guideCountryKey("Saudi Arabia")).toBe("Saudi Arabia");
    expect(guideCountryKey("Egypt")).toBe("Egypt");
  });

  it("has no entry for other or unknown countries", () => {
    expect(guideCountryKey("Jordan")).toBeNull();
    expect(guideCountryKey(null)).toBeNull();
  });
});

describe("parseSubjectGuide", () => {
  it("accepts the approved file", () => {
    const parsed = parseSubjectGuide(guideFile);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.guide.version).toBe("1.0 (2026-11-17)");
  });

  it("refuses a file without the parts Kai relies on", () => {
    expect(parseSubjectGuide({ version: "2" }).ok).toBe(false);
    expect(parseSubjectGuide(null).ok).toBe(false);
    const withoutCountries = Object.fromEntries(
      Object.entries(guideFile).filter(([key]) => key !== "countries"),
    );
    expect(parseSubjectGuide(withoutCountries).ok).toBe(false);
  });
});

describe("subjectGuideFor", () => {
  it("keeps the rules, every field group, the student's country and their report's families", () => {
    const view = subjectGuideFor(BUNDLED_SUBJECT_GUIDE, {
      country: "United Arab Emirates",
      familyIds: ["F-RD-1"],
    });
    expect(view.version).toBe("1.0 (2026-11-17)");
    expect(view.rule_for_kai.length).toBeGreaterThan(0);
    expect(view.job_families.map((family) => family.family)).toEqual(["Medicine and health sciences"]);
    expect(view.job_families[0].field_groups[0]).toBe("1. Medicine and veterinary medicine");
    expect(view.country?.name).toBe("UAE");
    // The whole country entry: a student can ask about a field outside their report.
    expect(Object.keys(view.country?.by_field_group ?? {})).toHaveLength(19);
    expect(view.field_groups).toHaveLength(19);
    expect(Object.keys(view.country?.by_field_group ?? {})[0]).toBe("1. Medicine and veterinary medicine");
  });

  it("says so when the student's country has no entry", () => {
    const view = subjectGuideFor(BUNDLED_SUBJECT_GUIDE, {
      country: "Jordan",
      familyIds: ["F-RD-1"],
    });
    expect(view.country).toBeNull();
    expect(view.countries_covered).toEqual(["UAE", "Saudi Arabia", "Egypt"]);
  });

  it("never passes an internal id or group code", () => {
    const view = subjectGuideFor(BUNDLED_SUBJECT_GUIDE, {
      country: "Egypt",
      familyIds: BUNDLED_SUBJECT_GUIDE.job_families.map((family) => family.id),
    });
    const json = JSON.stringify(view);
    expect(json).not.toMatch(/F-[A-Z]{2}-/);
    for (const code of Object.keys(BUNDLED_SUBJECT_GUIDE.field_groups)) {
      expect(json).not.toContain(`"${code}"`);
    }
  });

  it("ignores family ids the guide does not know", () => {
    const view = subjectGuideFor(BUNDLED_SUBJECT_GUIDE, {
      country: "Egypt",
      familyIds: ["F-NOPE-1"],
    });
    expect(view.job_families).toEqual([]);
    expect(view.country?.name).toBe("Egypt");
  });
});
