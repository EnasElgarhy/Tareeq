import { NextResponse } from "next/server";
import {
  hasPaidReportAccess,
  paidAccessError,
} from "@/app/api/payments/_lib/entitlements";
import { listKaiThreads } from "@/lib/kai/chat-repository";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  // Kai is part of the paid report: conversations are gated here, not just in
  // the browser, so the API cannot be used as a free route into the product.
  const access = await hasPaidReportAccess(createSupabaseAdminClient(), user.id);
  const denied = paidAccessError(access);
  if (denied) return denied;

  try {
    return NextResponse.json(await listKaiThreads(supabase));
  } catch (error) {
    console.error("[kai/threads] Failed to load threads", error);
    return NextResponse.json(
      { error: "Could not load conversations." },
      { status: 500 },
    );
  }
}
