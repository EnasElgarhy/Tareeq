import { describe, expect, it } from "vitest";
import {
  aggregateBySource,
  NO_SOURCE,
  parseSourceReportParams,
  recentWeeks,
  shiftWeek,
  weekBounds,
  weekStartFor,
  type SourceEvent,
} from "@/lib/admin/analytics/by-source";
import { buildSourceReportCsv } from "@/lib/admin/analytics/by-source-csv";

const ev = (eventName: string, metadata: Record<string, unknown> = {}): SourceEvent => ({
  eventName,
  metadata,
});
const insta = { src: "instagram", post: "parent-toolkit-1", src_last: "tiktok", post_last: "reel-2" };
const school = { src: "school-visit", post: null, src_last: "school-visit", post_last: null };

describe("weeks (Monday to Sunday, Dubai time)", () => {
  it("finds the Dubai Monday, including late Sunday UTC that is already Monday in Dubai", () => {
    expect(weekStartFor(new Date("2026-10-24T12:00:00Z"))).toBe("2026-10-19"); // Saturday
    expect(weekStartFor(new Date("2026-10-25T21:00:00Z"))).toBe("2026-10-26"); // Mon 01:00 Dubai
    expect(weekStartFor(new Date("2026-10-19T19:59:00Z"))).toBe("2026-10-19");
  });

  it("bounds a week from Monday 00:00 to the next Monday 00:00 Dubai, in UTC", () => {
    expect(weekBounds("2026-10-19")).toEqual({
      weekStart: "2026-10-19",
      weekEnd: "2026-10-25",
      startIso: "2026-10-18T20:00:00.000Z",
      endIso: "2026-10-25T20:00:00.000Z",
    });
  });

  it("steps weeks across a month end and lists recent weeks newest first", () => {
    expect(shiftWeek("2026-10-26", 1)).toBe("2026-11-02");
    expect(recentWeeks(new Date("2026-10-24T12:00:00Z"), 3)).toEqual([
      "2026-10-19",
      "2026-10-12",
      "2026-10-05",
    ]);
  });

  it("accepts only a past or current Monday", () => {
    const now = new Date("2026-10-24T12:00:00Z");
    expect(parseSourceReportParams({ week: "2026-10-12", touch: "last" }, now)).toEqual({
      weekStart: "2026-10-12",
      touch: "last",
      groupBy: "post",
    });
    expect(parseSourceReportParams({ week: "2026-10-13" }, now).weekStart).toBe("2026-10-19");
    expect(parseSourceReportParams({ week: "2026-11-02" }, now).weekStart).toBe("2026-10-19");
    expect(parseSourceReportParams({ week: "2026-02-30", groupBy: "source" }, now)).toMatchObject({
      weekStart: "2026-10-19",
      groupBy: "source",
    });
  });
});

describe("aggregateBySource", () => {
  const events = [
    ev("session_started", insta),
    ev("session_started", insta),
    ev("assessment_started", insta),
    ev("assessment_completed", insta),
    ev("payment_succeeded", insta),
    ev("results_viewed", insta),
    ev("kai_opened", insta),
    ev("session_started", school),
    ev("session_started", {}),
    ev("question_viewed", insta), // not a report event
  ];

  it("counts each metric per first-touch source and post", () => {
    const { rows, totals } = aggregateBySource(events, "first", "post");
    expect(rows.map((r) => [r.source, r.post])).toEqual([
      ["instagram", "parent-toolkit-1"],
      ["school-visit", null],
      [NO_SOURCE, null],
    ]);
    expect(rows[0].counts).toEqual({
      visits: 2,
      starts: 1,
      completions: 1,
      parentAsks: 0,
      payments: 1,
      reportOpens: 1,
      kaiOpens: 1,
    });
    expect(totals.visits).toBe(4);
    expect(totals.parentAsks).toBe(0);
  });

  it("credits the latest touch when asked", () => {
    const { rows } = aggregateBySource(events, "last", "post");
    expect(rows[0]).toMatchObject({ source: "tiktok", post: "reel-2" });
  });

  it("merges posts when grouping by source only", () => {
    const { rows } = aggregateBySource(
      [ev("session_started", insta), ev("session_started", { ...insta, post: "other" })],
      "first",
      "source",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ source: "instagram", post: null });
    expect(rows[0].counts.visits).toBe(2);
  });

  it("returns empty rows and zero totals for no events", () => {
    const { rows, totals } = aggregateBySource([], "first", "post");
    expect(rows).toEqual([]);
    expect(totals.visits).toBe(0);
  });

  it("exports the week, the ask-a-parent column and a total row", () => {
    const report = aggregateBySource(events, "first", "post");
    const lines = buildSourceReportCsv(report, {
      weekStart: "2026-10-19",
      touch: "first",
      groupBy: "post",
    })
      .trim()
      .split("\r\n");
    expect(lines[0]).toContain("Ask-a-parent links sent");
    expect(lines[0]).not.toContain("not tracked yet");
    expect(lines[1]).toBe("2026-10-19 to 2026-10-25,first touch,instagram,parent-toolkit-1,2,1,1,0,1,1,1");
    expect(lines.at(-1)).toBe("2026-10-19 to 2026-10-25,first touch,Total,,4,1,1,0,1,1,1");
  });

  it("counts ask-a-parent links from parent_link_created", () => {
    const { totals } = aggregateBySource([ev("parent_link_created", insta)], "first", "post");
    expect(totals.parentAsks).toBe(1);
  });

  it("groups by medium or campaign, first or latest touch", () => {
    const tagged = {
      src: "instagram",
      medium: "paid",
      campaign: "launch-m1",
      src_last: "whatsapp",
      medium_last: "share",
      campaign_last: null,
    };
    const byMedium = aggregateBySource([ev("session_started", tagged)], "first", "medium");
    expect(byMedium.rows[0]).toMatchObject({ source: "paid", post: null });

    const byCampaign = aggregateBySource([ev("session_started", tagged)], "first", "campaign");
    expect(byCampaign.rows[0].source).toBe("launch-m1");

    const latest = aggregateBySource([ev("session_started", tagged)], "last", "campaign");
    expect(latest.rows[0].source).toBe(NO_SOURCE);
  });

  it("reads medium and campaign grouping from the URL and exports the right column", () => {
    const params = parseSourceReportParams({ groupBy: "campaign" }, new Date("2026-10-24T12:00:00Z"));
    expect(params.groupBy).toBe("campaign");
    const header = buildSourceReportCsv(aggregateBySource([], "first", "campaign"), params).split("\r\n")[0];
    expect(header).toContain("Campaign");
    expect(header).not.toContain("Content");
  });
});
