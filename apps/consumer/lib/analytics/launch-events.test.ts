import { describe, expect, test } from "vitest";
import {
  amountAed,
  assessmentScreen,
  attemptDistinctId,
  profileProperties,
  utmProperties,
} from "@/lib/analytics/launch-events";

describe("utmProperties", () => {
  test("carries the first visit's link tags", () => {
    expect(
      utmProperties({ src: "instagram", medium: "social", campaign: "launch", post: "parent-toolkit-1" }),
    ).toEqual({
      utm_source: "instagram",
      utm_medium: "social",
      utm_campaign: "launch",
      utm_content: "parent-toolkit-1",
    });
  });

  test("counts a visit with no tags as direct", () => {
    expect(utmProperties({})).toEqual({ utm_source: "direct" });
  });
});

describe("profileProperties", () => {
  test("groups country, stage of study and age from the background answers", () => {
    expect(
      profileProperties({
        locale: "ar",
        answers: { QD1: "AGE-16-17", QD2: "United Arab Emirates", QD3: "QD3-C", QD4: "QD4-F" },
      }),
    ).toEqual({ language: "AR", country: "UAE", stage_of_study: "Grade 11-12", age_group: "13-17" });
  });

  test("reports any country outside the three markets as other", () => {
    expect(profileProperties({ locale: "en", answers: { QD2: "Jordan" } })).toEqual({
      language: "EN",
      country: "other",
    });
  });

  test("leaves out what is not known yet", () => {
    expect(profileProperties({ locale: "en", answers: {} })).toEqual({ language: "EN" });
    expect(profileProperties({})).toEqual({});
  });

  test("never passes on the gender answer or an unrecognised value", () => {
    const properties = profileProperties({ answers: { QD1: "B", QD3: "A", QD4: "QD4-M" } });
    expect(properties).toEqual({});
  });
});

describe("assessmentScreen", () => {
  test("names each fixed step of the assessment", () => {
    expect(assessmentScreen("/start")).toBe("start");
    expect(assessmentScreen("/intro")).toBe("meet_kai");
    expect(assessmentScreen("/contract")).toBe("promises");
    expect(assessmentScreen("/part/3")).toBe("part_3_intro");
    expect(assessmentScreen("/done")).toBe("end");
    expect(assessmentScreen("/register")).toBe("registration");
  });

  test("returns null for pages outside the assessment", () => {
    expect(assessmentScreen("/")).toBeNull();
    expect(assessmentScreen("/q/5")).toBeNull();
    expect(assessmentScreen("/part/9")).toBeNull();
  });
});

describe("amountAed", () => {
  test("converts fils to dirhams", () => {
    expect(amountAed(36000, "aed")).toBe(360);
  });

  test("returns null when the payment was not in AED", () => {
    expect(amountAed(36000, "usd")).toBeNull();
    expect(amountAed(null, "aed")).toBeNull();
  });
});

describe("attemptDistinctId", () => {
  test("gives the same anonymous ID for the same attempt, without exposing it", async () => {
    const assessmentId = "3f0c7a52-9c1e-4f6e-8a0b-2f5d6c7e8a90";
    const first = await attemptDistinctId(assessmentId);
    expect(first).toBe(await attemptDistinctId(assessmentId));
    expect(first).toMatch(/^attempt_[0-9a-f]{24}$/);
    expect(first).not.toContain(assessmentId.slice(0, 8));
  });

  test("gives different IDs for different attempts", async () => {
    expect(await attemptDistinctId("a")).not.toBe(await attemptDistinctId("b"));
  });
});
