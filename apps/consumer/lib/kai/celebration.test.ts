import { beforeEach, describe, expect, it } from "vitest";
import { hasSeenModuleCelebration, markModuleCelebrationSeen } from "@/lib/kai/celebration";

describe("celebration", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("has not seen a module's celebration by default", () => {
    expect(hasSeenModuleCelebration("core-compass")).toBe(false);
  });

  it("marks a module's celebration as seen independently of other modules", () => {
    markModuleCelebrationSeen("core-compass");

    expect(hasSeenModuleCelebration("core-compass")).toBe(true);
    expect(hasSeenModuleCelebration("deep-dive")).toBe(false);
  });

  it("persists across separate calls, not just within one session", () => {
    markModuleCelebrationSeen("skills-audit");
    expect(hasSeenModuleCelebration("skills-audit")).toBe(true);
  });
});
