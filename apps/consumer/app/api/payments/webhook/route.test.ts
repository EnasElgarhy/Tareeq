import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  createAdminClient: vi.fn(),
  getStripeClient: vi.fn(),
  getStripeWebhookSecret: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/payments/stripe-server", () => ({
  getStripeClient: mocks.getStripeClient,
  getStripeWebhookSecret: mocks.getStripeWebhookSecret,
}));

import { POST } from "@/app/api/payments/webhook/route";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const ASSESSMENT_ID = "22222222-2222-4222-8222-222222222222";
const PAYMENT_INTENT_ID = "pi_report_payment";
const SIGNATURE = "stripe_signature";
const WEBHOOK_SECRET = "whsec_test";
const RAW_BODY = '{"stripe":"raw payload"}';

interface EntitlementRow {
  id: string;
  user_id: string;
  assessment_id: string;
  status: "active" | "revoked";
  source: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  amount_minor: number | null;
  currency: string | null;
  granted_by: string | null;
  granted_invite_id: string | null;
  created_at: string;
  revoked_at: string | null;
}

class EntitlementDatabase {
  readonly rows: EntitlementRow[] = [];
  readonly from = vi.fn((table: string) => {
    if (table !== "report_entitlements") {
      throw new Error(`Unexpected table: ${table}`);
    }
    return {
      upsert: (purchase: Record<string, unknown>) => ({
        select: async () => this.upsert(purchase),
      }),
      select: () => this.createSelectQuery(),
      update: (values: Record<string, unknown>) =>
        this.createUpdateQuery(values),
    };
  });
  writeCount = 0;

  readonly client = { from: this.from };

  seed(overrides: Partial<EntitlementRow> = {}): EntitlementRow {
    const row: EntitlementRow = {
      id: `entitlement-${this.rows.length + 1}`,
      user_id: USER_ID,
      assessment_id: ASSESSMENT_ID,
      status: "active",
      source: "stripe",
      stripe_session_id: "cs_existing",
      stripe_payment_intent_id: PAYMENT_INTENT_ID,
      amount_minor: 999,
      currency: "usd",
      granted_by: null,
      granted_invite_id: null,
      created_at: "2026-09-01T09:00:00.000Z",
      revoked_at: null,
      ...overrides,
    };
    this.rows.push(row);
    return row;
  }

  private async upsert(purchase: Record<string, unknown>) {
    const hasSession = this.rows.some(
      (row) => row.stripe_session_id === purchase.stripe_session_id,
    );
    if (hasSession) return { data: [], error: null };

    const hasAssessment = this.rows.some(
      (row) =>
        row.user_id === purchase.user_id &&
        row.assessment_id === purchase.assessment_id,
    );
    if (hasAssessment) {
      return {
        data: null,
        error: {
          code: "23505",
          message:
            "duplicate key value violates unique constraint user_assessment",
        },
      };
    }

    const row = this.seed({
      user_id: String(purchase.user_id),
      assessment_id: String(purchase.assessment_id),
      status: "active",
      stripe_session_id: String(purchase.stripe_session_id),
      stripe_payment_intent_id:
        typeof purchase.stripe_payment_intent_id === "string"
          ? purchase.stripe_payment_intent_id
          : null,
      amount_minor:
        typeof purchase.amount_minor === "number"
          ? purchase.amount_minor
          : null,
      currency:
        typeof purchase.currency === "string" ? purchase.currency : null,
    });
    this.writeCount += 1;
    return { data: [{ id: row.id }], error: null };
  }

  private createSelectQuery() {
    const filters = new Map<string, unknown>();
    const query = {
      eq: (column: string, value: unknown) => {
        filters.set(column, value);
        return query;
      },
      maybeSingle: async () => {
        const found =
          this.rows.find((row) =>
            [...filters].every(
              ([column, value]) =>
                (row as unknown as Record<string, unknown>)[column] === value,
            ),
          ) ?? null;
        return { data: found, error: null };
      },
    };
    return query;
  }

  private createUpdateQuery(values: Record<string, unknown>) {
    const filters = new Map<string, unknown>();
    const query = {
      eq: (column: string, value: unknown) => {
        filters.set(column, value);
        return query;
      },
      select: async () => {
        const matchingRows = this.rows.filter((row) =>
          [...filters].every(
            ([column, value]) =>
              (row as unknown as Record<string, unknown>)[column] === value,
          ),
        );
        for (const row of matchingRows) Object.assign(row, values);
        this.writeCount += matchingRows.length;
        return {
          data: matchingRows.map(({ id }) => ({ id })),
          error: null,
        };
      },
    };
    return query;
  }
}

function checkoutCompletedEvent(sessionId: string) {
  return {
    id: `evt_${sessionId}`,
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        payment_status: "paid",
        metadata: { user_id: USER_ID, assessment_id: ASSESSMENT_ID },
        client_reference_id: ASSESSMENT_ID,
        payment_intent: PAYMENT_INTENT_ID,
        amount_total: 999,
        currency: "usd",
      },
    },
  };
}

function revocationEvent(type: "charge.refunded" | "charge.dispute.created") {
  return {
    id: `evt_${type.replaceAll(".", "_")}`,
    type,
    data: { object: { payment_intent: PAYMENT_INTENT_ID } },
  };
}

function webhookRequest(hasSignature = true): Request {
  return new Request("http://localhost/api/payments/webhook", {
    method: "POST",
    headers: hasSignature ? { "stripe-signature": SIGNATURE } : undefined,
    body: RAW_BODY,
  });
}

async function deliver(event: unknown): Promise<Response> {
  mocks.constructEvent.mockReturnValue(event);
  return POST(webhookRequest());
}

describe("POST /api/payments/webhook", () => {
  let database: EntitlementDatabase;

  beforeEach(() => {
    vi.clearAllMocks();
    database = new EntitlementDatabase();
    mocks.createAdminClient.mockReturnValue(database.client);
    mocks.getStripeClient.mockReturnValue({
      webhooks: { constructEvent: mocks.constructEvent },
    });
    mocks.getStripeWebhookSecret.mockReturnValue(WEBHOOK_SECRET);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("grants exactly once when a completed checkout is delivered twice", async () => {
    const event = checkoutCompletedEvent("cs_new_purchase");

    const firstResponse = await deliver(event);
    const secondResponse = await deliver(event);

    expect(firstResponse.status).toBe(200);
    await expect(firstResponse.json()).resolves.toEqual({
      received: true,
      outcome: "granted",
    });
    expect(secondResponse.status).toBe(200);
    await expect(secondResponse.json()).resolves.toEqual({
      received: true,
      outcome: "duplicate_session",
    });
    expect(database.rows).toHaveLength(1);
    expect(database.rows[0]).toMatchObject({
      user_id: USER_ID,
      assessment_id: ASSESSMENT_ID,
      status: "active",
      stripe_session_id: "cs_new_purchase",
    });
    expect(database.writeCount).toBe(1);
  });

  it("never overwrites a different active paid transaction", async () => {
    const row = database.seed();
    const before = { ...row };

    const response = await deliver(checkoutCompletedEvent("cs_second_charge"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      received: true,
      outcome: "conflicting_paid_transaction",
    });
    expect(database.rows).toEqual([before]);
    expect(database.writeCount).toBe(0);
  });

  it("upgrades an active admin grant to paid while preserving grant audit", async () => {
    database.seed({
      status: "active",
      source: "admin_grant",
      stripe_session_id: null,
      stripe_payment_intent_id: null,
      amount_minor: null,
      currency: null,
      granted_by: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      granted_invite_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    });

    const response = await deliver(
      checkoutCompletedEvent("cs_paid_after_grant"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      received: true,
      outcome: "upgraded_to_paid",
    });
    expect(database.rows).toHaveLength(1);
    expect(database.rows[0]).toMatchObject({
      status: "active",
      source: "stripe",
      stripe_session_id: "cs_paid_after_grant",
      stripe_payment_intent_id: PAYMENT_INTENT_ID,
      amount_minor: 999,
      currency: "usd",
      granted_by: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      granted_invite_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    });
    expect(database.writeCount).toBe(1);
  });

  it("records source stripe when reactivating a revoked admin grant", async () => {
    database.seed({
      status: "revoked",
      source: "admin_grant",
      revoked_at: "2026-09-01T09:30:00.000Z",
      stripe_session_id: null,
      granted_invite_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    });

    const response = await deliver(
      checkoutCompletedEvent("cs_repurchase_grant"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      received: true,
      outcome: "reactivated",
    });
    expect(database.rows).toHaveLength(1);
    expect(database.rows[0]).toMatchObject({
      status: "active",
      source: "stripe",
      revoked_at: null,
      stripe_session_id: "cs_repurchase_grant",
      granted_invite_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    });
    expect(database.writeCount).toBe(1);
  });

  it("reactivates a revoked row after a new purchase conflicts on user-assessment", async () => {
    database.seed({
      status: "revoked",
      revoked_at: "2026-09-01T09:30:00.000Z",
    });

    const response = await deliver(checkoutCompletedEvent("cs_repurchase"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      received: true,
      outcome: "reactivated",
    });
    expect(database.rows).toHaveLength(1);
    expect(database.rows[0]).toMatchObject({
      status: "active",
      source: "stripe",
      revoked_at: null,
      stripe_session_id: "cs_repurchase",
      stripe_payment_intent_id: PAYMENT_INTENT_ID,
      amount_minor: 999,
      currency: "usd",
    });
    expect(database.writeCount).toBe(1);
  });

  it("rejects a missing signature without touching entitlements", async () => {
    database.seed();
    const before = database.rows.map((row) => ({ ...row }));

    const response = await POST(webhookRequest(false));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "missing_signature",
    });
    expect(mocks.constructEvent).not.toHaveBeenCalled();
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
    expect(database.rows).toEqual(before);
    expect(database.writeCount).toBe(0);
  });

  it("rejects an invalid signature without touching entitlements", async () => {
    database.seed();
    const before = database.rows.map((row) => ({ ...row }));
    mocks.constructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature");
    });

    const response = await POST(webhookRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "invalid_signature",
    });
    expect(mocks.constructEvent).toHaveBeenCalledWith(
      RAW_BODY,
      SIGNATURE,
      WEBHOOK_SECRET,
    );
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
    expect(database.rows).toEqual(before);
    expect(database.writeCount).toBe(0);
  });

  it.each(["charge.refunded", "charge.dispute.created"] as const)(
    "revokes an active entitlement for %s",
    async (eventType) => {
      database.seed();

      const response = await deliver(revocationEvent(eventType));

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        received: true,
        outcome: "revoked_1",
      });
      expect(database.rows[0]?.status).toBe("revoked");
      expect(database.rows[0]?.revoked_at).toEqual(expect.any(String));
      expect(database.writeCount).toBe(1);
    },
  );

  it("does not rewrite revoked_at when a refund is redelivered", async () => {
    vi.useFakeTimers();
    database.seed();
    const event = revocationEvent("charge.refunded");

    vi.setSystemTime(new Date("2026-09-01T10:00:00.000Z"));
    const firstResponse = await deliver(event);
    const firstRevokedAt = database.rows[0]?.revoked_at;

    vi.setSystemTime(new Date("2026-09-01T11:00:00.000Z"));
    const secondResponse = await deliver(event);

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    await expect(secondResponse.json()).resolves.toEqual({
      received: true,
      outcome: "nothing_to_revoke",
    });
    expect(firstRevokedAt).toBe("2026-09-01T10:00:00.000Z");
    expect(database.rows[0]?.revoked_at).toBe(firstRevokedAt);
    expect(database.writeCount).toBe(1);
  });

  it("acknowledges an unknown event without mutating entitlements", async () => {
    database.seed();
    const before = database.rows.map((row) => ({ ...row }));

    const response = await deliver({
      id: "evt_customer_updated",
      type: "customer.updated",
      data: { object: { id: "cus_123" } },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      received: true,
      outcome: "ignored_event_type",
    });
    expect(database.from).not.toHaveBeenCalled();
    expect(database.rows).toEqual(before);
    expect(database.writeCount).toBe(0);
  });
});
