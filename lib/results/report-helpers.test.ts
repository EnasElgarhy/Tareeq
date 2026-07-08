import { describe, expect, it } from "vitest";
import { getSubjectReason, youtubeSearchUrl } from "@/lib/results/report-helpers";

describe("youtubeSearchUrl", () => {
  it("builds a YouTube search URL with the query encoded", () => {
    expect(youtubeSearchUrl("day in the life of Software Engineer")).toBe(
      "https://www.youtube.com/results?search_query=day%20in%20the%20life%20of%20Software%20Engineer",
    );
  });
});

describe("getSubjectReason", () => {
  it("gives a technology-flavored reason for computing subjects", () => {
    expect(getSubjectReason("Computer Science", "Technology")).toContain("Technology");
    expect(getSubjectReason("Computer Science", "Technology")).toContain("digital systems");
  });

  it("gives a quantitative reason for maths", () => {
    expect(getSubjectReason("Further Maths", "Engineering")).toContain("quantitative fluency");
  });

  it("gives an evidence-based reason for science subjects", () => {
    expect(getSubjectReason("Biology", "Science and Data")).toContain("evidence-based");
  });

  it("gives a communication reason for humanities subjects", () => {
    expect(getSubjectReason("History", "Law and Diplomacy")).toContain("communication");
  });

  it("gives a portfolio reason for arts subjects", () => {
    expect(getSubjectReason("Visual Arts", "Arts and Media")).toContain("portfolio");
  });

  it("gives a markets reason for business subjects", () => {
    expect(getSubjectReason("Economics", "Business")).toContain("markets");
  });

  it("falls back to a generic reason for an unrecognized subject", () => {
    expect(getSubjectReason("Underwater Basket Weaving", "Environment")).toContain("Environment");
  });

  it("matches subjects case-insensitively", () => {
    expect(getSubjectReason("COMPUTER SCIENCE", "Technology")).toContain("digital systems");
  });
});
