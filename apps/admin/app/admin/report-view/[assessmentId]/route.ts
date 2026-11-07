import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/require-admin";
import { consumerOriginFor, reportViewUrl } from "@/lib/admin/report-view-link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ASSESSMENT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function unavailable(message: string, status: number): NextResponse {
  return new NextResponse(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * "View report": signs a fresh 10-minute link to the student's report on the
 * student site and sends the admin there. Anyone who can read responses may
 * open it; the link itself carries no session.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assessmentId: string }> },
) {
  await requirePermission("responses.view");
  const { assessmentId } = await params;
  if (!ASSESSMENT_ID.test(assessmentId))
    return unavailable("Unknown assessment.", 404);

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const origin = consumerOriginFor(host, process.env.CONSUMER_SITE_URL);
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!origin || !secret) {
    console.error("[admin/report-view] no student site for this admin host", {
      host,
    });
    return unavailable("Report view isn't set up for this admin address.", 503);
  }

  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: reportViewUrl(
        assessmentId,
        origin,
        Math.floor(Date.now() / 1000),
        secret,
      ),
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
