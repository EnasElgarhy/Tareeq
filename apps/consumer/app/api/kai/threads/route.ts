import { NextResponse } from "next/server";
import { listKaiThreads } from "@/lib/kai/chat-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

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
