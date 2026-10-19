import { NextResponse } from "next/server";
import { trackEvent } from "@/lib/analytics/track";
import { loadAssessmentContentForReference } from "@/lib/assessment/content.server";
import { CORE_CONTENT_VERSIONS } from "@/lib/core-v2/content/core-content";
import {
  CORE_QUESTION_SET_LABEL,
  coreAnswersFromLetters,
} from "@/lib/core-v2/assessment";
import { scoreCore } from "@/lib/core-v2/scoring";
import { computeScore } from "@/lib/scoring";
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
  versionId: string | null;
  versionLabel?: string;
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
    versionId: typeof b.versionId === "string" ? b.versionId : null,
    versionLabel:
      typeof b.versionLabel === "string" ? b.versionLabel : undefined,
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
  if (body.versionLabel === CORE_QUESTION_SET_LABEL) {
    return persistCoreAttempt(admin, user, body);
  }
  const content = await loadAssessmentContentForReference({
    versionId: body.versionId,
    versionLabel: body.versionLabel,
  });
  const versionId = content?.versionId;
  if (!content || !versionId) {
    return NextResponse.json(
      { error: "Assessment version unavailable." },
      { status: 409 },
    );
  }
  const result = computeScore(body.answers, content.questions);

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
      result,
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
    assessmentVersion: content.versionLabel,
    userId: user.id,
    locale: body.locale,
    questionCount: Object.keys(body.answers).length,
  });

  return NextResponse.json({ ok: true, assessmentId: inserted.id });
}

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

/**
 * CORE 2.0 (question set 5.2). The result is scored here from the answers,
 * never taken from the browser, and stored with the content versions it was
 * built from (change instructions of 17 Oct 2026, step 8). `assessments.version_id` must reference a
 * content_versions row, so question set 5.1 needs one with this label.
 */
async function persistCoreAttempt(
  admin: AdminClient,
  user: { id: string; email?: string | null },
  body: PersistBody,
) {
  let result;
  try {
    result = {
      ...scoreCore(coreAnswersFromLetters(body.answers)),
      contentVersions: CORE_CONTENT_VERSIONS,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid answers.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const version = await admin
    .from("content_versions")
    .select("id")
    .eq("label", CORE_QUESTION_SET_LABEL)
    .maybeSingle();
  const versionId = version.data?.id as string | undefined;
  if (version.error || !versionId) {
    console.error("[assessments/persist] CORE version row missing", {
      label: CORE_QUESTION_SET_LABEL,
      error: version.error?.message,
    });
    return NextResponse.json(
      { error: "Assessment version unavailable." },
      { status: 409 },
    );
  }

  if (body.name) {
    await admin
      .from("profiles")
      .upsert({ id: user.id, display_name: body.name }, { onConflict: "id" });
  }

  // One current result per (user, version), as for legacy attempts.
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
      result,
      respondent_name: body.name ?? null,
      respondent_email: user.email ?? null,
    })
    .select("id")
    .single();
  if (error || !inserted) {
    console.error("[assessments/persist] CORE insert failed", error?.message);
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }

  trackEvent("assessment_completed", {
    assessmentId: inserted.id as string,
    assessmentVersion: CORE_QUESTION_SET_LABEL,
    userId: user.id,
    locale: body.locale,
    questionCount: Object.keys(body.answers).length,
  });

  return NextResponse.json({ ok: true, assessmentId: inserted.id });
}
