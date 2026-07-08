import { describe, expect, it } from "vitest";
import { pickAvatarBackground, pickAvatarMarkIndex } from "@/lib/profile/avatar";

describe("pickAvatarMarkIndex", () => {
  it("returns the same mark for the same name every time", () => {
    expect(pickAvatarMarkIndex("Ahmed Wahba", 8)).toBe(pickAvatarMarkIndex("Ahmed Wahba", 8));
  });

  it("stays within bounds of the mark count", () => {
    const index = pickAvatarMarkIndex("Sara", 8);
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(8);
  });

  it("varies across different names", () => {
    const names = ["Ahmed", "Sara", "Youssef", "Lina", "Omar", "Nour"];
    const indices = new Set(names.map((name) => pickAvatarMarkIndex(name, 8)));
    expect(indices.size).toBeGreaterThan(1);
  });

  it("handles an empty seed without throwing", () => {
    expect(() => pickAvatarMarkIndex("", 8)).not.toThrow();
  });

  it("returns 0 when markCount is 0", () => {
    expect(pickAvatarMarkIndex("Ahmed", 0)).toBe(0);
  });
});

describe("pickAvatarBackground", () => {
  it("returns the same background for the same name every time", () => {
    expect(pickAvatarBackground("Ahmed Wahba")).toBe(pickAvatarBackground("Ahmed Wahba"));
  });

  it("returns a valid gradient string", () => {
    expect(pickAvatarBackground("Sara")).toMatch(/^linear-gradient/);
  });

  it("varies independently from the mark index", () => {
    const names = ["Ahmed", "Sara", "Youssef", "Lina", "Omar", "Nour"];
    const backgrounds = new Set(names.map((name) => pickAvatarBackground(name)));
    expect(backgrounds.size).toBeGreaterThan(1);
  });
});
