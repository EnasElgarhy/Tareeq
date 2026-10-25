import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ask-a-parent payment links (`/pay/<token>`). Shared by the student route
 * that mints them, the parent page that opens them and the webhook that
 * marks them paid. Schema: supabase/migrations/202610250001_parent_pay_links.sql.
 */

export const PARENT_LINKS_TABLE = "parent_pay_links";

/** How long a link stays payable. Shown to the student and on the page. */
export const PARENT_LINK_TTL_DAYS = 7;

/** A student can mint at most this many links a day; each new one revokes the last. */
export const PARENT_LINK_DAILY_LIMIT = 20;

/**
 * Which guardian wording the parent agreed to. Bump it whenever the consent
 * line on the parent page changes, so every stored consent names its text.
 */
export const PARENT_CONSENT_WORDING_VERSION = "2026-10-25-draft";

/** 32 raw bytes as base64url (43 chars), the same shape as admin invites. */
export function createParentLinkToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Only this hash is stored; the token itself lives in the link alone. */
export function hashParentLinkToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Rejects anything that cannot be a token before it reaches the database. */
export function isParentLinkTokenShape(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{16,128}$/.test(token);
}

/** The public origin links are built on; never the internal App Runner host. */
export function siteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return new URL(request.url).origin;
}

export interface ParentLinkRow {
  id: string;
  user_id: string;
  assessment_id: string;
  created_at: string;
  expires_at: string;
  opened_at: string | null;
  paid_at: string | null;
  status: "pending" | "paid" | "revoked";
  attribution: { src?: string; post?: string | null } | null;
}

export const PARENT_LINK_COLUMNS =
  "id, user_id, assessment_id, created_at, expires_at, opened_at, paid_at, status, attribution";

/**
 * What a link means right now. `expired` is derived from `expires_at` rather
 * than stored, so no job has to sweep old links.
 */
export type ParentLinkState = "pending" | "paid" | "revoked" | "expired";

export function parentLinkState(
  row: Pick<ParentLinkRow, "status" | "expires_at">,
  now: Date = new Date(),
): ParentLinkState {
  if (row.status !== "pending") return row.status;
  return new Date(row.expires_at).getTime() <= now.getTime()
    ? "expired"
    : "pending";
}

export type ParentLinkLookup =
  | { ok: true; link: ParentLinkRow | null }
  | { ok: false; message: string };

/** Finds a link by the token a parent presented. */
export async function findParentLinkByToken(
  admin: SupabaseClient,
  token: string,
): Promise<ParentLinkLookup> {
  const { data, error } = await admin
    .from(PARENT_LINKS_TABLE)
    .select(PARENT_LINK_COLUMNS)
    .eq("token_hash", hashParentLinkToken(token))
    .maybeSingle();
  if (error) return { ok: false, message: error.message };
  return { ok: true, link: (data as ParentLinkRow | null) ?? null };
}
