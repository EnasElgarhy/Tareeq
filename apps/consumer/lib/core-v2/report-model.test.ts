import { describe, expect, it } from "vitest";
import { SAMPLE_BANK, SAMPLE_STUDENT } from "./content/sample";
import { buildReportModel, inlineName, withArticle } from "./report-model";
import { scoreCore } from "./scoring";

describe("job and family names inside a sentence", () => {
  it("lower-cases the first letter", () => {
    expect(inlineName("Pharmacist")).toBe("pharmacist");
    expect(inlineName("Medicine and health sciences")).toBe("medicine and health sciences");
  });

  it("keeps names that start with an acronym or proper noun", () => {
    for (const name of ["AI engineer", "UX designer", "IT support", "Arabic teacher", "3D artist", "E-commerce manager"]) {
      expect(inlineName(name)).toBe(name);
    }
  });

  it("chooses a or an", () => {
    expect(withArticle("Pharmacist")).toBe("a pharmacist");
    expect(withArticle("Occupational therapist")).toBe("an occupational therapist");
    expect(withArticle("UX designer")).toBe("a UX designer");
  });
});

describe("buildReportModel for the sample student", () => {
  const result = scoreCore(SAMPLE_STUDENT);
  const model = buildReportModel(result, SAMPLE_BANK, { isFlagged: false, isFlagsLive: false });

  it("is Close and coherent with Research & Discovery and People & Wellbeing", () => {
    expect(result.leadingCuriosities).toEqual(["RD", "PW"]);
    expect(result.directionClarity).toBe("close");
    expect(result.circleReading).toBe("coherent");
    expect(result.leadingMotivators).toEqual(["IMP", "MAS"]);
  });

  it("orders the seven sections", () => {
    expect(model.sections).toEqual(["S1", "S2", "S3", "S4", "S5", "S6", "S7"]);
  });

  it("opens Section 4 with the Clinical and health sciences meet card", () => {
    expect(model.section4.meetCards.map((card) => card.familyId)).toEqual(["F-RD-PW"]);
  });

  it("fills Watch with the meet card's best job and Talk with its family", () => {
    expect(model.watchFills["job 1"]).toMatch(/^an? [a-z]/);
    expect(model.watchFills["job 2"]).toMatch(/^an? [a-z]/);
    expect(model.watchFills["job 2"]).not.toBe(model.watchFills["job 1"]);
    expect(model.talkFill).toBe("clinical and health sciences");
  });

  it("records every block it shows, starting with Before you read", () => {
    expect(model.blocksShown[0]).toBe("S1-TITLE");
    expect(model.blocksShown).toContain("S2-C-CLOSE");
    expect(model.blocksShown).toContain("S2-C-COHERENT");
    expect(model.blocksShown).toContain("S7-CREDIT");
    expect(new Set(model.blocksShown).size).toBe(model.blocksShown.length);
  });
});
