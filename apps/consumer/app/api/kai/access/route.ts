import { NextResponse } from "next/server";
import { hasPaidReportAccess, paidAccessError } from "@/app/api/payments/_lib/entitlements";
import { isKaiAccessOpen, kaiAccessEndsAt } from "@/lib/kai/kai-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export interface KaiAccessResponse {
  open: boolean;
  /** ISO instant Kai stops answering (3 months from taking CORE). */
  endsAt: string | null;
}

/** When the caller's Kai window ends, so the Kai screen can show the date. */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const access = await hasPaidReportAccess(createSupabaseAdminClient(), user.id);
  const denied = paidAccessError(access);
  if (denied) return denied;
  if (!access.paid) return NextResponse.json({ error: "upgrade_required" }, { status: 402 });

  const body: KaiAccessResponse = {
    open: isKaiAccessOpen(access.completedAt),
    endsAt: kaiAccessEndsAt(access.completedAt),
  };
  return NextResponse.json(body);
}
