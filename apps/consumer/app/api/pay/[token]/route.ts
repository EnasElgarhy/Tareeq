import { NextResponse } from "next/server";
import { paymentError } from "@/app/api/payments/_lib/entitlements";
import {
  findParentLinkByToken,
  isParentLinkTokenShape,
  parentLinkState,
} from "@/app/api/payments/_lib/parent-links";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ token: string }>;
}

/**
 * The state of one parent link, polled by the parent page after Embedded
 * Checkout completes, until the signed webhook has marked it paid. Answers
 * the state only: never who the student is.
 */
export async function GET(_request: Request, { params }: RouteContext) {
  const { token } = await params;
  if (!isParentLinkTokenShape(token)) return paymentError("invalid_link", 404);

  const lookup = await findParentLinkByToken(createSupabaseAdminClient(), token);
  if (!lookup.ok) {
    console.error("[pay/status] Link lookup failed", lookup.message);
    return paymentError("status_unavailable", 500);
  }
  if (!lookup.link) return paymentError("invalid_link", 404);

  return NextResponse.json({ state: parentLinkState(lookup.link) });
}
