import { describe, expect, it } from "vitest";
import { createClipCache } from "./clip-cache";

const clip = (n: number) => new Uint8Array([n]).buffer;

describe("createClipCache", () => {
  it("returns what was stored under the same key", () => {
    const cache = createClipCache(3);
    cache.set("kai_intro:en", clip(1));
    expect(new Uint8Array(cache.get("kai_intro:en")!)[0]).toBe(1);
    expect(cache.get("kai_intro:ar")).toBeUndefined();
  });

  it("drops the least recently used clip when full", () => {
    const cache = createClipCache(2);
    cache.set("a", clip(1));
    cache.set("b", clip(2));
    cache.get("a");
    cache.set("c", clip(3));
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBeDefined();
    expect(cache.get("c")).toBeDefined();
  });
});
