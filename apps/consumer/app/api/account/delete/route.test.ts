// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  signOut: vi.fn(),
  adminFrom: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser, signOut: mocks.signOut },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from: mocks.adminFrom,
    auth: { admin: { deleteUser: mocks.deleteUser } },
  })),
}));

import { POST } from "@/app/api/account/delete/route";
import { isRecentSignIn, RECENT_SIGN_IN_MS } from "@/lib/account/delete-account";

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

/** A fresh user per test, so the per-user rate limit never carries over. */
let userCounter = 0;
function signIn(lastSignInAt: string | null = minutesAgo(1)): string {
  userCounter += 1;
  const id = `00000000-0000-4000-8000-${String(userCounter).padStart(12, "0")}`;
  mocks.getUser.mockResolvedValue({ data: { user: { id, last_sign_in_at: lastSignInAt } } });
  return id;
}

interface TableResults {
  adminMember?: { data: unknown; error: unknown };
  assessments?: { error: unknown };
  userAccounts?: { error: unknown };
}

/** Records every admin query as "table.operation(column=value)". */
function stubTables(results: TableResults = {}): string[] {
  const calls: string[] = [];
  mocks.adminFrom.mockImplementation((table: string) => {
    let operation = "select";
    const query: Record<string, unknown> = {
      select: vi.fn(() => query),
      delete: vi.fn(() => {
        operation = "delete";
        return query;
      }),
      eq: vi.fn((column: string, value: string) => {
        calls.push(`${table}.${operation}(${column}=${value})`);
        return query;
      }),
      maybeSingle: vi.fn(async () => results.adminMember ?? { data: null, error: null }),
      then: (resolve: (value: unknown) => void) =>
        resolve(
          table === "assessments"
            ? (results.assessments ?? { error: null })
            : (results.userAccounts ?? { error: null }),
        ),
    };
    return query;
  });
  return calls;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.deleteUser.mockResolvedValue({ error: null });
  mocks.signOut.mockResolvedValue({ error: null });
});

describe("isRecentSignIn", () => {
  it("accepts a sign-in inside the window and rejects an older or missing one", () => {
    const now = Date.parse("2026-11-20T12:00:00Z");
    expect(isRecentSignIn("2026-11-20T11:55:00Z", now)).toBe(true);
    expect(isRecentSignIn(new Date(now - RECENT_SIGN_IN_MS - 1000).toISOString(), now)).toBe(false);
    expect(isRecentSignIn(null, now)).toBe(false);
    expect(isRecentSignIn("not a date", now)).toBe(false);
  });
});

describe("POST /api/account/delete", () => {
  it("returns 401 when nobody is signed in", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    stubTables();

    const response = await POST();

    expect(response.status).toBe(401);
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("refuses when the emailed code was not confirmed in the last few minutes", async () => {
    signIn(minutesAgo(30));
    stubTables();

    const response = await POST();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "confirm_required" });
    expect(mocks.adminFrom).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("deletes the student's attempts, then the account, and ends the session", async () => {
    const userId = signIn();
    const calls = stubTables();

    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ deleted: true });
    expect(calls).toEqual([
      `admin_members.select(user_id=${userId})`,
      `assessments.delete(user_id=${userId})`,
      `user_accounts.delete(auth_user_id=${userId})`,
    ]);
    expect(mocks.deleteUser).toHaveBeenCalledWith(userId);
    expect(mocks.signOut).toHaveBeenCalled();
  });

  it("never deletes an account that manages the admin site", async () => {
    signIn();
    const calls = stubTables({ adminMember: { data: { user_id: "x" }, error: null } });

    const response = await POST();

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "admin_account" });
    expect(calls.some((call) => call.includes(".delete("))).toBe(false);
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("deletes nothing when the admin check cannot be read", async () => {
    signIn();
    const calls = stubTables({ adminMember: { data: null, error: { message: "down" } } });

    const response = await POST();

    expect(response.status).toBe(503);
    expect(calls.some((call) => call.includes(".delete("))).toBe(false);
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("keeps the account when its attempts could not be deleted", async () => {
    signIn();
    stubTables({ assessments: { error: { message: "boom" } } });

    const response = await POST();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "delete_failed" });
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("reports a failure when the account itself could not be deleted", async () => {
    signIn();
    stubTables();
    mocks.deleteUser.mockResolvedValue({ error: { message: "nope" } });

    const response = await POST();

    expect(response.status).toBe(500);
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("still deletes the account when the old accounts table cannot be cleaned", async () => {
    const userId = signIn();
    stubTables({ userAccounts: { error: { message: "relation does not exist" } } });

    const response = await POST();

    expect(response.status).toBe(200);
    expect(mocks.deleteUser).toHaveBeenCalledWith(userId);
  });

  it("limits repeated attempts from one account", async () => {
    signIn(minutesAgo(30));
    stubTables();

    const statuses: number[] = [];
    for (let attempt = 0; attempt < 7; attempt += 1) statuses.push((await POST()).status);

    expect(statuses.at(-1)).toBe(429);
  });
});
