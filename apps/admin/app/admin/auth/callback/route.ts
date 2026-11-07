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

/** Relative for the same reason as the invite redirect above. */
function redirectTo(location: string): NextResponse {
  return new NextResponse(null, { status: 303, headers: { Location: location } });
}

/** Where a sign-in may land. Only known pages, so the link can't send anyone off-site. */
const SIGN_IN_DESTINATIONS: Record<string, string> = { password: "/admin/password" };

/**
 * Sign-in from the login page (`?flow=login`): an emailed sign-in link or
 * Google. Any account can finish this step; requireAdmin decides afterwards
 * who actually gets in.
 */
async function finishSignIn(url: URL): Promise<NextResponse> {
  const code = url.searchParams.get("code");
  if (url.searchParams.has("error") || !code) return redirectTo("/admin/login?error=signin");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return redirectTo("/admin/login?error=signin");
  return redirectTo(SIGN_IN_DESTINATIONS[url.searchParams.get("next") ?? ""] ?? "/admin/content");
}

/**
 * Auth callback for Supabase invite links. PKCE links are exchanged here;
 * implicit invite links carry their session in the browser-only URL fragment,
 * which survives the relative redirect and is consumed by the acceptance page.
 * This route is exempt from the middleware auth bounce so either flow can
 * establish a session before admin authorization runs.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("flow") === "login") return finishSignIn(url);

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
