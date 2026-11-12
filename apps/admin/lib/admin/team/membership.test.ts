import { describe, expect, it } from "vitest";
import { adminRoleFromMembership } from "./membership";

describe("adminRoleFromMembership", () => {
  it("gives an active member their own role", () => {
    expect(adminRoleFromMembership({ role: "viewer", status: "active" })).toBe("viewer");
    expect(adminRoleFromMembership({ role: "owner", status: "active" })).toBe("owner");
  });

  it("keeps a suspended member out", () => {
    expect(adminRoleFromMembership({ role: "owner", status: "suspended" })).toBe("suspended");
  });

  it("gives no access without a team row, whatever the profile says", () => {
    // profiles.role is not a source of admin access: students could once set it.
    expect(adminRoleFromMembership(null)).toBeNull();
  });

  it("gives no access for a role it does not know", () => {
    expect(adminRoleFromMembership({ role: "superuser", status: "active" })).toBeNull();
  });
});
