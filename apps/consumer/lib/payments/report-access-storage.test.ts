import { beforeEach, describe, expect, it } from "vitest";
import {
  readReportAccess,
  unlockStoredReport,
  writeReportAccess,
} from "@/lib/payments/report-access-storage";

describe("report access persistence", () => {
  beforeEach(() => window.localStorage.clear());

  it("starts in preview and survives checkout state changes", () => {
    const initial = readReportAccess("report-1");
    expect(initial.status).toBe("preview");
    expect(initial.isPaid).toBe(false);

    writeReportAccess({ ...initial, status: "checkout" });
    expect(readReportAccess("report-1").status).toBe("checkout");
  });

  it("persists an unlock separately for each report", () => {
    unlockStoredReport("report-1", "payment-1");

    expect(readReportAccess("report-1")).toMatchObject({
      status: "unlocked",
      isPaid: true,
      paymentId: "payment-1",
    });
    expect(readReportAccess("report-2").isPaid).toBe(false);
  });

  it("recovers from malformed storage", () => {
    window.localStorage.setItem("tareeq.report.access.v1:report-1", "broken");
    expect(readReportAccess("report-1").status).toBe("preview");
  });
});
