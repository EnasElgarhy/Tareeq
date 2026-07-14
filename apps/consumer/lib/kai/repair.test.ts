import { describe, expect, it } from "vitest";
import { extractBulletsFromText, extractDayPlanFromText, stripMarkdown } from "@/lib/kai/repair";

describe("stripMarkdown", () => {
  it("removes bold syntax while keeping the words", () => {
    expect(stripMarkdown("This is **really** important")).toBe("This is really important");
  });

  it("removes underscore bold and single-asterisk italic", () => {
    expect(stripMarkdown("__Bold__ and *italic* text")).toBe("Bold and italic text");
  });

  it("removes inline code backticks", () => {
    expect(stripMarkdown("Use the `action_plan` block")).toBe("Use the action_plan block");
  });

  it("removes markdown headers", () => {
    expect(stripMarkdown("## Your Plan\nDetails here")).toBe("Your Plan\nDetails here");
  });

  it("leaves plain text untouched", () => {
    expect(stripMarkdown("Just a normal sentence.")).toBe("Just a normal sentence.");
  });
});

describe("extractBulletsFromText", () => {
  it("extracts a contiguous run of dash bullets", () => {
    const result = extractBulletsFromText("Here's what to do:\n- Watch a video\n- Talk to someone\n- Read an article");
    expect(result).toEqual({
      leadIn: "Here's what to do:",
      items: ["Watch a video", "Talk to someone", "Read an article"],
    });
  });

  it("extracts numbered bullets", () => {
    const result = extractBulletsFromText("Steps:\n1. First step\n2. Second step");
    expect(result).toEqual({ leadIn: "Steps:", items: ["First step", "Second step"] });
  });

  it("returns null for a single bullet (not a real list)", () => {
    expect(extractBulletsFromText("Just one thing:\n- Only item")).toBeNull();
  });

  it("returns null when bullets aren't contiguous", () => {
    expect(extractBulletsFromText("- First\nSome prose in between\n- Second")).toBeNull();
  });

  it("returns null for plain prose with no bullets", () => {
    expect(extractBulletsFromText("This is just a normal paragraph with no lists at all.")).toBeNull();
  });
});

describe("extractDayPlanFromText", () => {
  it("extracts Day N lines into tasks", () => {
    const result = extractDayPlanFromText(
      "Here's your plan:\nDay 1: Watch a career video\nDay 2: Message a professional\nDay 3: Read about majors",
    );
    expect(result).toEqual({
      leadIn: "Here's your plan:",
      tasks: ["Watch a career video", "Message a professional", "Read about majors"],
    });
  });

  it("extracts Week N lines into tasks", () => {
    const result = extractDayPlanFromText("Week 1: Research options\nWeek 2: Talk to your family");
    expect(result).toEqual({ leadIn: "", tasks: ["Research options", "Talk to your family"] });
  });

  it("returns null for a single day line", () => {
    expect(extractDayPlanFromText("Day 1: Just one thing")).toBeNull();
  });

  it("returns null for plain prose with no day/week markers", () => {
    expect(extractDayPlanFromText("You should explore this field over the next week or so.")).toBeNull();
  });
});
