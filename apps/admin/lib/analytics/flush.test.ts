import { describe, expect, it, vi } from "vitest";
import { flushQueue } from "./flush";
import { createQueue } from "./queue";
import type { AnalyticsEvent, AnalyticsProvider, FlushResult } from "./types";

function makeEvent(id: string): AnalyticsEvent {
  return {
    event_id: id,
    timestamp: "2026-07-01T00:00:00.000Z",
    event_name: "page_view",
    session_id: "session-1",
    user_id_hash: null,
    assessment_id: null,
    assessment_version: null,
    question_id: null,
    locale: null,
    device: null,
    country: null,
    metadata: {},
  };
}

function fakeProvider(send: (events: AnalyticsEvent[]) => Promise<FlushResult>): AnalyticsProvider {
  return { name: "fake", send };
}

describe("flushQueue", () => {
  it("does nothing when the queue is empty", async () => {
    const queue = createQueue();
    const send = vi.fn();
    await flushQueue(queue, fakeProvider(send));
    expect(send).not.toHaveBeenCalled();
  });

  it("drains the whole queue into one batch sent to the provider", async () => {
    const queue = createQueue([makeEvent("a"), makeEvent("b")]);
    let sentBatch: AnalyticsEvent[] = [];
    const provider = fakeProvider(async (events) => {
      sentBatch = events;
      return { ok: true, retryable: [] };
    });
    await flushQueue(queue, provider);
    expect(sentBatch.map((e) => e.event_id)).toEqual(["a", "b"]);
    expect(queue.size()).toBe(0);
  });

  it("calls onAfterFlush exactly once on success", async () => {
    const queue = createQueue([makeEvent("a")]);
    const onAfterFlush = vi.fn();
    await flushQueue(queue, fakeProvider(async () => ({ ok: true, retryable: [] })), {
      onAfterFlush,
    });
    expect(onAfterFlush).toHaveBeenCalledTimes(1);
  });

  it("requeues retryable events on a transient failure", async () => {
    const queue = createQueue([makeEvent("a")]);
    const provider = fakeProvider(async (events) => ({
      ok: false,
      retryable: events,
      error: "server error",
    }));
    await flushQueue(queue, provider);
    expect(queue.size()).toBe(1);
    expect(queue.attemptsFor("a")).toBe(1);
  });

  it("drops events the provider says aren't retryable (malformed/rejected)", async () => {
    const queue = createQueue([makeEvent("a")]);
    const onDrop = vi.fn();
    const provider = fakeProvider(async () => ({ ok: false, retryable: [] }));
    await flushQueue(queue, provider, { onDrop });
    expect(queue.size()).toBe(0);
    expect(onDrop).toHaveBeenCalledWith([expect.objectContaining({ event_id: "a" })]);
  });

  it("drops an event once it exceeds maxAttempts instead of retrying forever", async () => {
    const queue = createQueue([makeEvent("a")]);
    const onDrop = vi.fn();
    const provider = fakeProvider(async (events) => ({ ok: false, retryable: events }));
    // Three real flush attempts in a row — each drains, fails, and requeues
    // for real, rather than hand-faking a prior attempt count.
    await flushQueue(queue, provider, { maxAttempts: 3, onDrop });
    await flushQueue(queue, provider, { maxAttempts: 3, onDrop });
    await flushQueue(queue, provider, { maxAttempts: 3, onDrop });
    expect(queue.size()).toBe(0);
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledWith([expect.objectContaining({ event_id: "a" })]);
  });

  it("keeps retrying below maxAttempts", async () => {
    const queue = createQueue([makeEvent("a")]);
    const onDrop = vi.fn();
    const provider = fakeProvider(async (events) => ({ ok: false, retryable: events }));
    await flushQueue(queue, provider, { maxAttempts: 5, onDrop });
    expect(queue.size()).toBe(1);
    expect(onDrop).not.toHaveBeenCalled();
  });

  it("handles a mixed batch — some retryable, some rejected outright", async () => {
    const queue = createQueue([makeEvent("a"), makeEvent("b")]);
    const onDrop = vi.fn();
    const provider = fakeProvider(async (events) => ({
      ok: false,
      retryable: events.filter((e) => e.event_id === "a"),
    }));
    await flushQueue(queue, provider, { onDrop });
    // "a" requeued (retryable), "b" dropped (rejected outright).
    expect(queue.peekAll().map((e) => e.event_id)).toEqual(["a"]);
    expect(onDrop).toHaveBeenCalledWith([expect.objectContaining({ event_id: "b" })]);
  });
});
