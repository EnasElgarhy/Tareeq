import { describe, expect, it } from "vitest";
import {
  flagsByPart,
  orderQuestions,
  presentOptions,
  seededRandom,
  toCoreAnswers,
  type CoreQuestion,
  type ResponseRecord,
} from "./attempt";

const option = (id: string, code: string) => ({ id, code });

function curiosityQuestion(n: number, fixed: number): CoreQuestion {
  return {
    id: `P1-${String(n).padStart(2, "0")}`,
    part: 1,
    fixedOrderPosition: fixed,
    options: [
      option(`P1-${n}-RD`, "RD"),
      option(`P1-${n}-PW`, "PW"),
      option(`P1-${n}-TS`, "TS"),
      option(`P1-${n}-AE`, "AE"),
    ],
  };
}

describe("presentOptions", () => {
  it("returns every option exactly once with 1-based positions", () => {
    const shown = presentOptions(curiosityQuestion(1, 1), seededRandom(7));
    expect(shown.map((o) => o.position)).toEqual([1, 2, 3, 4]);
    expect(shown.map((o) => o.id).sort()).toEqual(
      ["P1-1-AE", "P1-1-PW", "P1-1-RD", "P1-1-TS"].sort(),
    );
  });

  it("changes the order between students (different seeds)", () => {
    const orders = new Set(
      [1, 2, 3, 4, 5, 6].map((seed) =>
        presentOptions(curiosityQuestion(1, 1), seededRandom(seed))
          .map((o) => o.code)
          .join(),
      ),
    );
    expect(orders.size).toBeGreaterThan(1);
  });

  it("shows every option in every position about equally often", () => {
    // 4,000 students: each option should land in each slot ~1,000 times.
    const STUDENTS = 4000;
    const tally = new Map<string, number>();
    for (let seed = 1; seed <= STUDENTS; seed++) {
      for (const shown of presentOptions(curiosityQuestion(1, 1), seededRandom(seed))) {
        const key = `${shown.code}@${shown.position}`;
        tally.set(key, (tally.get(key) ?? 0) + 1);
      }
    }
    expect(tally.size).toBe(16);
    const expected = STUDENTS / 4;
    for (const count of tally.values()) {
      expect(Math.abs(count - expected) / expected).toBeLessThan(0.1);
    }
  });

  it("shuffles two-option questions fairly too", () => {
    const question: CoreQuestion = {
      id: "P2-01",
      part: 2,
      fixedOrderPosition: 1,
      axis: "structure",
      options: [option("P2-01-S", "S"), option("P2-01-F", "F")],
    };
    let sFirst = 0;
    const STUDENTS = 4000;
    for (let seed = 1; seed <= STUDENTS; seed++) {
      if (presentOptions(question, seededRandom(seed))[0].code === "S") sFirst += 1;
    }
    expect(Math.abs(sFirst / STUDENTS - 0.5)).toBeLessThan(0.05);
  });

  it("is reproducible for the same seed", () => {
    const a = presentOptions(curiosityQuestion(1, 1), seededRandom(42));
    const b = presentOptions(curiosityQuestion(1, 1), seededRandom(42));
    expect(a).toEqual(b);
  });
});

describe("orderQuestions", () => {
  const part1 = [curiosityQuestion(1, 3), curiosityQuestion(2, 1), curiosityQuestion(3, 2)];
  const part2: CoreQuestion = {
    id: "P2-01",
    part: 2,
    fixedOrderPosition: 1,
    axis: "structure",
    options: [option("P2-01-S", "S"), option("P2-01-F", "F")],
  };

  it("uses fixed_order_position when not shuffling, part by part", () => {
    const ordered = orderQuestions([part2, ...part1], "fixed");
    expect(ordered.map((q) => q.id)).toEqual(["P1-02", "P1-03", "P1-01", "P2-01"]);
  });

  it("never mixes parts when shuffling", () => {
    const ordered = orderQuestions([part2, ...part1], "shuffled", seededRandom(3));
    expect(ordered.map((q) => q.part)).toEqual([1, 1, 1, 2]);
  });
});

describe("toCoreAnswers", () => {
  it("scores by code, never by the position shown", () => {
    const questions: CoreQuestion[] = [
      {
        id: "P2-01",
        part: 2,
        fixedOrderPosition: 1,
        axis: "structure",
        options: [option("P2-01-S", "S"), option("P2-01-F", "F")],
      },
    ];
    const responses: ResponseRecord[] = [
      {
        questionId: "P2-01",
        optionId: "P2-01-F",
        code: "F",
        part: 2,
        positionShown: 1,
        optionsShown: [],
        timeOnScreenMs: 3000,
        orderShown: 1,
        answeredAt: "2026-10-04T10:00:00Z",
      },
    ];
    expect(toCoreAnswers(responses, questions).axes).toEqual([
      { axis: "structure", side: "F" },
    ]);
  });

  it("rejects an option the question does not have", () => {
    const question = curiosityQuestion(1, 1);
    expect(() =>
      toCoreAnswers(
        [
          {
            questionId: question.id,
            optionId: "P1-1-XX",
            code: "RD",
            part: 1,
            positionShown: 1,
            optionsShown: [],
            timeOnScreenMs: 3000,
            orderShown: 1,
            answeredAt: "2026-10-04T10:00:00Z",
          },
        ],
        [question],
      ),
    ).toThrow(/P1-1-XX/);
  });
});

describe("flagsByPart", () => {
  it("flags each part from its own answers", () => {
    const records = (part: 1 | 3, timeMs: number, position: number, n: number) =>
      Array.from({ length: n }, (_, i): ResponseRecord => ({
        questionId: `P${part}-${i}`,
        optionId: `P${part}-${i}-x`,
        code: "x",
        part,
        positionShown: position,
        optionsShown: [],
        timeOnScreenMs: timeMs,
        orderShown: i + 1,
        answeredAt: "2026-10-04T10:00:00Z",
      }));
    const flags = flagsByPart([...records(1, 4000, 2, 5), ...records(3, 900, 1, 5)]);
    expect(flags[1]?.flagged).toBe(true); // same position every time
    expect(flags[1]?.rushed).toBe(false);
    expect(flags[3]?.rushed).toBe(true);
    expect(flags[2]).toBeUndefined();
  });
});
