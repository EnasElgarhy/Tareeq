import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function redirectToAcceptInvite(hasError = false): NextResponse {
  const location = hasError
    ? "/admin/accept-invite?error=invalid_or_expired"
    : "/admin/accept-invite";

  // Keep this relative. Behind Caddy, request.url contains the container origin
  // (0.0.0.0:3000), which is not reachable from the invitee's browser.
  return new NextResponse(null, {
    status: 303,
    headers: { Location: location },
  });
}

/**
 * Auth callback for the Supabase invite link (PKCE). Exchanges the `?code=`
 * for a session (writing the session cookies from this route handler, where
 * cookies are writable), then forwards to the accept-invite page — which now
 * sees an authenticated user. Exempted from the middleware auth-bounce so the
 * exchange can happen before a session cookie exists.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.has("error")) {
    return redirectToAcceptInvite(true);
  }

  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return redirectToAcceptInvite(true);
  }

  return redirectToAcceptInvite();
}
