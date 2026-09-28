import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Thin caller over `redeem_report_access_invite` (see migration
 * `202609230001_redeem_report_access_function.sql`).
 *
 * Atomicity, idempotency, and race-safety live in that single database
 * function call — PostgREST cannot span a transaction, so the app layer must
 * not reimplement the read-validate-write sequence. This module only hashes
 * the token, invokes the function with the service-role client, and maps its
 * result codes to HTTP statuses. Used by both the redeem API route
 * (client-driven) and the `/invite/[token]` page (server-driven) so the two
 * can never drift apart.
 */

export type RedeemResult =
  | { ok: true; assessmentId: string; alreadyOwned: boolean }
  | { ok: false; code: string; status: number; assessmentId?: string | null };

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Function result codes and the HTTP status each one means. */
const CODE_STATUS: Record<string, number> = {
  invalid_token: 400,
  invite_expired: 410,
  already_redeemed: 409,
  assessment_incomplete: 422,
  payment_required: 402,
};

interface FunctionOutput {
  ok?: unknown;
  code?: unknown;
  assessment_id?: unknown;
  already_owned?: unknown;
}

export async function redeemInvite(
  admin: SupabaseClient,
  userId: string,
  token: string,
  userEmail: string | null,
): Promise<RedeemResult> {
  // Reject malformed tokens before they reach the database; the raw token is
  // never logged or stored, only its hash crosses into the function call.
  if (typeof token !== "string" || token.length < 16 || token.length > 256) {
    return { ok: false, code: "invalid_token", status: 400 };
  }

  let data: unknown;
  let error: unknown;
  try {
    ({ data, error } = await admin.rpc("redeem_report_access_invite", {
      p_token_hash: hashInviteToken(token),
      p_user_id: userId,
      // Session email from the server, never client input: email-bound
      // invites match on it, bound invites ignore it.
      p_user_email: userEmail,
    }));
  } catch {
    return { ok: false, code: "redeem_unavailable", status: 500 };
  }
  if (error) return { ok: false, code: "redeem_unavailable", status: 500 };

  const out = (data ?? {}) as FunctionOutput;
  if (out.ok === true && typeof out.assessment_id === "string") {
    return {
      ok: true,
      assessmentId: out.assessment_id,
      alreadyOwned: out.already_owned === true,
    };
  }

  // An unknown code is a contract break, not a client error: answer 500
  // rather than inventing a meaning for it.
  const code = typeof out.code === "string" ? out.code : null;
  const status = code ? CODE_STATUS[code] : undefined;
  if (!code || status === undefined) {
    return { ok: false, code: "redeem_unavailable", status: 500 };
  }
  // Paid invites route into the normal purchase flow; the resolved assessment
  // (if any) tells the page where to send the recipient.
  if (code === "payment_required") {
    return {
      ok: false,
      code,
      status,
      assessmentId:
        typeof out.assessment_id === "string" ? out.assessment_id : null,
    };
  }
  return { ok: false, code, status };
}
