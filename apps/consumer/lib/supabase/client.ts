import { createBrowserClient } from "@supabase/ssr";

/** Browser Supabase client — use in client components (auth UI, profile). */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
