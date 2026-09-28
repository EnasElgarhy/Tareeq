import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const LOGIN_PATH = "/admin/login";
// Paths reachable WITHOUT an admin session — the login, plus the invite
// acceptance flow (the callback exchanges the code before a session cookie
// exists, and accept-invite runs as a freshly-authenticated but not-yet-admin
// user). The admin-role gate still applies everywhere else via requireAdmin().
const PUBLIC_PATHS = new Set([LOGIN_PATH, "/admin/auth/callback", "/admin/accept-invite"]);

/**
 * Refresh the Supabase session on each admin request and gate the /admin
 * surface. Unauthenticated users hitting /admin/* are bounced to the login;
 * authenticated users on the login page are sent to the dashboard. The
 * admin-ROLE check happens in the (shell) layout via requireAdmin().
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Not configured yet → let the request through so the admin pages can show
  // a "configure Supabase" notice instead of a 500.
  if (!isSupabaseConfigured()) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.has(pathname);

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  // Authenticated user on the login page → dashboard. (Not for the invite
  // flow: an authenticated invitee still needs the accept page.)
  if (user && pathname === LOGIN_PATH) {
    return NextResponse.redirect(new URL("/admin/content", request.url));
  }

  return response;
}
