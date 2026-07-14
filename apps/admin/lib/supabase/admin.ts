import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — **bypasses Row-Level Security**.
 *
 * SERVER ONLY. Never import this into a client component or expose the key.
 * Use for privileged admin reads/writes (role lookups, content CRUD,
 * analytics aggregates) where we've already authorized the caller as an admin.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
