import {
  createPreviewAccess,
  type ReportAccess,
} from "@/lib/payments/report-access";

const storagePrefix = "tareeq.report.access.v1";

function storageKey(reportId: string): string {
  return `${storagePrefix}:${reportId}`;
}

function isReportAccess(value: unknown, reportId: string): value is ReportAccess {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ReportAccess>;
  return (
    candidate.reportId === reportId &&
    typeof candidate.status === "string" &&
    typeof candidate.isPaid === "boolean" &&
    typeof candidate.updatedAt === "string"
  );
}

export function readReportAccess(reportId: string): ReportAccess {
  if (typeof window === "undefined") return createPreviewAccess(reportId);

  try {
    const raw = window.localStorage.getItem(storageKey(reportId));
    if (!raw) return createPreviewAccess(reportId);
    const parsed: unknown = JSON.parse(raw);
    return isReportAccess(parsed, reportId)
      ? parsed
      : createPreviewAccess(reportId);
  } catch {
    return createPreviewAccess(reportId);
  }
}

export function writeReportAccess(access: ReportAccess): ReportAccess {
  const next = { ...access, updatedAt: new Date().toISOString() };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey(access.reportId), JSON.stringify(next));
  }
  return next;
}

export function unlockStoredReport(
  reportId: string,
  paymentId: string,
): ReportAccess {
  return writeReportAccess({
    reportId,
    status: "unlocked",
    isPaid: true,
    paymentId,
    unlockedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}
