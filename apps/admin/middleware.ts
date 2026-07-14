import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Only runs on the admin surface — the public assessment/home flow is
 * untouched (it's session-less / localStorage-driven), so we keep the
 * middleware off the hot path for real users.
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
