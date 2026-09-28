import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const versionId = new URL(request.url).searchParams.get("versionId");
  if (!versionId) {
    return NextResponse.json(
      { error: "Assessment version is required." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("assessments")
    .select("id")
    .eq("user_id", user.id)
    .eq("version_id", versionId)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "Assessment not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ assessmentId: data.id });
}
