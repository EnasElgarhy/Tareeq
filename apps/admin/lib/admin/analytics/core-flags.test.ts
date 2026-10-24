import { describe, expect, it } from "vitest";
import { flagPart, median } from "@/lib/admin/analytics/core-flags";

// The first five cases repeat apps/consumer/lib/core-v2/flags.test.ts, so the
// admin copy of the rule cannot drift from the consumer's without failing here.
const answer = (timeMs: number, position: number | null) => ({ timeMs, position });

describe("median", () => {
  it("takes the middle value, averaging the two middles for even counts", () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
});

describe("flagPart", () => {
  it("flags rushing when the median time per question is under 2,000 ms", () => {
    const flags = flagPart([answer(1500, 1), answer(1900, 2), answer(5000, 3), answer(1200, 4)]);
    expect(flags.medianMs).toBe(1700);
    expect(flags.rushed).toBe(true);
    expect(flags.flagged).toBe(true);
  });

  it("does not flag a median of exactly 2,000 ms", () => {
    expect(flagPart([answer(2000, 1), answer(2000, 2), answer(2000, 3)]).rushed).toBe(false);
  });

  it("flags the same position chosen in 90% or more of a part's questions", () => {
    const flags = flagPart([...Array.from({ length: 9 }, () => answer(4000, 1)), answer(4000, 2)]);
    expect(flags.largestSamePositionShare).toBe(0.9);
    expect(flags.samePosition).toBe(true);
    expect(flags.flagged).toBe(true);
  });

  it("leaves a varied, unhurried part unflagged", () => {
    const flags = flagPart([answer(4000, 1), answer(3500, 2), answer(6000, 1), answer(5200, 3)]);
    expect(flags).toMatchObject({ rushed: false, samePosition: false, flagged: false });
  });

  it("rejects an empty part and invalid times", () => {
    expect(() => flagPart([])).toThrow(/no answers/);
    expect(() => flagPart([answer(-1, 1)])).toThrow(/Invalid time/);
  });

  it("takes the same-position share over known positions only", () => {
    const flags = flagPart([answer(4000, 2), answer(4000, 2), answer(4000, null)]);
    expect(flags.largestSamePositionShare).toBe(1);
    expect(flags.samePosition).toBe(true);
  });

  it("cannot flag same position when no position is known", () => {
    const flags = flagPart([answer(4000, null), answer(5000, null)]);
    expect(flags.largestSamePositionShare).toBeNull();
    expect(flags.samePosition).toBe(false);
  });
});
