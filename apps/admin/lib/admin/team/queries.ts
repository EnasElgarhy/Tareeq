import { isAdminRole, type AdminRole } from "@/lib/admin/team/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface TeamMember {
  userId: string;
  name: string | null;
  email: string | null;
  role: AdminRole;
  status: "active" | "suspended";
  invitedByEmail: string | null;
  createdAt: string | null;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: AdminRole;
  createdAt: string | null;
  expiresAt: string | null;
}

export interface TeamData {
  /** false when the admin_members table doesn't exist yet (migration unapplied). */
  available: boolean;
  members: TeamMember[];
  invitations: TeamInvitation[];
}

interface RawMember {
  user_id: string;
  role: string;
  status: string;
  invited_by: string | null;
  created_at: string | null;
}

export async function getTeam(): Promise<TeamData> {
  const sb = createSupabaseAdminClient();

  const { data: memberRows, error } = await sb.from("admin_members").select("*");
  if (error) return { available: false, members: [], invitations: [] };

  const members = (memberRows ?? []) as RawMember[];
  const userIds = [...new Set(members.map((m) => m.user_id))];

  // Batch-fetch identity: emails/names from user_accounts (by auth_user_id),
  // display_name from profiles (by id) — same join the Users module uses.
  const [{ data: accounts }, { data: profiles }] = await Promise.all([
    userIds.length
      ? sb.from("user_accounts").select("auth_user_id,name,email").in("auth_user_id", userIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? sb.from("profiles").select("id,display_name").in("id", userIds)
      : Promise.resolve({ data: [] }),
  ]);
  const accountByAuth = new Map(
    (accounts ?? []).map((a) => [
      (a as { auth_user_id: string }).auth_user_id,
      a as { name: string | null; email: string | null },
    ]),
  );
  const nameById = new Map(
    (profiles ?? []).map((p) => [
      (p as { id: string }).id,
      (p as { display_name: string | null }).display_name,
    ]),
  );
  const emailById = new Map(
    members.map((m) => [m.user_id, accountByAuth.get(m.user_id)?.email ?? null]),
  );

  const mapped: TeamMember[] = members
    .filter((m) => isAdminRole(m.role))
    .map((m): TeamMember => ({
      userId: m.user_id,
      name: accountByAuth.get(m.user_id)?.name ?? nameById.get(m.user_id) ?? null,
      email: emailById.get(m.user_id) ?? null,
      role: m.role as AdminRole,
      status: m.status === "suspended" ? "suspended" : "active",
      invitedByEmail: m.invited_by ? emailById.get(m.invited_by) ?? null : null,
      createdAt: m.created_at,
    }))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  const { data: invRows } = await sb
    .from("admin_invitations")
    .select("id,email,role,created_at,expires_at,status")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  const invitations: TeamInvitation[] = (invRows ?? [])
    .filter((r) => isAdminRole((r as { role: string }).role))
    .map((r) => {
      const row = r as { id: string; email: string; role: string; created_at: string | null; expires_at: string | null };
      return { id: row.id, email: row.email, role: row.role as AdminRole, createdAt: row.created_at, expiresAt: row.expires_at };
    });

  return { available: true, members: mapped, invitations };
}
