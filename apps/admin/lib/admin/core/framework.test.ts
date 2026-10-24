import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  applyItemTextEdit,
  changedItemIds,
  compareStructure,
  CORE_BANK,
  CORE_PACKAGE_VERSIONS,
  CORE_PILLARS,
  CORE_QUESTION_SET,
  CORE_WORDING,
  countItems,
  decodeCoreAnswers,
  itemsInOrder,
  validateQuestionSet,
  type CoreQuestionSetDoc,
} from "@/lib/admin/core/framework";

function clone(doc: CoreQuestionSetDoc): CoreQuestionSetDoc {
  return JSON.parse(JSON.stringify(doc)) as CoreQuestionSetDoc;
}

describe("CORE package", () => {
  it("is question set 5.2, scoring 2.0, wording 2026-10-19, bank 1.1", () => {
    expect(CORE_QUESTION_SET.version).toBe(CORE_PACKAGE_VERSIONS.questionSet);
    expect(CORE_QUESTION_SET.scoring_version).toBe(
      CORE_PACKAGE_VERSIONS.scoring,
    );
    expect(CORE_WORDING.date).toBe(CORE_PACKAGE_VERSIONS.reportWording);
    expect(CORE_BANK.version).toBe(CORE_PACKAGE_VERSIONS.bank);
  });

  it("has 46 questions across four parts", () => {
    expect(countItems(CORE_QUESTION_SET)).toBe(46);
    expect(CORE_PILLARS.map((p) => CORE_QUESTION_SET.items[p].length)).toEqual([
      16, 8, 14, 8,
    ]);
  });

  it("passes structural validation", () => {
    expect(validateQuestionSet(CORE_QUESTION_SET)).toEqual([]);
  });

  it.each(["questions-5.2.json", "wording-2026-10-19.json", "bank-1.1.json"])(
    "%s matches the consumer's copy",
    (file) => {
      // vitest runs from apps/admin.
      const consumer = resolve(
        process.cwd(),
        "../consumer/lib/core-v2/content/data",
        file,
      );
      // The admin image is built without apps/consumer; only check in the repo.
      if (!existsSync(consumer)) return;
      const admin = resolve(process.cwd(), "lib/admin/core/data", file);
      expect(readFileSync(admin, "utf8")).toBe(readFileSync(consumer, "utf8"));
    },
  );
});

describe("validateQuestionSet", () => {
  it("rejects a P2 option that scores to a curiosity", () => {
    const doc = clone(CORE_QUESTION_SET);
    doc.items.P2[0].options[0].code = "RD";
    expect(validateQuestionSet(doc).join(" ")).toMatch(/P2-01/);
  });

  it("rejects missing Arabic text", () => {
    const doc = clone(CORE_QUESTION_SET);
    doc.items.P1[0].stem_ar = " ";
    expect(validateQuestionSet(doc)).toContain("P1-01 has no Arabic text.");
  });

  it("rejects an axis on a curiosity question", () => {
    const doc = clone(CORE_QUESTION_SET);
    doc.items.P1[0].axis = "structure";
    expect(validateQuestionSet(doc).join(" ")).toMatch(/has no axes/);
  });
});

describe("compareStructure", () => {
  it("accepts wording-only changes", () => {
    const doc = clone(CORE_QUESTION_SET);
    doc.items.P3[2].stem_en = "Reworded";
    expect(compareStructure(CORE_QUESTION_SET, doc)).toEqual([]);
  });

  it("rejects changed codes, removed questions and a new scoring version", () => {
    const doc = clone(CORE_QUESTION_SET);
    doc.items.P1[0].options[0].code = "IE";
    doc.items.P4.pop();
    doc.scoring_version = "2.1";
    const errors = compareStructure(CORE_QUESTION_SET, doc);
    expect(errors).toContain("Scoring version must stay 2.0.");
    expect(errors).toContain("P4 must keep 8 questions.");
    expect(errors.join(" ")).toMatch(/P1-01 changed its options/);
  });
});

describe("applyItemTextEdit", () => {
  it("returns a new document and leaves the original untouched", () => {
    const item = CORE_QUESTION_SET.items.P2[0];
    const firstOption = item.options[0];
    const next = applyItemTextEdit(CORE_QUESTION_SET, item.item_id, {
      stem_en: "  New stem ",
      stem_ar: "نص",
      options: {
        [firstOption.option_id]: { text_en: "Option", text_ar: "خيار" },
      },
    });
    expect(next.items.P2[0].stem_en).toBe("New stem");
    expect(next.items.P2[0].options[0].text_ar).toBe("خيار");
    expect(next.items.P2[0].options[0].code).toBe(firstOption.code);
    expect(CORE_QUESTION_SET.items.P2[0].stem_en).toBe(item.stem_en);
    expect(compareStructure(CORE_QUESTION_SET, next)).toEqual([]);
    expect(changedItemIds(CORE_QUESTION_SET, next)).toEqual([item.item_id]);
    expect(changedItemIds(CORE_QUESTION_SET, CORE_QUESTION_SET)).toEqual([]);
  });

  it("throws for an unknown question", () => {
    expect(() =>
      applyItemTextEdit(CORE_QUESTION_SET, "P9-01", {
        stem_en: "x",
        stem_ar: "x",
        options: {},
      }),
    ).toThrow(/P9-01/);
  });
});

describe("decodeCoreAnswers", () => {
  it("reads letters as file-order options of the CORE set", () => {
    const p1 = itemsInOrder(CORE_QUESTION_SET, "P1")[0];
    const p2 = itemsInOrder(CORE_QUESTION_SET, "P2")[0];
    const decoded = decodeCoreAnswers(
      CORE_QUESTION_SET,
      { [p1.item_id]: "B", [p2.item_id]: "A", QD3: "C" },
      "en",
    );
    expect(decoded[0]).toMatchObject({
      itemId: p1.item_id,
      pillar: "P1",
      code: p1.options[1].code,
      answerText: p1.options[1].text_en,
    });
    expect(decoded[1]).toMatchObject({
      itemId: p2.item_id,
      code: p2.options[0].code,
    });
    expect(decoded[2]).toMatchObject({
      itemId: "QD3",
      pillar: null,
      letter: "C",
    });
  });

  it("marks a letter with no matching option as unknown", () => {
    const p2 = itemsInOrder(CORE_QUESTION_SET, "P2")[0];
    const [row] = decodeCoreAnswers(
      CORE_QUESTION_SET,
      { [p2.item_id]: "D" },
      "ar",
    );
    expect(row.code).toBeNull();
    expect(row.stem).toBe(p2.stem_ar);
  });
});

describe("summarizeCoreResult", () => {
  it("reads a CORE 2.0 result and ignores v4 results", async () => {
    const { summarizeCoreResult, axisZoneLabel } =
      await import("@/lib/admin/core/result");
    const summary = summarizeCoreResult(CORE_QUESTION_SET, {
      scoringVersion: "2.0",
      leadingCuriosities: ["RD", "TS"],
      leadingMotivators: ["MAS"],
      directionClarity: "leaning",
      axes: {
        structure: { count: 3, zone: 1, lean: "S" },
        focus: { count: 2, zone: 2, lean: null },
      },
      contentVersions: { questionSet: "5.2", scoring: "2.0" },
    });
    expect(summary?.leadingCuriosities).toEqual([
      "Research & Discovery",
      "Technology & Systems",
    ]);
    expect(summary?.leadingMotivators).toEqual(["Mastery"]);
    expect(summary?.contentVersions.questionSet).toBe("5.2");
    expect(axisZoneLabel(CORE_QUESTION_SET, summary!.axes[0])).toBe(
      "steps set out",
    );
    expect(axisZoneLabel(CORE_QUESTION_SET, summary!.axes[1])).toBe(
      "A mix of both",
    );
    expect(summary?.axes[2].zone).toBeNull();

    expect(
      summarizeCoreResult(CORE_QUESTION_SET, { archetype: "Builder" }),
    ).toBeNull();
    expect(summarizeCoreResult(CORE_QUESTION_SET, null)).toBeNull();
  });
});

describe("tallyLeadingCuriosities", () => {
  it("counts CORE 2.0 leaders only", async () => {
    const { tallyLeadingCuriosities } = await import("@/lib/admin/core/result");
    const tally = tallyLeadingCuriosities(CORE_QUESTION_SET, [
      { scoringVersion: "2.0", leadingCuriosities: ["RD", "TS"] },
      { scoringVersion: "2.0", leadingCuriosities: ["RD"] },
      { topCluster: "RD", leadingCuriosities: ["RD"] },
      null,
    ]);
    expect(tally.find((t) => t.code === "RD")?.count).toBe(2);
    expect(tally.find((t) => t.code === "TS")?.count).toBe(1);
    expect(tally).toHaveLength(8);
  });
});

describe("hasCoreAnswers", () => {
  it("spots CORE question ids among answers", async () => {
    const { hasCoreAnswers } = await import("@/lib/admin/core/framework");
    expect(hasCoreAnswers({ "P1-01": "A" })).toBe(true);
    expect(hasCoreAnswers({ QD1: "A", "P3-14": "B" })).toBe(true);
    expect(hasCoreAnswers({ Q1: "A", QD1: "B" })).toBe(false);
    expect(hasCoreAnswers({})).toBe(false);
  });
});
