import { describe, expect, it } from "vitest";
import { createQueue } from "./queue";
import type { AnalyticsEvent } from "./types";

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

describe("createQueue", () => {
  it("starts empty", () => {
    const queue = createQueue();
    expect(queue.size()).toBe(0);
    expect(queue.peekAll()).toEqual([]);
  });

  it("seeds from an initial array (e.g. reloaded from storage)", () => {
    const queue = createQueue([makeEvent("a")]);
    expect(queue.size()).toBe(1);
  });

  it("enqueues in order", () => {
    const queue = createQueue();
    queue.enqueue(makeEvent("a"));
    queue.enqueue(makeEvent("b"));
    expect(queue.peekAll().map((e) => e.event_id)).toEqual(["a", "b"]);
  });

  it("drain removes and returns events, oldest first", () => {
    const queue = createQueue();
    queue.enqueue(makeEvent("a"));
    queue.enqueue(makeEvent("b"));
    queue.enqueue(makeEvent("c"));
    const drained = queue.drain(2);
    expect(drained.map((e) => e.event_id)).toEqual(["a", "b"]);
    expect(queue.peekAll().map((e) => e.event_id)).toEqual(["c"]);
  });

  it("drain with no limit takes everything", () => {
    const queue = createQueue();
    queue.enqueue(makeEvent("a"));
    queue.enqueue(makeEvent("b"));
    expect(queue.drain()).toHaveLength(2);
    expect(queue.size()).toBe(0);
  });

  it("requeue puts events back at the front", () => {
    const queue = createQueue();
    queue.enqueue(makeEvent("c"));
    queue.requeue([makeEvent("a"), makeEvent("b")]);
    expect(queue.peekAll().map((e) => e.event_id)).toEqual(["a", "b", "c"]);
  });

  it("requeue increments the attempt count for those events", () => {
    const queue = createQueue();
    const event = makeEvent("a");
    expect(queue.attemptsFor("a")).toBe(0);
    queue.requeue([event]);
    expect(queue.attemptsFor("a")).toBe(1);
    queue.requeue([event]);
    expect(queue.attemptsFor("a")).toBe(2);
  });

  it("forget clears the attempt count", () => {
    const queue = createQueue();
    queue.requeue([makeEvent("a")]);
    expect(queue.attemptsFor("a")).toBe(1);
    queue.forget("a");
    expect(queue.attemptsFor("a")).toBe(0);
  });

  it("peekAll does not mutate the underlying queue", () => {
    const queue = createQueue();
    queue.enqueue(makeEvent("a"));
    const snapshot = queue.peekAll();
    snapshot.pop();
    expect(queue.size()).toBe(1);
  });
});
