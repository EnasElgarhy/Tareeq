import { describe, expect, it } from "vitest";
import { attemptArchetype, attemptHeadline } from "@/lib/admin/attempt-result";

const CORE_RESULT = { scoringVersion: "2.0", leadingCuriosities: ["RD", "PW"] };
const V4_RESULT = { topCluster: "Builders", archetype: "Maker" };

describe("attemptHeadline", () => {
  it("reads CORE results by leading curiosities", () => {
    expect(attemptHeadline("core-2.0", CORE_RESULT)).toBe(
      "Research & Discovery · People & Wellbeing",
    );
  });

  it("reads v4 results by top cluster", () => {
    expect(attemptHeadline("legacy-v4", V4_RESULT)).toBe("Builders");
  });

  it("never reads one generation's result with the other's rules", () => {
    expect(attemptHeadline("core-2.0", V4_RESULT)).toBeNull();
    expect(attemptHeadline("legacy-v4", CORE_RESULT)).toBeNull();
    expect(attemptArchetype("core-2.0", V4_RESULT)).toBeNull();
    expect(attemptArchetype("legacy-v4", V4_RESULT)).toBe("Maker");
  });

  it("returns null for unknown generations", () => {
    expect(attemptHeadline(null, V4_RESULT)).toBeNull();
  });
});
