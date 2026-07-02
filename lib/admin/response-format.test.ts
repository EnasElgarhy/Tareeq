import { describe, expect, it } from "vitest";
import type { QuestionRow } from "@/lib/admin/content";
import {
  decodeAnswers,
  pickText,
  respondentLabel,
  summarizeResult,
} from "@/lib/admin/response-format";

describe("pickText", () => {
  it("prefers the requested locale, then English, then first value", () => {
    expect(pickText({ en: "Hello", ar: "مرحبا" }, "ar")).toBe("مرحبا");
    expect(pickText({ en: "Hello", ar: "مرحبا" }, "en")).toBe("Hello");
    expect(pickText({ fr: "Bonjour" }, "ar")).toBe("Bonjour");
  });

  it("returns empty string for missing text", () => {
    expect(pickText(null)).toBe("");
    expect(pickText(undefined)).toBe("");
  });
});

describe("summarizeResult", () => {
  it("extracts the fields the admin UI renders from a CompassResult", () => {
    const result = {
      topCluster: "TECH",
      clusterRanked: [
        ["TECH", 5],
        ["SCI", 3],
        ["ENG", 2],
        ["ART", 0],
      ],
      archetype: "Explorer",
      primaryDriver: "MAS",
      secondaryDriver: "AUT",
      driverNames: { MAS: "Mastery", AUT: "Autonomy" },
      ecosystemFit: "Solo Specialist",
      confidenceLabel: "High",
      confidencePercentage: 82,
    };
    const s = summarizeResult(result);
    expect(s.topCluster).toBe("TECH");
    expect(s.topClusters).toEqual(["TECH", "SCI", "ENG"]);
    expect(s.archetype).toBe("Explorer");
    expect(s.primaryDriver).toBe("Mastery");
    expect(s.secondaryDriver).toBe("Autonomy");
    expect(s.ecosystemFit).toBe("Solo Specialist");
    expect(s.confidenceLabel).toBe("High");
    expect(s.confidencePercentage).toBe(82);
  });

  it("falls back to clusterRanked when topCluster is absent", () => {
    const s = summarizeResult({ clusterRanked: [["BUS", 4]] });
    expect(s.topCluster).toBe("BUS");
  });

  it("tolerates null / partial / garbage payloads", () => {
    expect(summarizeResult(null).topCluster).toBeNull();
    expect(summarizeResult("nope").archetype).toBeNull();
    expect(summarizeResult({}).confidencePercentage).toBeNull();
    expect(summarizeResult({ primaryDriver: "REC" }).primaryDriver).toBe("REC");
  });
});

describe("decodeAnswers", () => {
  const questions: QuestionRow[] = [
    {
      id: "q1",
      external_id: "Q1",
      pillar: 1,
      position: 0,
      kind: "single",
      title: { en: "What pulls you in?" },
      axis: null,
      is_archived: false,
      options: [
        {
          id: "o1",
          letter: "A",
          position: 0,
          text: { en: "Building things" },
          cluster_code: "TECH",
          driver_code: null,
          axis_value: null,
        },
        {
          id: "o2",
          letter: "B",
          position: 1,
          text: { en: "Helping people" },
          cluster_code: "PPL",
          driver_code: null,
          axis_value: null,
        },
      ],
    },
    {
      id: "q2",
      external_id: "QT",
      pillar: 0,
      position: 1,
      kind: "text",
      title: { en: "Anything else?" },
      axis: null,
      is_archived: false,
      options: [],
    },
  ];

  it("maps a chosen letter to its option text", () => {
    const decoded = decodeAnswers(questions, { Q1: "A" });
    expect(decoded[0].chosenLetter).toBe("A");
    expect(decoded[0].chosenText).toBe("Building things");
    expect(decoded[0].answered).toBe(true);
  });

  it("reads free-text answers as the value itself", () => {
    const decoded = decodeAnswers(questions, { QT: "I love music" });
    expect(decoded[1].chosenLetter).toBeNull();
    expect(decoded[1].chosenText).toBe("I love music");
    expect(decoded[1].answered).toBe(true);
  });

  it("marks unanswered questions", () => {
    const decoded = decodeAnswers(questions, {});
    expect(decoded[0].answered).toBe(false);
    expect(decoded[0].chosenText).toBeNull();
  });
});

describe("respondentLabel", () => {
  const base = {
    respondentName: null,
    respondentEmail: null,
    profileName: null,
    anonSessionId: null,
    userId: null,
  };

  it("prefers the respondent name", () => {
    expect(respondentLabel({ ...base, respondentName: "Layla Hassan" })).toBe(
      "Layla Hassan",
    );
  });

  it("falls back to profile name, then email, then anon session", () => {
    expect(respondentLabel({ ...base, profileName: "Omar" })).toBe("Omar");
    expect(respondentLabel({ ...base, respondentEmail: "x@y.z" })).toBe("x@y.z");
    expect(
      respondentLabel({ ...base, anonSessionId: "sample-resp-1-abcdef" }),
    ).toBe("Anonymous · sample-resp-");
  });

  it("returns Anonymous when nothing identifies the respondent", () => {
    expect(respondentLabel(base)).toBe("Anonymous");
  });
});
