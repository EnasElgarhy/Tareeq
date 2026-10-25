import { describe, expect, it } from "vitest";
import {
  createParentLinkToken,
  hashParentLinkToken,
  isParentLinkTokenShape,
  parentLinkState,
} from "./parent-links";

describe("parent pay links", () => {
  it("mints url-safe tokens the page accepts", () => {
    const token = createParentLinkToken();
    expect(token).toHaveLength(43);
    expect(isParentLinkTokenShape(token)).toBe(true);
    expect(createParentLinkToken()).not.toBe(token);
  });

  it("rejects malformed tokens before they reach the database", () => {
    expect(isParentLinkTokenShape("short")).toBe(false);
    expect(isParentLinkTokenShape("../../etc/passwd-aaaaaaaaaaaa")).toBe(false);
    expect(isParentLinkTokenShape(undefined)).toBe(false);
  });

  it("stores only a stable sha256 of the token", () => {
    const hash = hashParentLinkToken("abc");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashParentLinkToken("abc")).toBe(hash);
  });

  it("derives expiry from expires_at, and keeps paid and revoked as stored", () => {
    const now = new Date("2026-10-25T12:00:00Z");
    expect(parentLinkState({ status: "pending", expires_at: "2026-10-26T00:00:00Z" }, now)).toBe("pending");
    expect(parentLinkState({ status: "pending", expires_at: "2026-10-25T11:59:59Z" }, now)).toBe("expired");
    expect(parentLinkState({ status: "paid", expires_at: "2026-10-01T00:00:00Z" }, now)).toBe("paid");
    expect(parentLinkState({ status: "revoked", expires_at: "2026-10-30T00:00:00Z" }, now)).toBe("revoked");
  });
});
