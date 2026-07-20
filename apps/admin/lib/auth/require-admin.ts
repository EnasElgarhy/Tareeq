import { redirect } from "next/navigation";
import {
  type AdminPermission,
  type AdminRole,
  hasPermission,
  isAdminRole,
  permissionsForRole,
} from "@/lib/admin/team/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AdminIdentity {
  id: string;
  email: string | null;
  role: AdminRole;
  permissions: readonly AdminPermission[];
}

/**
 * Resolve the current user's admin role, or null if they're not an admin.
 *
 * Source of truth is `admin_members` (role + status). Backward-compatible:
 * - If `admin_members` doesn't exist yet (migration 202607150002 not applied)
 *   or the user has no member row, fall back to the legacy binary gate
 *   (`profiles.role = 'admin'`) and treat such a user as an **owner** — so no
 *   existing admin loses access before/after the migration lands.
 * - A `suspended` member has no access.
 */
async function resolveAdminRole(userId: string): Promise<AdminRole | null | "suspended"> {
  const admin = createSupabaseAdminClient();

  // admin_members may not exist yet — ignore the error and fall through.
  const { data: member } = await admin
    .from("admin_members")
    .select("role,status")
    .eq("user_id", userId)
    .maybeSingle();

  if (member && isAdminRole(member.role)) {
    if (member.status === "suspended") return "suspended";
    return member.role;
  }

  // Legacy fallback: a binary admin with no member row is a full owner.
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return profile?.role === "admin" ? "owner" : null;
}

/**
 * Enforce that the current request is an authenticated admin, and return the
 * identity WITH resolved role + permissions. Redirects to the login otherwise.
 * Call at the top of every admin layout / page / server action — middleware
 * only checks authentication, this is the role gate (defense in depth).
 */
export async function requireAdmin(): Promise<AdminIdentity> {
  if (!isSupabaseConfigured()) redirect("/admin/login");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const role = await resolveAdminRole(user.id);
  if (role === "suspended") redirect("/admin/login?error=suspended");
  if (!role) redirect("/admin/login?error=not_admin");

  return { id: user.id, email: user.email ?? null, role, permissions: permissionsForRole(role) };
}

/**
 * Like requireAdmin, but additionally asserts a specific capability. Use to
 * gate a page or server action (e.g. team management → 'team.manage'). Bounces
 * a logged-in admin who lacks the permission back to the dashboard.
 */
export async function requirePermission(permission: AdminPermission): Promise<AdminIdentity> {
  const identity = await requireAdmin();
  if (!hasPermission(identity.role, permission)) {
    redirect("/admin?error=forbidden");
  }
  return identity;
}
