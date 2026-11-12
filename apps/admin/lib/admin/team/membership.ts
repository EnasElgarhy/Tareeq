import { type AdminRole, isAdminRole } from "@/lib/admin/team/permissions";

export interface MembershipRow {
  role: unknown;
  status: unknown;
}

/**
 * Admin access comes from an `admin_members` row only. `profiles.role` is
 * never a source of access: until November 2026 a student could set it on
 * their own profile (security review, 12 Nov 2026).
 */
export function adminRoleFromMembership(
  member: MembershipRow | null,
): AdminRole | "suspended" | null {
  if (!member || !isAdminRole(member.role)) return null;
  return member.status === "suspended" ? "suspended" : member.role;
}
