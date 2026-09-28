import { afterEach, describe, expect, it, vi } from "vitest";
import type { PersonalizedCompassReport } from "@/lib/results/types";
import {
  buildResultDocument,
  buildResultDocumentFilename,
  openResultDocument,
} from "@/lib/results/export-document";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function reportFixture(): PersonalizedCompassReport {
  return {
    generatedAt: "2026-07-17T12:00:00.000Z",
    source: "gemini",
    model: "gemini-test",
    clusterCode: "LAW",
    clusterName: "Law and Diplomacy",
    isMultiCurious: false,
    multiCuriousClusters: [],
    archetype: "Precisionist",
    primaryDriver: "Mastery",
    secondaryDriver: "Stability",
    ecosystemFit: "Structured Team Player",
    headline: "A careful advocate",
    summary: "You enjoy examining evidence and building a clear case.",
    academicPath: "Explore law, public policy, and international relations.",
    careerLandscape: "Legal research and diplomacy are useful starting points.",
    integration:
      "Your attention to detail supports careful, public-facing work.",
    realityCheck: "Test the daily work before choosing a degree.",
    nextSteps: "Speak to one law student and compare two university programs.",
    highSchoolSubjects: ["English", "History"],
    universityMajors: ["Law", "International Relations"],
    careerExamples: ["Lawyer", "Policy Analyst"],
    nonObviousPaths: ["Corporate Compliance"],
    score: {
      confidencePercentage: 82,
    } as PersonalizedCompassReport["score"],
  };
}

describe("buildResultDocument", () => {
  it("builds a complete printable result without exposing raw HTML", () => {
    const html = buildResultDocument({
      report: {
        ...reportFixture(),
        summary: "Strong evidence <script>alert('no')</script>",
      },
      name: "Sarah & Co.",
      locale: "en",
      variant: "full",
    });

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Sarah &amp; Co.’s Career Compass");
    expect(html).toContain("Your profile may thrive in career families like…");
    expect(html).toContain("Corporate Compliance");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("@media print");
  });

  it("builds an RTL parent guide with conversation prompts", () => {
    const html = buildResultDocument({
      report: reportFixture(),
      name: "سارة",
      locale: "ar",
      variant: "parent",
    });

    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain("لأولياء الأمور");
    expect(html).toContain("أسئلة تناقشونها معاً");
    expect(html).toContain("Speak to one law student");
  });
});

describe("buildResultDocumentFilename", () => {
  it("creates a portable filename for full and parent documents", () => {
    expect(buildResultDocumentFilename("Sarah Gouda", "full")).toBe(
      "tareeq-Sarah-Gouda-career-compass.html",
    );
    expect(buildResultDocumentFilename("Sarah Gouda", "parent")).toBe(
      "tareeq-Sarah-Gouda-parent-guide.html",
    );
  });
});

describe("openResultDocument", () => {
  it("writes the generated document before opening the print dialog", () => {
    vi.useFakeTimers();
    const documentOpen = vi.fn();
    const documentWrite = vi.fn();
    const documentClose = vi.fn();
    const focus = vi.fn();
    const print = vi.fn();
    const printWindow = {
      opener: window,
      document: {
        open: documentOpen,
        write: documentWrite,
        close: documentClose,
      },
      focus,
      print,
    } as unknown as Window;
    vi.spyOn(window, "open").mockReturnValue(printWindow);

    expect(
      openResultDocument("<html>complete report</html>", "fallback.html"),
    ).toBe("print");
    expect(documentOpen).toHaveBeenCalledOnce();
    expect(documentWrite).toHaveBeenCalledWith("<html>complete report</html>");
    expect(documentClose).toHaveBeenCalledOnce();

    vi.runAllTimers();
    expect(focus).toHaveBeenCalledOnce();
    expect(print).toHaveBeenCalledOnce();
  });
});
