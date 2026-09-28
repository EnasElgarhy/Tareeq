import { createHash } from "node:crypto";

/**
 * sha256 hex of a free-access invite token — the only form ever stored.
 * Must match `hashInviteToken` in the consumer's
 * `app/api/report-access/_lib/redeem.ts`; the two apps deploy independently,
 * so keep the algorithms identical. Lives here (not in `actions.ts`) because
 * `"use server"` modules may only export async functions.
 */
export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
