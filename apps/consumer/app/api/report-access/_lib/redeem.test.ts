import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import {
  hashInviteToken,
  redeemInvite,
} from "@/app/api/report-access/_lib/redeem";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const ASMT_ID = "33333333-3333-4333-8333-333333333333";
const TOKEN = "free-access-test-token-0123456789";
const EMAIL = "sara@example.com";

function fakeAdmin(rpc: unknown) {
  return { rpc } as unknown as SupabaseClient;
}

function rpcResolving(data: unknown, error: unknown = null) {
  return vi.fn(async () => ({ data, error }));
}

describe("hashInviteToken", () => {
  it("is a deterministic sha256 hex that never contains the raw token", () => {
    expect(hashInviteToken(TOKEN)).toBe(
      createHash("sha256").update(TOKEN).digest("hex"),
    );
    expect(hashInviteToken(TOKEN)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashInviteToken(TOKEN)).not.toContain(TOKEN);
  });
});

describe("redeemInvite", () => {
  it("rejects malformed tokens without touching the database", async () => {
    const rpc = rpcResolving(null);
    const result = await redeemInvite(fakeAdmin(rpc), USER_ID, "short", EMAIL);

    expect(result).toEqual({ ok: false, code: "invalid_token", status: 400 });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("sends only the token hash, never the raw token", async () => {
    const rpc = rpcResolving({
      ok: true,
      assessment_id: ASMT_ID,
      already_owned: false,
    });

    await redeemInvite(fakeAdmin(rpc), USER_ID, TOKEN, EMAIL);

    expect(rpc).toHaveBeenCalledWith("redeem_report_access_invite", {
      p_token_hash: hashInviteToken(TOKEN),
      p_user_id: USER_ID,
      p_user_email: EMAIL,
    });
    const payload = (rpc.mock.calls[0] as unknown[])[1] as Record<
      string,
      unknown
    >;
    expect(JSON.stringify(payload)).not.toContain(TOKEN);
  });

  it("maps a successful redemption", async () => {
    const rpc = rpcResolving({
      ok: true,
      assessment_id: ASMT_ID,
      already_owned: false,
    });

    const result = await redeemInvite(fakeAdmin(rpc), USER_ID, TOKEN, EMAIL);

    expect(result).toEqual({
      ok: true,
      assessmentId: ASMT_ID,
      alreadyOwned: false,
    });
  });

  it("maps an idempotent repeat redemption", async () => {
    const rpc = rpcResolving({
      ok: true,
      assessment_id: ASMT_ID,
      already_owned: true,
    });

    const result = await redeemInvite(fakeAdmin(rpc), USER_ID, TOKEN, EMAIL);

    expect(result).toEqual({
      ok: true,
      assessmentId: ASMT_ID,
      alreadyOwned: true,
    });
  });

  it.each([
    ["invalid_token", 400],
    ["invite_expired", 410],
    ["already_redeemed", 409],
    ["assessment_incomplete", 422],
    // payment_required carries a routing hint — covered below.
  ])("maps %s to HTTP %i", async (code, status) => {
    const rpc = rpcResolving({ ok: false, code });

    const result = await redeemInvite(fakeAdmin(rpc), USER_ID, TOKEN, EMAIL);

    expect(result).toEqual({ ok: false, code, status });
  });

  it("forwards the paid routing hint with the assessment id", async () => {
    const rpc = rpcResolving({
      ok: false,
      code: "payment_required",
      assessment_id: ASMT_ID,
    });

    const result = await redeemInvite(fakeAdmin(rpc), USER_ID, TOKEN, EMAIL);

    expect(result).toEqual({
      ok: false,
      code: "payment_required",
      status: 402,
      assessmentId: ASMT_ID,
    });
  });

  it("forwards a paid routing hint without a finished assessment", async () => {
    const rpc = rpcResolving({
      ok: false,
      code: "payment_required",
      assessment_id: null,
    });

    const result = await redeemInvite(fakeAdmin(rpc), USER_ID, TOKEN, EMAIL);

    expect(result).toEqual({
      ok: false,
      code: "payment_required",
      status: 402,
      assessmentId: null,
    });
  });

  it("models a concurrent second redeem as already_redeemed", async () => {
    // Two redeems of one token serialize on the database row lock; the
    // loser's function call returns already_redeemed. Unit-test the mapping
    // of that serialized outcome (true simultaneity needs a live database).
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: { ok: true, assessment_id: ASMT_ID, already_owned: false },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { ok: false, code: "already_redeemed" },
        error: null,
      });
    const admin = fakeAdmin(rpc);

    const first = await redeemInvite(admin, USER_ID, TOKEN, EMAIL);
    const second = await redeemInvite(admin, USER_ID, TOKEN, EMAIL);

    expect(first).toEqual({
      ok: true,
      assessmentId: ASMT_ID,
      alreadyOwned: false,
    });
    expect(second).toEqual({
      ok: false,
      code: "already_redeemed",
      status: 409,
    });
  });

  it("answers 500 when the function call throws", async () => {
    const rpc = vi.fn(async () => {
      throw new Error("connection refused");
    });

    const result = await redeemInvite(fakeAdmin(rpc), USER_ID, TOKEN, EMAIL);

    expect(result).toEqual({
      ok: false,
      code: "redeem_unavailable",
      status: 500,
    });
  });

  it("answers 500 when the function call errors", async () => {
    const rpc = rpcResolving(null, { message: "permission denied" });

    const result = await redeemInvite(fakeAdmin(rpc), USER_ID, TOKEN, EMAIL);

    expect(result).toEqual({
      ok: false,
      code: "redeem_unavailable",
      status: 500,
    });
  });

  it("answers 500 on an unknown result code rather than inventing a meaning", async () => {
    const rpc = rpcResolving({ ok: false, code: "something_new" });

    const result = await redeemInvite(fakeAdmin(rpc), USER_ID, TOKEN, EMAIL);

    expect(result).toEqual({
      ok: false,
      code: "redeem_unavailable",
      status: 500,
    });
  });

  it("answers 500 on a malformed function response", async () => {
    const rpc = rpcResolving(null);

    const result = await redeemInvite(fakeAdmin(rpc), USER_ID, TOKEN, EMAIL);

    expect(result).toEqual({
      ok: false,
      code: "redeem_unavailable",
      status: 500,
    });
  });
});
