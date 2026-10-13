import { describe, expect, it } from "vitest";
import { decideDashboardAccess } from "./dashboard-access";

describe("decideDashboardAccess", () => {
  it("is signed-out without a session, even with a saved local result", () => {
    expect(
      decideDashboardAccess({
        sessionEmail: null,
        localEmail: "sara@example.com",
        hasLocalResult: true,
      }),
    ).toBe("signed-out");
  });

  it("allows the local result when it belongs to the signed-in account", () => {
    expect(
      decideDashboardAccess({
        sessionEmail: "Sara@Example.com",
        localEmail: " sara@example.com ",
        hasLocalResult: true,
      }),
    ).toBe("allow-local");
  });

  it("clears another account's local result, then restores from the account", () => {
    expect(
      decideDashboardAccess({
        sessionEmail: "omar@example.com",
        localEmail: "sara@example.com",
        hasLocalResult: true,
      }),
    ).toBe("clear-and-restore");
  });

  it("restores from the account when nothing is saved locally", () => {
    expect(
      decideDashboardAccess({
        sessionEmail: "omar@example.com",
        localEmail: null,
        hasLocalResult: false,
      }),
    ).toBe("restore");
  });

  it("restores (without trusting it) a local result that has no owner email", () => {
    expect(
      decideDashboardAccess({
        sessionEmail: "omar@example.com",
        localEmail: null,
        hasLocalResult: true,
      }),
    ).toBe("clear-and-restore");
  });
});
