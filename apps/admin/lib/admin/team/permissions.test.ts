import { describe, expect, it } from "vitest";
import {
  ADMIN_PERMISSIONS,
  ADMIN_ROLES,
  canManageTargetRole,
  hasPermission,
  isAdminRole,
  isLastOwner,
  permissionsForRole,
} from "@/lib/admin/team/permissions";

describe("permissionsForRole", () => {
  it("owner has every permission", () => {
    expect([...permissionsForRole("owner")].sort()).toEqual([...ADMIN_PERMISSIONS].sort());
  });

  it("admin has team.manage + users.manage but is otherwise like owner's capabilities", () => {
    expect(hasPermission("admin", "team.manage")).toBe(true);
    expect(hasPermission("admin", "users.manage")).toBe(true);
    expect(hasPermission("admin", "content.edit")).toBe(true);
  });

  it("editor can edit content but not manage users or team", () => {
    expect(hasPermission("editor", "content.edit")).toBe(true);
    expect(hasPermission("editor", "users.manage")).toBe(false);
    expect(hasPermission("editor", "team.manage")).toBe(false);
    expect(hasPermission("editor", "exports.run")).toBe(false);
  });

  it("analyst is read + export, never edits content", () => {
    expect(hasPermission("analyst", "content.edit")).toBe(false);
    expect(hasPermission("analyst", "exports.run")).toBe(true);
    expect(hasPermission("analyst", "analytics.view")).toBe(true);
  });

  it("viewer is read-only", () => {
    expect(hasPermission("viewer", "responses.view")).toBe(true);
    expect(hasPermission("viewer", "content.edit")).toBe(false);
    expect(hasPermission("viewer", "exports.run")).toBe(false);
    expect(hasPermission("viewer", "team.manage")).toBe(false);
  });

  it("every role has a defined permission set", () => {
    for (const role of ADMIN_ROLES) {
      expect(Array.isArray(permissionsForRole(role))).toBe(true);
    }
  });
});

describe("isAdminRole", () => {
  it("accepts known roles, rejects junk", () => {
    expect(isAdminRole("owner")).toBe(true);
    expect(isAdminRole("superadmin")).toBe(false);
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole(42)).toBe(false);
  });
});

describe("canManageTargetRole", () => {
  it("only owner may manage owners", () => {
    expect(canManageTargetRole("owner", "owner")).toBe(true);
    expect(canManageTargetRole("admin", "owner")).toBe(false);
  });

  it("admin may manage non-owner roles", () => {
    expect(canManageTargetRole("admin", "editor")).toBe(true);
    expect(canManageTargetRole("admin", "viewer")).toBe(true);
  });

  it("roles without team.manage can manage no one", () => {
    expect(canManageTargetRole("editor", "viewer")).toBe(false);
    expect(canManageTargetRole("viewer", "viewer")).toBe(false);
  });
});

describe("isLastOwner", () => {
  it("true when removing the only owner", () => {
    expect(isLastOwner("owner", ["owner", "admin", "viewer"])).toBe(true);
  });
  it("false when other owners remain", () => {
    expect(isLastOwner("owner", ["owner", "owner", "editor"])).toBe(false);
  });
  it("false for non-owner targets", () => {
    expect(isLastOwner("admin", ["owner"])).toBe(false);
  });
});
