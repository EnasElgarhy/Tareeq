import { NextResponse } from "next/server";
import { attributionFromCookieHeader } from "@/lib/analytics/attribution";
import {
  findActiveEntitlement,
  isUuid,
  paymentError,
} from "@/app/api/payments/_lib/entitlements";
import {
  PARENT_LINK_COLUMNS,
  PARENT_LINK_DAILY_LIMIT,
  PARENT_LINK_TTL_DAYS,
  PARENT_LINKS_TABLE,
  createParentLinkToken,
  hashParentLinkToken,
  parentLinkState,
  siteOrigin,
  type ParentLinkRow,
} from "@/app/api/payments/_lib/parent-links";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * The student's side of ask-a-parent.
 *
 * POST mints a fresh link for one of the caller's own assessments and revokes
 * any earlier pending link, so only the newest link a student sent can be
 * paid. The full URL is returned once and never stored (only its hash is).
 *
 * GET reports the newest link's state, which the waiting screen polls; the
 * unlock itself is still read from /api/payments/entitlement.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

type Gate =
  | { ok: true; userId: string; admin: ReturnType<typeof createSupabaseAdminClient> }
  | { ok: false; response: NextResponse };

/** Signed in, and the assessment is the caller's own. */
async function authorize(assessmentId: unknown): Promise<Gate> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, response: paymentError("not_authenticated", 401) };
  if (!isUuid(assessmentId)) return { ok: false, response: paymentError("invalid_body", 400) };

  const admin = createSupabaseAdminClient();
  const owner = await admin
    .from("assessments")
    .select("id, user_id")
    .eq("id", assessmentId)
    .maybeSingle();
  if (owner.error) {
    console.error("[payments/parent-link] Assessment lookup failed", owner.error);
    return { ok: false, response: paymentError("assessment_lookup_failed", 500) };
  }
  if (!owner.data || owner.data.user_id !== user.id) {
    return { ok: false, response: paymentError("forbidden", 403) };
  }
  return { ok: true, userId: user.id, admin };
}

function describe(row: ParentLinkRow) {
  return {
    state: parentLinkState(row),
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    openedAt: row.opened_at,
    paidAt: row.paid_at,
  };
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return paymentError("invalid_json", 400);
  }
  const assessmentId =
    json && typeof json === "object"
      ? (json as Record<string, unknown>).assessmentId
      : undefined;

  const gate = await authorize(assessmentId);
  if (!gate.ok) return gate.response;
  const { admin, userId } = gate;
  const id = assessmentId as string;

  const existing = await findActiveEntitlement(admin, userId, id);
  if (!existing.ok) {
    console.error("[payments/parent-link] Entitlement lookup failed", existing.message);
    return paymentError("entitlement_lookup_failed", 500);
  }
  if (existing.entitlement) return paymentError("already_owned", 409);

  const recent = await admin
    .from(PARENT_LINKS_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - DAY_MS).toISOString());
  if (recent.error) {
    console.error("[payments/parent-link] Rate check failed", recent.error);
    return paymentError("parent_link_unavailable", 500);
  }
  if ((recent.count ?? 0) >= PARENT_LINK_DAILY_LIMIT) {
    return paymentError("too_many_links", 429);
  }

  const revoked = await admin
    .from(PARENT_LINKS_TABLE)
    .update({ status: "revoked" })
    .eq("user_id", userId)
    .eq("assessment_id", id)
    .eq("status", "pending");
  if (revoked.error) {
    console.error("[payments/parent-link] Revoking older links failed", revoked.error);
    return paymentError("parent_link_unavailable", 500);
  }

  const token = createParentLinkToken();
  const attribution = attributionFromCookieHeader(request.headers.get("cookie"));
  const inserted = await admin
    .from(PARENT_LINKS_TABLE)
    .insert({
      token_hash: hashParentLinkToken(token),
      user_id: userId,
      assessment_id: id,
      expires_at: new Date(Date.now() + PARENT_LINK_TTL_DAYS * DAY_MS).toISOString(),
      attribution: {
        ...(attribution.src ? { src: attribution.src } : {}),
        ...(attribution.post ? { post: attribution.post } : {}),
      },
    })
    .select(PARENT_LINK_COLUMNS)
    .single();
  if (inserted.error || !inserted.data) {
    console.error("[payments/parent-link] Insert failed", inserted.error);
    return paymentError("parent_link_unavailable", 500);
  }

  return NextResponse.json({
    url: `${siteOrigin(request)}/pay/${token}`,
    ...describe(inserted.data as ParentLinkRow),
  });
}

export async function GET(request: Request) {
  const assessmentId = new URL(request.url).searchParams.get("assessmentId");
  const gate = await authorize(assessmentId);
  if (!gate.ok) return gate.response;

  const { data, error } = await gate.admin
    .from(PARENT_LINKS_TABLE)
    .select(PARENT_LINK_COLUMNS)
    .eq("user_id", gate.userId)
    .eq("assessment_id", assessmentId as string)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[payments/parent-link] Status lookup failed", error);
    return paymentError("parent_link_unavailable", 500);
  }

  return NextResponse.json({
    link: data ? describe(data as ParentLinkRow) : null,
  });
}
