import { NextResponse } from "next/server";
import { contentVersion } from "@/lib/content/seed";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Persist the authenticated user's completed assessment to the `assessments`
 * table — the server-backed record behind their profile and the admin Responses
 * view. Reads the session from cookies; writes via the service role (so it can
 * resolve the non-active content version and upsert the profile name).
 *
 * One row per (user, version): a retake replaces the prior result.
 */

interface PersistBody {
  answers: Record<string, string>;
  result: unknown;
  locale: string;
  name?: string;
  startedAt?: string;
}

function parseBody(json: unknown): PersistBody | null {
  if (!json || typeof json !== "object") return null;
  const b = json as Record<string, unknown>;
  if (!b.answers || typeof b.answers !== "object") return null;
  const answers: Record<string, string> = {};
  for (const [k, v] of Object.entries(b.answers as Record<string, unknown>)) {
    if (typeof v === "string") answers[k] = v;
  }
  return {
    answers,
    result: b.result ?? null,
    locale: typeof b.locale === "string" ? b.locale : "en",
    name: typeof b.name === "string" ? b.name : undefined,
    startedAt: typeof b.startedAt === "string" ? b.startedAt : undefined,
  };
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const body = parseBody(json);
  if (!body) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Resolve the DB content version the seed maps to (e.g. "v4"); fall back to
  // the active version. The consumer renders from the seed, so this is the link.
  let versionId: string | null = null;
  const byLabel = await admin
    .from("content_versions")
    .select("id")
    .eq("label", contentVersion.label)
    .order("created_at", { ascending: true })
    .limit(1);
  versionId = byLabel.data?.[0]?.id ?? null;
  if (!versionId) {
    const active = await admin
      .from("content_versions")
      .select("id")
      .eq("is_active", true)
      .limit(1);
    versionId = active.data?.[0]?.id ?? null;
  }
  if (!versionId) {
    return NextResponse.json(
      { error: "No content version available." },
      { status: 500 },
    );
  }

  if (body.name) {
    await admin
      .from("profiles")
      .upsert({ id: user.id, display_name: body.name }, { onConflict: "id" });
  }

  // Keep one current result per (user, version): clear prior, then insert.
  await admin
    .from("assessments")
    .delete()
    .eq("user_id", user.id)
    .eq("version_id", versionId);

  const { error } = await admin.from("assessments").insert({
    user_id: user.id,
    version_id: versionId,
    locale: body.locale,
    started_at: body.startedAt ?? new Date().toISOString(),
    completed_at: new Date().toISOString(),
    answers: body.answers,
    result: body.result ?? null,
    respondent_name: body.name ?? null,
    respondent_email: user.email ?? null,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
