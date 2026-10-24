import { describe, expect, it } from "vitest";
import {
  attributionFromCookieHeader,
  attributionFromRequest,
  attributionMetadata,
  parseAttributionCookie,
  serializeAttribution,
  type AttributionState,
} from "./attribution";

const NOW = "2026-10-22T10:00:00.000Z";

function request(url: string, referer: string | null = null) {
  return { url: new URL(url), referer, now: NOW };
}

describe("attributionFromRequest", () => {
  it("records the source and post labels from a tagged link as first and latest touch", () => {
    const next = attributionFromRequest(
      null,
      request("https://mapmycore.com/?source=Instagram&post=parent-toolkit-1"),
    );

    expect(next?.first).toEqual({
      source: "instagram",
      post: "parent-toolkit-1",
      medium: null,
      campaign: null,
      landing: "/",
      at: NOW,
    });
    expect(next?.last).toEqual(next?.first);
  });

  it("falls back to the standard utm tags that ad platforms add", () => {
    const next = attributionFromRequest(
      null,
      request(
        "https://mapmycore.com/ar?utm_source=tiktok&utm_medium=paid&utm_campaign=launch&utm_content=video-2",
      ),
    );

    expect(next?.first).toMatchObject({
      source: "tiktok",
      post: "video-2",
      medium: "paid",
      campaign: "launch",
      landing: "/ar",
    });
  });

  it("keeps the first touch and only moves the latest touch on a later tagged visit", () => {
    const first = attributionFromRequest(null, request("https://mapmycore.com/?source=instagram&post=a"));
    const later = attributionFromRequest(
      first,
      { ...request("https://mapmycore.com/?source=whatsapp&post=b"), now: "2026-10-23T09:00:00.000Z" },
    );

    expect(later?.first.source).toBe("instagram");
    expect(later?.last.source).toBe("whatsapp");
    expect(later?.last.post).toBe("b");
  });

  it("credits an untagged visit to the referring site", () => {
    const next = attributionFromRequest(
      null,
      request("https://mapmycore.com/", "https://l.instagram.com/?u=x"),
    );

    expect(next?.first).toMatchObject({ source: "l.instagram.com", medium: "referral", post: null });
  });

  it("records a first visit with no tag and no outside referrer as direct", () => {
    const next = attributionFromRequest(null, request("https://mapmycore.com/compass", "https://mapmycore.com/"));

    expect(next?.first).toMatchObject({ source: "direct", medium: null, landing: "/compass" });
  });

  it("returns null when nothing new is learned on a returning visit", () => {
    const first = attributionFromRequest(null, request("https://mapmycore.com/?source=instagram"));

    expect(attributionFromRequest(first, request("https://mapmycore.com/compass"))).toBeNull();
  });

  it("drops label values that are not short plain slugs", () => {
    const next = attributionFromRequest(
      null,
      request(`https://mapmycore.com/?source=<script>&post=${"x".repeat(80)}`),
    );

    expect(next?.first).toMatchObject({ source: "direct", post: null });
  });
});

describe("cookie round trip", () => {
  it("serializes and parses the same state", () => {
    const state = attributionFromRequest(
      null,
      request("https://mapmycore.com/?source=instagram&post=a"),
    ) as AttributionState;

    expect(parseAttributionCookie(serializeAttribution(state))).toEqual(state);
    expect(parseAttributionCookie(encodeURIComponent(serializeAttribution(state)))).toEqual(state);
  });

  it("treats a missing or tampered cookie as no attribution", () => {
    expect(parseAttributionCookie(undefined)).toBeNull();
    expect(parseAttributionCookie("not-json")).toBeNull();
    expect(parseAttributionCookie(encodeURIComponent(JSON.stringify({ first: { source: "<b>" } })))).toBeNull();
  });
});

describe("attributionMetadata", () => {
  it("flattens first and latest touch into short event metadata keys", () => {
    const first = attributionFromRequest(null, request("https://mapmycore.com/?source=instagram&post=a"));
    const state = attributionFromRequest(first, request("https://mapmycore.com/?source=whatsapp"));

    expect(attributionMetadata(state)).toEqual({
      src: "instagram",
      post: "a",
      src_last: "whatsapp",
      post_last: null,
    });
  });

  it("returns an empty object when there is no attribution", () => {
    expect(attributionMetadata(null)).toEqual({});
  });
});

describe("attributionFromCookieHeader", () => {
  it("finds the attribution cookie among others", () => {
    const state = attributionFromRequest(null, request("https://mapmycore.com/?source=tiktok&post=v1"));
    const header = `sb-token=abc; mmc_attr=${encodeURIComponent(serializeAttribution(state as AttributionState))}; theme=dark`;

    expect(attributionFromCookieHeader(header)).toMatchObject({ src: "tiktok", post: "v1" });
  });

  it("returns no labels when the cookie is absent", () => {
    expect(attributionFromCookieHeader("sb-token=abc")).toEqual({});
    expect(attributionFromCookieHeader(null)).toEqual({});
  });
});
