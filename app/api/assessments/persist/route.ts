import { NextResponse } from "next/server";
import { trackEvent } from "@/lib/analytics/track";
import { contentVersion } from "@/lib/content/seed";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveContentVersionId } from "@/lib/supabase/content-version";

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
  const versionId = await resolveContentVersionId(admin);
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

  const { data: inserted, error } = await admin
    .from("assessments")
    .insert({
      user_id: user.id,
      version_id: versionId,
      locale: body.locale,
      started_at: body.startedAt ?? new Date().toISOString(),
      completed_at: new Date().toISOString(),
      answers: body.answers,
      result: body.result ?? null,
      respondent_name: body.name ?? null,
      respondent_email: user.email ?? null,
    })
    .select("id")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  trackEvent("assessment_completed", {
    assessmentId: inserted?.id as string | undefined,
    assessmentVersion: contentVersion.label,
    userId: user.id,
    locale: body.locale,
    questionCount: Object.keys(body.answers).length,
  });

  return NextResponse.json({ ok: true });
}
