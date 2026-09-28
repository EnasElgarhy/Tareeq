import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import {
  hasPaidReportAccess,
  paidAccessError,
} from "@/app/api/payments/_lib/entitlements";

const USER_ID = "3b1f6b2e-0000-4000-8000-000000000001";
const ASSESSMENT_ID = "11111111-2222-4333-8444-555555555555";

type TableResult = { data: unknown; error: { message: string } | null };

/**
 * A chainable stand-in for the PostgREST builder: every filter returns itself
 * and only `maybeSingle` answers, which is all these two queries use.
 */
function fakeAdmin(results: {
  assessments: TableResult;
  report_entitlements: TableResult;
}) {
  const calls: { table: string; filters: [string, unknown][] }[] = [];
  return {
    calls,
    client: {
      from(table: "assessments" | "report_entitlements") {
        const record = { table, filters: [] as [string, unknown][] };
        calls.push(record);
        const builder = {
          select: () => builder,
          eq: (column: string, value: unknown) => {
            record.filters.push([column, value]);
            return builder;
          },
          not: (column: string, operator: string, value: unknown) => {
            record.filters.push([`${column} ${operator}`, value]);
            return builder;
          },
          order: () => builder,
          limit: () => builder,
          maybeSingle: async () => results[table],
        };
        return builder;
      },
    } as unknown as SupabaseClient,
  };
}

describe("hasPaidReportAccess", () => {
  it("reports paid when the user's latest assessment has an active entitlement", async () => {
    const admin = fakeAdmin({
      assessments: { data: { id: ASSESSMENT_ID }, error: null },
      report_entitlements: {
        data: { id: "ent-1", created_at: "2026-09-01T00:00:00Z" },
        error: null,
      },
    });

    await expect(hasPaidReportAccess(admin.client, USER_ID)).resolves.toEqual({
      paid: true,
      assessmentId: ASSESSMENT_ID,
    });
    // The entitlement lookup must be scoped to the session's own user.
    expect(admin.calls[1].filters).toContainEqual(["user_id", USER_ID]);
    expect(admin.calls[1].filters).toContainEqual(["assessment_id", ASSESSMENT_ID]);
  });

  it("reports not_entitled when the assessment exists but was never paid for", async () => {
    const admin = fakeAdmin({
      assessments: { data: { id: ASSESSMENT_ID }, error: null },
      report_entitlements: { data: null, error: null },
    });

    await expect(hasPaidReportAccess(admin.client, USER_ID)).resolves.toMatchObject({
      paid: false,
      reason: "not_entitled",
    });
  });

  it("reports no_assessment before the visitor has finished one", async () => {
    const admin = fakeAdmin({
      assessments: { data: null, error: null },
      report_entitlements: { data: null, error: null },
    });

    await expect(hasPaidReportAccess(admin.client, USER_ID)).resolves.toMatchObject({
      paid: false,
      reason: "no_assessment",
    });
  });

  it("distinguishes a failed lookup from an unpaid account", async () => {
    const admin = fakeAdmin({
      assessments: { data: null, error: { message: "connection reset" } },
      report_entitlements: { data: null, error: null },
    });

    await expect(hasPaidReportAccess(admin.client, USER_ID)).resolves.toMatchObject({
      paid: false,
      reason: "lookup_failed",
    });
  });

  it("treats an entitlement lookup error as a failed check, not as unpaid", async () => {
    const admin = fakeAdmin({
      assessments: { data: { id: ASSESSMENT_ID }, error: null },
      report_entitlements: { data: null, error: { message: "timeout" } },
    });

    await expect(hasPaidReportAccess(admin.client, USER_ID)).resolves.toMatchObject({
      paid: false,
      reason: "lookup_failed",
    });
  });
});

describe("paidAccessError", () => {
  it("lets a paid caller through", () => {
    expect(paidAccessError({ paid: true, assessmentId: ASSESSMENT_ID })).toBeNull();
  });

  it("answers 402 upgrade_required for an unpaid caller", async () => {
    const response = paidAccessError({ paid: false, reason: "not_entitled" });
    expect(response?.status).toBe(402);
    await expect(response?.json()).resolves.toEqual({ error: "upgrade_required" });
  });

  it("answers 503 — never 402 — when the check itself failed", async () => {
    const response = paidAccessError({
      paid: false,
      reason: "lookup_failed",
      message: "timeout",
    });
    // 402 here would tell a paying customer to buy what they already own.
    expect(response?.status).toBe(503);
    await expect(response?.json()).resolves.toEqual({
      error: "access_check_unavailable",
    });
  });
});
