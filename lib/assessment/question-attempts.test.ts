import { beforeEach, describe, expect, it } from "vitest";
import { bumpQuestionAttempt, resetQuestionAttempts } from "./question-attempts";

describe("bumpQuestionAttempt", () => {
  beforeEach(() => {
    resetQuestionAttempts();
  });

  it("starts a fresh question at attempt 1", () => {
    expect(bumpQuestionAttempt("Q5")).toBe(1);
  });

  it("increments on repeated calls for the same question", () => {
    bumpQuestionAttempt("Q5");
    bumpQuestionAttempt("Q5");
    expect(bumpQuestionAttempt("Q5")).toBe(3);
  });

  it("tracks each question's count independently", () => {
    bumpQuestionAttempt("Q5");
    bumpQuestionAttempt("Q5");
    expect(bumpQuestionAttempt("Q6")).toBe(1);
    expect(bumpQuestionAttempt("Q5")).toBe(3);
  });

  it("resets cleanly", () => {
    bumpQuestionAttempt("Q5");
    resetQuestionAttempts();
    expect(bumpQuestionAttempt("Q5")).toBe(1);
  });
});
