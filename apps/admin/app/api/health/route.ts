import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** App Runner's health check target — must respond 200 with no auth and
 *  no external dependencies (Supabase/database) so a third-party outage
 *  never gets misread as this service being down. */
export function GET() {
  return NextResponse.json({ status: "ok" });
}
