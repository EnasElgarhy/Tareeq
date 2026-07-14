import { describe, expect, it } from "vitest";
import {
  validateProfileRule,
  validateResultProfile,
  validateScoringConfig,
} from "./profile-validation";

describe("validateResultProfile", () => {
  it("accepts a valid new profile", () => {
    expect(
      validateResultProfile({ code: "LEADER", title: { en: "Leader" } }, ["EXPLORER"]),
    ).toEqual([]);
  });
  it("requires a code", () => {
    expect(validateResultProfile({ code: " ", title: { en: "X" } }, [])).toContain(
      "Profile code is required.",
    );
  });
  it("rejects a bad code charset", () => {
    expect(validateResultProfile({ code: "a-b", title: { en: "X" } }, [])).toContain(
      "Code can only contain letters, numbers, and underscores.",
    );
  });
  it("rejects a duplicate code (case-insensitive)", () => {
    expect(
      validateResultProfile({ code: "leader", title: { en: "X" } }, ["LEADER"]),
    ).toContain('Profile code "LEADER" already exists.');
  });
  it("requires an English title", () => {
    expect(validateResultProfile({ code: "OK", title: { ar: "عربي" } }, [])).toContain(
      "English title is required.",
    );
  });
});

describe("validateProfileRule", () => {
  const profiles = ["p1"];
  const categories = ["LEAD", "TECH"];

  it("accepts a threshold rule", () => {
    expect(
      validateProfileRule(
        { resultProfileId: "p1", conditions: [{ cluster: "LEAD", operator: ">=", value: 10 }] },
        profiles,
        categories,
      ),
    ).toEqual([]);
  });
  it("accepts a category-vs-category rule", () => {
    expect(
      validateProfileRule(
        { resultProfileId: "p1", conditions: [{ cluster: "TECH", operator: ">", valueCategory: "LEAD" }] },
        profiles,
        categories,
      ),
    ).toEqual([]);
  });
  it("rejects an unknown target profile", () => {
    expect(
      validateProfileRule(
        { resultProfileId: "ghost", conditions: [{ cluster: "LEAD", operator: ">=", value: 1 }] },
        profiles,
        categories,
      ),
    ).toContain("Rule must point to an existing result profile.");
  });
  it("rejects an empty rule", () => {
    expect(
      validateProfileRule({ resultProfileId: "p1", conditions: [] }, profiles, categories),
    ).toContain("A rule needs at least one condition.");
  });
  it("rejects unknown categories on both sides", () => {
    const errors = validateProfileRule(
      { resultProfileId: "p1", conditions: [{ cluster: "GHOST", operator: ">", valueCategory: "PHANTOM" }] },
      profiles,
      categories,
    );
    expect(errors).toContain('Condition references unknown category "GHOST".');
    expect(errors).toContain('Condition compares against unknown category "PHANTOM".');
  });
  it("requires a numeric value when no valueCategory", () => {
    expect(
      validateProfileRule(
        { resultProfileId: "p1", conditions: [{ cluster: "LEAD", operator: ">=" }] },
        profiles,
        categories,
      ),
    ).toContain('Condition on "LEAD" needs a numeric value.');
  });
});

describe("validateScoringConfig", () => {
  it("first_match needs at least one rule", () => {
    expect(
      validateScoringConfig({
        strategy: "first_match",
        categories: ["LEAD"],
        profiles: [{ id: "p1" }],
        ruleCount: 0,
      }),
    ).toContain("First-match mode needs at least one rule.");
  });
  it("highest_score_wins needs every category mapped to a profile", () => {
    const errors = validateScoringConfig({
      strategy: "highest_score_wins",
      categories: ["LEAD", "TECH"],
      profiles: [{ id: "p1", categoryCode: "LEAD" }],
      ruleCount: 0,
    });
    expect(errors.some((e) => e.includes("TECH"))).toBe(true);
  });
  it("flags duplicate category→profile mappings in highest_score_wins", () => {
    const errors = validateScoringConfig({
      strategy: "highest_score_wins",
      categories: ["LEAD"],
      profiles: [
        { id: "p1", categoryCode: "LEAD" },
        { id: "p2", categoryCode: "LEAD" },
      ],
      ruleCount: 0,
    });
    expect(errors.some((e) => e.includes("only one can win"))).toBe(true);
  });

  it("passes a complete highest_score_wins config", () => {
    expect(
      validateScoringConfig({
        strategy: "highest_score_wins",
        categories: ["LEAD", "TECH"],
        profiles: [
          { id: "p1", categoryCode: "LEAD" },
          { id: "p2", categoryCode: "TECH" },
        ],
        ruleCount: 0,
      }),
    ).toEqual([]);
  });
});
