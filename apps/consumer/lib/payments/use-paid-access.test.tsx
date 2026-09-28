import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  markPaidAccessUnpaid,
  resetPaidAccessCache,
  usePaidAccess,
  type PaidAccessState,
} from "@/lib/payments/use-paid-access";

vi.mock("@/lib/analytics/track", () => ({ trackEvent: vi.fn() }));

const REPORT = { generatedAt: "2026-09-20T10:00:00.000Z" };
const REPORT_ID = "core-20260920T100000000Z";

const mocks = {
  readGeneratedReport: vi.fn(() => REPORT as unknown as never),
  readReportAccess: vi.fn(() => ({ isPaid: false, status: "preview" }) as never),
  writeReportAccess: vi.fn(),
  readResultRegistration: vi.fn(() => ({ assessmentId: "assessment-1" }) as never),
  readLocalAssessment: vi.fn(() => ({ versionId: "v1" }) as never),
  resolveCurrentAssessmentId: vi.fn(async () => "assessment-1"),
  restorePurchase: vi.fn(async () => ({ isPaid: false, status: "preview" }) as never),
};

vi.mock("@/lib/results/storage", () => ({
  readGeneratedReport: () => mocks.readGeneratedReport(),
  readResultRegistration: () => mocks.readResultRegistration(),
}));
vi.mock("@/lib/assessment/progress", () => ({
  readLocalAssessment: () => mocks.readLocalAssessment(),
}));
vi.mock("@/lib/results/assessment-identity", () => ({
  resolveCurrentAssessmentId: (...args: unknown[]) =>
    mocks.resolveCurrentAssessmentId(...(args as [])),
}));
vi.mock("@/lib/payments/report-access-storage", () => ({
  readReportAccess: (...args: unknown[]) =>
    mocks.readReportAccess(...(args as [])),
  writeReportAccess: (...args: unknown[]) =>
    mocks.writeReportAccess(...(args as [])),
}));
vi.mock("@/lib/payments/report-payment-service", () => ({
  stripeReportPaymentService: {
    restorePurchase: (...args: unknown[]) => mocks.restorePurchase(...(args as [])),
  },
}));

function HookProbe({ onState }: { onState: (state: PaidAccessState) => void }) {
  const { state } = usePaidAccess();
  onState(state);
  return createElement("span", null, state);
}

/** Renders the hook and returns every state it passes through, newest last. */
async function mountProbe(): Promise<{ states: PaidAccessState[]; root: Root }> {
  const states: PaidAccessState[] = [];
  const container = document.createElement("div");
  const root = createRoot(container);
  await act(async () => {
    root.render(
      createElement(HookProbe, { onState: (state) => states.push(state) }),
    );
  });
  return { states, root };
}

describe("usePaidAccess", () => {
  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    resetPaidAccessCache();
    vi.clearAllMocks();
    mocks.readGeneratedReport.mockReturnValue(REPORT as unknown as never);
    mocks.readReportAccess.mockReturnValue({
      isPaid: false,
      status: "preview",
    } as never);
    mocks.restorePurchase.mockResolvedValue({
      isPaid: false,
      status: "preview",
    } as never);
  });

  afterEach(() => {
    resetPaidAccessCache();
  });

  it("answers paid from the cache without asking the server", async () => {
    mocks.readReportAccess.mockReturnValue({
      isPaid: true,
      status: "unlocked",
    } as never);

    const { states } = await mountProbe();

    expect(states.at(-1)).toBe("paid");
    expect(mocks.restorePurchase).not.toHaveBeenCalled();
  });

  it("answers unpaid, without asking, when no report exists yet", async () => {
    mocks.readGeneratedReport.mockReturnValue(null as never);

    const { states } = await mountProbe();

    expect(states.at(-1)).toBe("unpaid");
    expect(mocks.restorePurchase).not.toHaveBeenCalled();
  });

  it("passes the resolved assessment id to the restore call", async () => {
    await mountProbe();

    expect(mocks.restorePurchase).toHaveBeenCalledWith({
      reportId: REPORT_ID,
      assessmentId: "assessment-1",
    });
  });

  it("unlocks when the server confirms the entitlement", async () => {
    mocks.restorePurchase.mockResolvedValue({
      isPaid: true,
      status: "unlocked",
    } as never);

    const { states } = await mountProbe();

    expect(states).toContain("checking");
    expect(states.at(-1)).toBe("paid");
  });

  it("stays locked when the server knows nothing about a payment", async () => {
    const { states } = await mountProbe();

    expect(states.at(-1)).toBe("unpaid");
  });

  it("checks once for the whole session, even with the hook mounted twice", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(
        createElement(
          "div",
          null,
          createElement(HookProbe, { onState: () => {} }),
          createElement(HookProbe, { onState: () => {} }),
        ),
      );
    });

    expect(mocks.restorePurchase).toHaveBeenCalledTimes(1);
  });

  it("flips a mounted screen to unpaid when a paid route answers 402", async () => {
    const { states } = await mountProbe();
    expect(states.at(-1)).toBe("unpaid");

    // A fresh session, where the server says this visitor did pay.
    resetPaidAccessCache();
    mocks.restorePurchase.mockResolvedValue({
      isPaid: true,
      status: "unlocked",
    } as never);
    const paid = await mountProbe();
    expect(paid.states.at(-1)).toBe("paid");

    await act(async () => {
      markPaidAccessUnpaid();
    });

    expect(paid.states.at(-1)).toBe("unpaid");
    // And it corrected the stored access rather than only the in-memory copy.
    expect(mocks.writeReportAccess).toHaveBeenCalledWith(
      expect.objectContaining({ reportId: REPORT_ID, isPaid: false }),
    );
  });

  it("treats a failed check as unpaid rather than showing a paid surface", async () => {
    mocks.restorePurchase.mockRejectedValue(new Error("network down"));

    const { states } = await mountProbe();

    expect(states.at(-1)).toBe("unpaid");
  });
});
