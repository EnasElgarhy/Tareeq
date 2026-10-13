import { describe, expect, it } from "vitest";
import { ageBandFor, ageInYears } from "./age";

const OCT_2026 = new Date("2026-10-04T10:00:00Z");

describe("ageInYears", () => {
  it("counts full years once the birth month has passed", () => {
    expect(ageInYears({ year: 2010, month: 9 }, OCT_2026)).toBe(16);
  });

  it("treats the birth month itself as not yet reached, to protect minors", () => {
    // Without a day we cannot know the birthday has passed, so stay younger.
    expect(ageInYears({ year: 2013, month: 10 }, OCT_2026)).toBe(12);
  });

  it("rejects a month outside 1–12", () => {
    expect(() => ageInYears({ year: 2010, month: 13 }, OCT_2026)).toThrow(/month/);
  });

  it("rejects a birth date in the future", () => {
    expect(() => ageInYears({ year: 2026, month: 11 }, OCT_2026)).toThrow(/future/);
  });

  it("rejects an implausible year", () => {
    expect(() => ageInYears({ year: 1900, month: 1 }, OCT_2026)).toThrow(/year/);
  });
});

describe("ageBandFor", () => {
  it("stops anyone under 13", () => {
    expect(ageBandFor({ year: 2014, month: 1 }, OCT_2026)).toBe("under13");
  });

  it("needs guardian consent from 13 to 17", () => {
    expect(ageBandFor({ year: 2013, month: 9 }, OCT_2026)).toBe("13-17");
    expect(ageBandFor({ year: 2008, month: 11 }, OCT_2026)).toBe("13-17");
  });

  it("is an adult from 18", () => {
    expect(ageBandFor({ year: 2008, month: 9 }, OCT_2026)).toBe("18+");
  });
});
