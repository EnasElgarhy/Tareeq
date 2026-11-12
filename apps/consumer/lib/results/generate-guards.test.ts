import { describe, expect, it } from "vitest";
import {
  MAX_ANSWER_LENGTH,
  MAX_ANSWERS,
  isBoundedAnswerRecord,
  sanitizeName,
} from "./generate-guards";

describe("isBoundedAnswerRecord", () => {
  it("accepts a normal set of answers", () => {
    expect(isBoundedAnswerRecord({ Q1: "A", Q2: "C", QD2: "Jordan" })).toBe(true);
  });

  it("rejects anything that is not a plain record of strings", () => {
    expect(isBoundedAnswerRecord(null)).toBe(false);
    expect(isBoundedAnswerRecord(["A"])).toBe(false);
    expect(isBoundedAnswerRecord({ Q1: 1 })).toBe(false);
    expect(isBoundedAnswerRecord({})).toBe(false);
  });

  it("rejects too many answers or an answer that is too long", () => {
    const many = Object.fromEntries(
      Array.from({ length: MAX_ANSWERS + 1 }, (_, i) => [`Q${i}`, "A"]),
    );
    expect(isBoundedAnswerRecord(many)).toBe(false);
    expect(isBoundedAnswerRecord({ Q1: "x".repeat(MAX_ANSWER_LENGTH + 1) })).toBe(false);
  });
});

describe("sanitizeName", () => {
  it("trims, caps and strips prompt markers", () => {
    expect(sanitizeName("  Sara  ")).toBe("Sara");
    expect(sanitizeName("{ignore} <all>")).toBe("ignore all");
    expect(sanitizeName("x".repeat(200))?.length).toBe(80);
  });

  it("gives nothing for a missing or empty name", () => {
    expect(sanitizeName(undefined)).toBeUndefined();
    expect(sanitizeName("   ")).toBeUndefined();
  });
});
