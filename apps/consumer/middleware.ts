import { type NextRequest, type NextResponse } from "next/server";
import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_MAX_AGE_SECONDS,
  attributionFromRequest,
  parseAttributionCookie,
  serializeAttribution,
} from "@/lib/analytics/attribution";
import { updateSession } from "@/lib/supabase/middleware";

/** A page the visitor opened (a link, a typed URL), not a fetch, prefetch or API call. */
function isPageLoad(request: NextRequest): boolean {
  if (request.method !== "GET" || request.nextUrl.pathname.startsWith("/api/")) return false;
  const dest = request.headers.get("sec-fetch-dest");
  if (dest) return dest === "document";
  return request.headers.get("accept")?.includes("text/html") ?? false;
}

/** Remembers which post, ad or forward brought this visitor (lib/analytics/attribution.ts). */
function recordAttribution(request: NextRequest, response: NextResponse): void {
  if (!isPageLoad(request)) return;
  const next = attributionFromRequest(
    parseAttributionCookie(request.cookies.get(ATTRIBUTION_COOKIE)?.value),
    {
      url: request.nextUrl,
      referer: request.headers.get("referer"),
      now: new Date().toISOString(),
    },
  );
  if (!next) return;
  response.cookies.set(ATTRIBUTION_COOKIE, serializeAttribution(next), {
    path: "/",
    maxAge: ATTRIBUTION_MAX_AGE_SECONDS,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });
}

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  recordAttribution(request, response);
  return response;
}

export const config = {
  // Run on app routes; skip Next internals and static assets (incl. media/fonts).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|mp4|m4a|mp3|wav|woff|woff2|ttf)$).*)",
  ],
};
