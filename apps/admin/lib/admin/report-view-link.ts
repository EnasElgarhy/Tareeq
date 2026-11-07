import "server-only";

import { createHmac } from "node:crypto";

/**
 * Signed, short-lived links to a student's report on the student site. Must
 * stay identical to apps/consumer/lib/report-view/signature.ts: the key is
 * derived from the Supabase service-role key both apps already hold.
 */
const KEY_PURPOSE = "mapmycore:report-view:v1";
const LINK_LIFETIME_SECONDS = 10 * 60;

/** Admin host → the student site it belongs to. */
const CONSUMER_ORIGINS: Record<string, string> = {
  "admin-staging.mapmycore.com": "https://staging.mapmycore.com",
  "admin.mapmycore.com": "https://mapmycore.com",
  "localhost:3001": "http://localhost:3000",
};

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

/** `configured` (CONSUMER_SITE_URL) wins; otherwise only known admin hosts map. */
export function consumerOriginFor(
  adminHost: string,
  configured?: string,
): string | null {
  const explicit = configured?.trim().replace(/\/+$/, "");
  if (explicit) return explicit;
  return CONSUMER_ORIGINS[adminHost.toLowerCase()] ?? null;
}

export function reportViewUrl(
  assessmentId: string,
  consumerOrigin: string,
  nowSeconds: number,
  secret: string,
): string {
  const exp = nowSeconds + LINK_LIFETIME_SECONDS;
  const query = new URLSearchParams({
    exp: String(exp),
    sig: signReportView(assessmentId, exp, secret),
  });
  return `${consumerOrigin}/report-view/${encodeURIComponent(assessmentId)}?${query.toString()}`;
}
