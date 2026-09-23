import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.createAdminClient,
}));

import { GET } from "@/app/api/payments/entitlement/route";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";
const ASSESSMENT_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_ASSESSMENT_ID = "44444444-4444-4444-8444-444444444444";
const UNLOCKED_AT = "2026-09-01T10:00:00.000Z";

interface EntitlementRow {
  id: string;
  user_id: string;
  assessment_id: string;
  status: "active" | "revoked";
  created_at: string;
}

function createAdminClient(
  rows: EntitlementRow[],
  error: { message: string } | null = null,
) {
  return {
    from: vi.fn(() => {
      const filters = new Map<string, unknown>();
      const query = {
        eq: vi.fn((column: string, value: unknown) => {
          filters.set(column, value);
          return query;
        }),
        maybeSingle: vi.fn(async () => ({
          data:
            rows.find((row) =>
              [...filters].every(
                ([column, value]) =>
                  row[column as keyof EntitlementRow] === value,
              ),
            ) ?? null,
          error,
        })),
      };
      return { select: vi.fn(() => query) };
    }),
  };
}

function entitlementRequest(assessmentId: string): Request {
  return new Request(
    `http://localhost/api/payments/entitlement?assessmentId=${assessmentId}`,
  );
}

describe("GET /api/payments/entitlement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
  });

  it("returns active only for the caller's own paid assessment", async () => {
    mocks.createAdminClient.mockReturnValue(
      createAdminClient([
        {
          id: "55555555-5555-4555-8555-555555555555",
          user_id: OTHER_USER_ID,
          assessment_id: ASSESSMENT_ID,
          status: "active",
          created_at: "2026-08-31T10:00:00.000Z",
        },
        {
          id: "66666666-6666-4666-8666-666666666666",
          user_id: USER_ID,
          assessment_id: ASSESSMENT_ID,
          status: "active",
          created_at: UNLOCKED_AT,
        },
      ]),
    );

    const response = await GET(entitlementRequest(ASSESSMENT_ID));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "active",
      unlockedAt: UNLOCKED_AT,
    });
  });

  it.each([
    ["another user's active entitlement", ASSESSMENT_ID],
    ["the caller's different assessment", OTHER_ASSESSMENT_ID],
  ])("returns none for %s", async (_, requestedAssessmentId) => {
    mocks.createAdminClient.mockReturnValue(
      createAdminClient([
        {
          id: "55555555-5555-4555-8555-555555555555",
          user_id: OTHER_USER_ID,
          assessment_id: ASSESSMENT_ID,
          status: "active",
          created_at: UNLOCKED_AT,
        },
      ]),
    );

    const response = await GET(entitlementRequest(requestedAssessmentId));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "none" });
  });

  it("returns 500 when the database lookup fails", async () => {
    mocks.createAdminClient.mockReturnValue(
      createAdminClient([], { message: "database unavailable" }),
    );

    const response = await GET(entitlementRequest(ASSESSMENT_ID));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "entitlement_lookup_failed",
    });
  });
});
