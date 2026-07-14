import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AdminIdentity {
  id: string;
  email: string | null;
  role: string;
}

/**
 * Enforce that the current request is an authenticated **admin**. Returns the
 * admin identity, or redirects to the login. Call at the top of every admin
 * layout / page / server action — middleware only checks authentication, this
 * is the role gate (defense in depth).
 */
export async function requireAdmin(): Promise<AdminIdentity> {
  // Without Supabase creds there's nothing to authenticate against — send to
  // the login, which renders a clear setup notice.
  if (!isSupabaseConfigured()) redirect("/admin/login");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  // Role lives in `profiles.role` ('user' | 'admin'). Use the service-role
  // client so the lookup isn't blocked by RLS.
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/admin/login?error=not_admin");
  }

  return { id: user.id, email: user.email ?? null, role: profile.role };
}
