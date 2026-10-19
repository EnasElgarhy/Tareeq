import { describe, expect, it, vi } from "vitest";
import { normalizeCoreEvents, recordCoreKaiEvents } from "./core-events";

describe("normalizeCoreEvents", () => {
  it("keeps well-formed tool calls in the reply's wire format", () => {
    expect(
      normalizeCoreEvents([
        {
          tool: "record_disagreement",
          result: "Planning & Execution",
          student_version: " I like the idea, not the lists ",
          reason: "",
        },
        { tool: "record_shift_explanation", shift: "What sparks your curiosity", explanation: "I joined a robotics club" },
        { tool: "safeguarding_alert" },
      ]),
    ).toEqual([
      {
        tool: "record_disagreement",
        result: "Planning & Execution",
        studentVersion: "I like the idea, not the lists",
        reason: null,
      },
      { tool: "record_shift_explanation", shift: "What sparks your curiosity", explanation: "I joined a robotics club" },
      { tool: "safeguarding_alert" },
    ]);
  });

  it("drops unknown tools, incomplete calls and repeated alerts", () => {
    expect(
      normalizeCoreEvents([
        { tool: "send_email", to: "x" },
        { tool: "record_disagreement", result: "Planning & Execution" },
        { tool: "safeguarding_alert" },
        { tool: "safeguarding_alert" },
        "safeguarding_alert",
      ]),
    ).toEqual([{ tool: "safeguarding_alert" }]);
    expect(normalizeCoreEvents(undefined)).toEqual([]);
  });

  it("caps the student's words", () => {
    const [event] = normalizeCoreEvents([
      { tool: "record_shift_explanation", shift: "s", explanation: "x".repeat(1000) },
    ]);
    expect(event.tool === "record_shift_explanation" && event.explanation).toHaveLength(300);
  });
});

describe("recordCoreKaiEvents", () => {
  it("logs that a tool was called, never what the student wrote", () => {
    const log = { info: vi.fn(), warn: vi.fn() };
    recordCoreKaiEvents(
      [
        { tool: "record_disagreement", result: "Planning & Execution", studentVersion: "private words", reason: null },
        { tool: "safeguarding_alert" },
      ],
      { threadId: "t-1", requestId: "r-1" },
      log,
    );
    expect(log.info).toHaveBeenCalledWith("[kai/core] tool call", {
      tool: "record_disagreement",
      threadId: "t-1",
      requestId: "r-1",
    });
    expect(log.warn).toHaveBeenCalledWith("[kai/core] safeguarding_alert", {
      tool: "safeguarding_alert",
      threadId: "t-1",
      requestId: "r-1",
    });
    expect(JSON.stringify([log.info.mock.calls, log.warn.mock.calls])).not.toContain("private words");
  });
});
