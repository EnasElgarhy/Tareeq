import { describe, expect, it } from "vitest";
import { aggregateBySource } from "@/lib/admin/analytics/by-source";
import { buildWeeklySourceEmail } from "@/lib/admin/analytics/by-source-email";

const params = { weekStart: "2026-10-19", touch: "first" as const, groupBy: "post" as const };

describe("buildWeeklySourceEmail", () => {
  it("names the week and shows each source, content and the total", () => {
    const report = aggregateBySource(
      [
        { eventName: "session_started", metadata: { src: "instagram", post: "p2-carousel-03-ar" } },
        { eventName: "parent_link_created", metadata: { src: "instagram", post: "p2-carousel-03-ar" } },
      ],
      "first",
      "post",
    );
    const email = buildWeeklySourceEmail(report, params, "https://admin.example/sources");

    expect(email.subject).toBe("Map My CORE weekly report by source: 19 Oct 2026 to 25 Oct 2026");
    expect(email.html).toContain("p2-carousel-03-ar");
    expect(email.html).toContain("Ask-a-parent links sent");
    expect(email.text).toContain("Total |  | 1 | 0 | 0 | 1 | 0 | 0 | 0");
    expect(email.html).toContain('href="https://admin.example/sources"');
  });

  it("escapes labels and says when the week is empty", () => {
    const report = aggregateBySource(
      [{ eventName: "session_started", metadata: { src: "<b>x</b>" } }],
      "first",
      "source",
    );
    expect(buildWeeklySourceEmail(report, { ...params, groupBy: "source" }, "u").html).toContain("&lt;b&gt;");

    const empty = buildWeeklySourceEmail(aggregateBySource([], "first", "post"), params, "u");
    expect(empty.text).toContain("Nothing was recorded this week.");
  });
});
