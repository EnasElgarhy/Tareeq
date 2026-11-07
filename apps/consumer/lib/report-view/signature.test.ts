// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import {
  REPORT_VIEW_TTL_SECONDS,
  signReportView,
  verifyReportView,
} from "./signature";

const SECRET = "service-role-key-for-tests";
const ID = "0b6f9a3e-1c2d-4e5f-8a9b-0c1d2e3f4a5b";
const NOW = 1_794_000_000;

describe("report view links", () => {
  it("matches the admin's signature for the same input", () => {
    // Same vector as apps/admin/lib/admin/report-view-link.test.ts.
    expect(signReportView(ID, NOW + 600, SECRET)).toBe(
      "8d8c936d421250ecba4ba2e636a5f5128ac7b47de326e8f91f01dc2961b7dd7c",
    );
  });

  it("accepts a fresh link signed with the shared key", () => {
    const exp = NOW + 600;
    const sig = signReportView(ID, exp, SECRET);
    expect(
      verifyReportView({
        assessmentId: ID,
        exp: String(exp),
        sig,
        now: NOW,
        secret: SECRET,
      }),
    ).toBe(true);
  });

  it("rejects an expired link", () => {
    const exp = NOW - 1;
    const sig = signReportView(ID, exp, SECRET);
    expect(
      verifyReportView({
        assessmentId: ID,
        exp: String(exp),
        sig,
        now: NOW,
        secret: SECRET,
      }),
    ).toBe(false);
  });

  it("rejects a link that claims to last longer than allowed", () => {
    const exp = NOW + REPORT_VIEW_TTL_SECONDS + 60;
    const sig = signReportView(ID, exp, SECRET);
    expect(
      verifyReportView({
        assessmentId: ID,
        exp: String(exp),
        sig,
        now: NOW,
        secret: SECRET,
      }),
    ).toBe(false);
  });

  it("rejects a signature for another assessment, key or expiry", () => {
    const exp = NOW + 600;
    const sig = signReportView(ID, exp, SECRET);
    const base = { exp: String(exp), sig, now: NOW, secret: SECRET };
    expect(verifyReportView({ ...base, assessmentId: "another-id" })).toBe(
      false,
    );
    expect(
      verifyReportView({ ...base, assessmentId: ID, secret: "other-key" }),
    ).toBe(false);
    expect(
      verifyReportView({ ...base, assessmentId: ID, exp: String(exp + 1) }),
    ).toBe(false);
  });

  it("rejects missing or malformed parts", () => {
    const exp = NOW + 600;
    const sig = signReportView(ID, exp, SECRET);
    expect(
      verifyReportView({
        assessmentId: ID,
        exp: null,
        sig,
        now: NOW,
        secret: SECRET,
      }),
    ).toBe(false);
    expect(
      verifyReportView({
        assessmentId: ID,
        exp: "soon",
        sig,
        now: NOW,
        secret: SECRET,
      }),
    ).toBe(false);
    expect(
      verifyReportView({
        assessmentId: ID,
        exp: String(exp),
        sig: null,
        now: NOW,
        secret: SECRET,
      }),
    ).toBe(false);
    expect(
      verifyReportView({
        assessmentId: ID,
        exp: String(exp),
        sig: "abc",
        now: NOW,
        secret: SECRET,
      }),
    ).toBe(false);
    expect(
      verifyReportView({
        assessmentId: ID,
        exp: String(exp),
        sig,
        now: NOW,
        secret: "",
      }),
    ).toBe(false);
  });
});
