import { describe, expect, it } from "vitest";
import {
  ADMIN_EVENT_NAMES,
  AI_EVENT_NAMES,
  analyticsEventSchema,
  ASSESSMENT_EVENT_NAMES,
  EVENT_NAMES,
  isEventName,
  partitionValidEvents,
  RESULTS_EVENT_NAMES,
  SESSION_EVENT_NAMES,
} from "./events";

function validEvent(overrides: Record<string, unknown> = {}) {
  return {
    event_id: "9c858901-8a57-4791-81fe-4c455b099bc9",
    timestamp: "2026-07-01T12:00:00.000Z",
    event_name: "assessment_started",
    session_id: "session-1",
    user_id_hash: null,
    assessment_id: null,
    assessment_version: null,
    locale: "en",
    device: { type: "desktop" },
    country: null,
    metadata: {},
    ...overrides,
  };
}

describe("EVENT_NAMES taxonomy", () => {
  it("has no duplicate event names across domains", () => {
    expect(new Set(EVENT_NAMES).size).toBe(EVENT_NAMES.length);
  });

  it("includes every domain's events", () => {
    for (const name of [
      ...ASSESSMENT_EVENT_NAMES,
      ...RESULTS_EVENT_NAMES,
      ...AI_EVENT_NAMES,
      ...ADMIN_EVENT_NAMES,
      ...SESSION_EVENT_NAMES,
    ]) {
      expect(EVENT_NAMES).toContain(name);
    }
  });
});

describe("isEventName", () => {
  it("accepts a known event name", () => {
    expect(isEventName("assessment_completed")).toBe(true);
  });

  it("rejects an unknown string", () => {
    expect(isEventName("totally_made_up_event")).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isEventName(42)).toBe(false);
    expect(isEventName(null)).toBe(false);
  });
});

describe("analyticsEventSchema", () => {
  it("accepts a well-formed event", () => {
    expect(analyticsEventSchema.safeParse(validEvent()).success).toBe(true);
  });

  it("rejects an unknown event_name", () => {
    const result = analyticsEventSchema.safeParse(validEvent({ event_name: "made_up" }));
    expect(result.success).toBe(false);
  });

  it("rejects a non-uuid event_id", () => {
    const result = analyticsEventSchema.safeParse(validEvent({ event_id: "not-a-uuid" }));
    expect(result.success).toBe(false);
  });

  it("rejects a missing timestamp", () => {
    const { timestamp: _drop, ...rest } = validEvent();
    expect(analyticsEventSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects an invalid device shape", () => {
    const result = analyticsEventSchema.safeParse(
      validEvent({ device: { type: "spaceship" } }),
    );
    expect(result.success).toBe(false);
  });

  it("allows device to be null", () => {
    expect(analyticsEventSchema.safeParse(validEvent({ device: null })).success).toBe(true);
  });

  it("allows arbitrary metadata keys", () => {
    const result = analyticsEventSchema.safeParse(
      validEvent({ metadata: { questionPosition: 12, custom: "anything" } }),
    );
    expect(result.success).toBe(true);
  });

  it("accepts a question-scoped event with a question_id", () => {
    const result = analyticsEventSchema.safeParse(
      validEvent({ event_name: "question_viewed", question_id: "q-uuid-1" }),
    );
    expect(result.success).toBe(true);
  });

  it("accepts question_id as null", () => {
    expect(
      analyticsEventSchema.safeParse(validEvent({ question_id: null })).success,
    ).toBe(true);
  });

  it("accepts an event that omits question_id entirely (pre-Phase-3 producers)", () => {
    expect(analyticsEventSchema.safeParse(validEvent()).success).toBe(true);
  });

  it("includes every new question-analytics event name in the taxonomy", () => {
    for (const name of [
      "question_completed",
      "question_time_spent",
      "question_revisited",
      "question_abandoned",
      "question_auto_advanced",
    ]) {
      expect(EVENT_NAMES).toContain(name);
    }
  });
});

describe("partitionValidEvents", () => {
  it("keeps every event when all are valid", () => {
    const { valid, rejectedCount } = partitionValidEvents([validEvent(), validEvent({ event_id: "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed" })]);
    expect(valid).toHaveLength(2);
    expect(rejectedCount).toBe(0);
  });

  it("drops malformed events without losing the valid ones in the same batch", () => {
    const { valid, rejectedCount } = partitionValidEvents([
      validEvent(),
      { not: "an event" },
      validEvent({ event_name: "made_up_event" }),
    ]);
    expect(valid).toHaveLength(1);
    expect(rejectedCount).toBe(2);
  });

  it("returns an empty result for an all-malformed batch", () => {
    const { valid, rejectedCount } = partitionValidEvents([{}, "nope", 42]);
    expect(valid).toHaveLength(0);
    expect(rejectedCount).toBe(3);
  });
});
