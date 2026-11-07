import { describe, expect, it } from "vitest";
import { passwordProblem } from "./PasswordForm";

describe("passwordProblem", () => {
  it("accepts a long enough password typed twice", () => {
    expect(passwordProblem("compass-north", "compass-north")).toBeNull();
  });

  it("rejects a short password", () => {
    expect(passwordProblem("short", "short")).toMatch(/at least 8/);
  });

  it("rejects two different entries", () => {
    expect(passwordProblem("compass-north", "compass-south")).toMatch(
      /don't match/,
    );
  });
});
