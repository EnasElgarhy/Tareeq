import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveContentVersionId } from "@/lib/supabase/content-version";

export const runtime = "nodejs";

/**
 * Mint (or reuse) a public share link for the signed-in user's current-version
 * result. Called on demand from the Results screen's Share button — not at
 * persist time — so a link only ever exists for someone who actually chose
 * to share. Re-sharing returns the same token, so the link stays stable.
 *
 * The public side (`/share/[token]`) reads only whitelisted fields off this
 * row — see app/share/[token]/page.tsx — so nothing written here beyond
 * `client_result`/`respondent_name` is ever exposed to a visitor.
 */

interface ShareBody {
  report: Record<string, unknown>;
  name?: string;
}

function parseBody(json: unknown): ShareBody | null {
  if (!json || typeof json !== "object") return null;
  const b = json as Record<string, unknown>;
  if (!b.report || typeof b.report !== "object") return null;
  return {
    report: b.report as Record<string, unknown>,
    name: typeof b.name === "string" ? b.name : undefined,
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

  const existing = await admin
    .from("assessments")
    .select("id, share_token")
    .eq("user_id", user.id)
    .eq("version_id", versionId)
    .limit(1)
    .maybeSingle();

  const shareToken = existing.data?.share_token || randomUUID();

  const writeError = existing.data?.id
    ? (
        await admin
          .from("assessments")
          .update({
            client_result: body.report,
            share_token: shareToken,
            ...(body.name ? { respondent_name: body.name } : {}),
          })
          .eq("id", existing.data.id)
      ).error
    : // No prior row — e.g. the earlier fire-and-forget persist call from
      // registration failed. Create a minimal one so sharing still works.
      (
        await admin.from("assessments").insert({
          user_id: user.id,
          version_id: versionId,
          completed_at: new Date().toISOString(),
          client_result: body.report,
          respondent_name: body.name ?? null,
          respondent_email: user.email ?? null,
          share_token: shareToken,
        })
      ).error;

  if (writeError) {
    return NextResponse.json({ error: writeError.message }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  return NextResponse.json({
    shareToken,
    url: `${origin}/share/${shareToken}`,
  });
}
