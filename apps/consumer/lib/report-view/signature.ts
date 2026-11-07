import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Short-lived links the admin opens to read a student's report. The admin
 * signs `assessmentId.exp` with a key derived from the Supabase service-role
 * key, which both apps already hold server-side; the raw key is never used
 * or sent. apps/admin/lib/admin/report-view-link.ts must stay identical.
 */
export const REPORT_VIEW_TTL_SECONDS = 15 * 60;
const KEY_PURPOSE = "mapmycore:report-view:v1";
const SIGNATURE_PATTERN = /^[0-9a-f]{64}$/;

export function signReportView(
  assessmentId: string,
  exp: number,
  secret: string,
): string {
  const key = createHmac("sha256", secret).update(KEY_PURPOSE).digest();
  return createHmac("sha256", key)
    .update(`${assessmentId}.${exp}`)
    .digest("hex");
}

interface ReportViewCheck {
  assessmentId: string;
  exp: string | null;
  sig: string | null;
  /** Seconds since the epoch. */
  now: number;
  secret: string;
}

export function verifyReportView({
  assessmentId,
  exp,
  sig,
  now,
  secret,
}: ReportViewCheck): boolean {
  if (
    !secret ||
    !exp ||
    !sig ||
    !SIGNATURE_PATTERN.test(sig) ||
    !/^\d+$/.test(exp)
  )
    return false;
  const expires = Number(exp);
  if (expires < now || expires - now > REPORT_VIEW_TTL_SECONDS) return false;
  const expected = Buffer.from(
    signReportView(assessmentId, expires, secret),
    "hex",
  );
  return timingSafeEqual(expected, Buffer.from(sig, "hex"));
}
