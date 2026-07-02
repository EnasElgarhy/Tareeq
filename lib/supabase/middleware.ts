import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const LOGIN_PATH = "/admin/login";

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
  const isLogin = pathname === LOGIN_PATH;

  if (!user && !isLogin) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  if (user && isLogin) {
    return NextResponse.redirect(new URL("/admin/content", request.url));
  }

  return response;
}
