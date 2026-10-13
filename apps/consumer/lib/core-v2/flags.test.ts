import { describe, expect, it } from "vitest";
import { flagPart, median } from "./flags";

const answer = (timeMs: number, position: number) => ({ timeMs, position });

describe("median", () => {
  it("takes the middle value, averaging the two middles for even counts", () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
});

describe("flagPart", () => {
  it("flags rushing when the median time per question is under 2,000 ms", () => {
    const flags = flagPart([
      answer(1500, 1),
      answer(1900, 2),
      answer(5000, 3),
      answer(1200, 4),
    ]);
    expect(flags.medianMs).toBe(1700);
    expect(flags.rushed).toBe(true);
    expect(flags.flagged).toBe(true);
  });

  it("does not flag a median of exactly 2,000 ms", () => {
    const flags = flagPart([answer(2000, 1), answer(2000, 2), answer(2000, 3)]);
    expect(flags.rushed).toBe(false);
  });

  it("flags the same position chosen in 90% or more of a part's questions", () => {
    const tenAnswers = [
      ...Array.from({ length: 9 }, () => answer(4000, 1)),
      answer(4000, 2),
    ];
    const flags = flagPart(tenAnswers);
    expect(flags.largestSamePositionShare).toBe(0.9);
    expect(flags.samePosition).toBe(true);
    expect(flags.flagged).toBe(true);
  });

  it("leaves a varied, unhurried part unflagged", () => {
    const flags = flagPart([
      answer(4000, 1),
      answer(3500, 2),
      answer(6000, 1),
      answer(5200, 3),
    ]);
    expect(flags).toMatchObject({
      rushed: false,
      samePosition: false,
      flagged: false,
    });
  });

  it("rejects an empty part", () => {
    expect(() => flagPart([])).toThrow(/no answers/);
  });
});
