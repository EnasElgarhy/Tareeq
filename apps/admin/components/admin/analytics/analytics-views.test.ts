import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AttemptTimingCard } from "@/components/admin/analytics/AttemptTimingCard";
import { SourceReportTable } from "@/components/admin/analytics/SourceReportTable";
import { TimingTable } from "@/components/admin/analytics/TimingTable";
import { aggregateBySource } from "@/lib/admin/analytics/by-source";
import { attemptsFromEvents, DEFAULT_TIMING_LIST_PARAMS } from "@/lib/admin/analytics/timing";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) =>
    createElement("a", { href, ...rest }, children),
}));

// Mock data: one careful attempt and one that taps through part 1.
const mockEvents = ["careful", "rushed"].flatMap((attempt) =>
  ["P1-01", "P1-02", "P1-03"].flatMap((questionId, i) => [
    {
      eventName: "question_answered",
      assessmentId: attempt,
      assessmentVersion: "core-5.1",
      questionId,
      occurredAt: `2026-10-20T08:0${i}:00Z`,
      metadata: { selectedAnswer: attempt === "rushed" ? "A" : "ABC"[i], pillar: 1 },
    },
    {
      eventName: "question_time_spent",
      assessmentId: attempt,
      assessmentVersion: "core-5.1",
      questionId,
      occurredAt: `2026-10-20T08:0${i}:30Z`,
      metadata: { timeSpentMs: attempt === "rushed" ? 700 : 5200, pillar: 1, src: "instagram" },
    },
  ]),
);

describe("Timing views", () => {
  const attempts = attemptsFromEvents(mockEvents);

  it("lists each attempt with its average and fast flag", () => {
    const html = renderToStaticMarkup(
      createElement(TimingTable, {
        attempts,
        params: DEFAULT_TIMING_LIST_PARAMS,
        baseQuery: "from=2026-10-01",
      }),
    );
    expect(html).toContain("Anonymous attempt");
    expect(html).toContain("5.2 s");
    expect(html).toContain("0.7 s");
    expect(html).toContain("rushed P1 · same position P1");
    expect(html).toContain("href=\"?from=2026-10-01&amp;sort=avg&amp;dir=desc\"");
  });

  it("shows one attempt's parts on the response detail card", () => {
    const rushed = attempts.find((a) => a.attemptKey === "rushed") ?? null;
    const html = renderToStaticMarkup(
      createElement(AttemptTimingCard, { lookup: { attempt: rushed, hasResponsesTable: true } }),
    );
    expect(html).toContain("Part 1");
    expect(html).toContain("100%");
    expect(html).toContain("Fast");
  });

  it("explains a missing timing record", () => {
    const html = renderToStaticMarkup(
      createElement(AttemptTimingCard, { lookup: { attempt: null, hasResponsesTable: false } }),
    );
    expect(html).toContain("not saved for this attempt");
    expect(html).toContain("core_responses table is not in this database yet");
  });
});

describe("By source view", () => {
  it("renders rows, an empty ask-a-parent column and totals", () => {
    const report = aggregateBySource(
      [
        { eventName: "session_started", metadata: { src: "instagram", post: "p1" } },
        { eventName: "kai_opened", metadata: { src: "instagram", post: "p1" } },
      ],
      "first",
      "post",
    );
    const html = renderToStaticMarkup(createElement(SourceReportTable, { report, showPost: true }));
    expect(html).toContain("instagram");
    expect(html).toContain("not tracked yet");
    expect(html).toContain("Total");
  });
});
