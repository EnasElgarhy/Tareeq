/**
 * Role-based permissions for the admin panel (see the approved plan).
 *
 * A small set of NAMED roles, each bundling a permission set — simple for a
 * small team, and finer per-capability grants can be layered on later without
 * changing the call sites (they check permissions, not roles). Pure module: no
 * I/O, so it's unit-tested in isolation and reused by both the auth gate
 * (lib/auth/require-admin.ts) and the team UI.
 */

export const ADMIN_ROLES = ["owner", "admin", "editor", "analyst", "viewer"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_PERMISSIONS = [
  "content.edit",
  "responses.view",
  "analytics.view",
  "users.view",
  "users.manage",
  "exports.run",
  "team.manage",
] as const;
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

/** The permission set granted by each role. Owner/Admin differ only in that
 *  Owner may manage other Owners (enforced separately in canManageTargetRole). */
const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  owner: [...ADMIN_PERMISSIONS],
  admin: [
    "content.edit",
    "responses.view",
    "analytics.view",
    "users.view",
    "users.manage",
    "exports.run",
    "team.manage",
  ],
  editor: ["content.edit", "responses.view", "analytics.view", "users.view"],
  analyst: ["responses.view", "analytics.view", "users.view", "exports.run"],
  viewer: ["responses.view", "analytics.view", "users.view"],
};

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && (ADMIN_ROLES as readonly string[]).includes(value);
}

export function permissionsForRole(role: AdminRole): readonly AdminPermission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: AdminRole, permission: AdminPermission): boolean {
  return permissionsForRole(role).includes(permission);
}

/**
 * Whether an actor with `actorRole` may assign/modify a member at `targetRole`.
 * Only Owners may create/modify/remove Owners; Admins manage everyone below
 * Owner. Requires `team.manage` in the first place (checked by the caller).
 */
export function canManageTargetRole(actorRole: AdminRole, targetRole: AdminRole): boolean {
  if (!hasPermission(actorRole, "team.manage")) return false;
  if (targetRole === "owner") return actorRole === "owner";
  return true;
}

/** True when removing/demoting this owner would leave the team with none. */
export function isLastOwner(
  targetRole: AdminRole,
  allActiveRoles: readonly AdminRole[],
): boolean {
  if (targetRole !== "owner") return false;
  return allActiveRoles.filter((r) => r === "owner").length <= 1;
}

/** Human labels for the UI. */
export const ROLE_LABELS: Record<AdminRole, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  analyst: "Analyst",
  viewer: "Viewer",
};
