"use client";

import { useEffect, useState } from "react";
import { readLocalAssessment } from "@/lib/assessment/progress";
import {
  createPreviewAccess,
  reportIdFromGeneratedAt,
} from "@/lib/payments/report-access";
import {
  readReportAccess,
  writeReportAccess,
} from "@/lib/payments/report-access-storage";
import { stripeReportPaymentService } from "@/lib/payments/report-payment-service";
import { resolveCurrentAssessmentId } from "@/lib/results/assessment-identity";
import { readGeneratedReport, readResultRegistration } from "@/lib/results/storage";

/**
 * The one client-side answer to "may this visitor use the paid surfaces?".
 *
 * The local access cache answers instantly for anyone who has already paid, so
 * a paying visitor never sees a lock flash. Everyone else is checked against
 * the entitlement route — the server is the only source of truth — once per
 * session, shared across the screens that mount this hook.
 *
 * `checking` is a real state: screens must render it as a loading state, never
 * as locked. Showing the paywall to someone who already paid (because the
 * answer had not arrived yet) is the one failure this hook exists to prevent.
 */
export type PaidAccessState = "checking" | "paid" | "unpaid";

let inFlightCheck: Promise<boolean> | null = null;
let cachedVerdict: { reportId: string; paid: boolean } | null = null;

/** Screens showing a paid surface, told when a verdict changes underneath them. */
const listeners = new Set<() => void>();

/** Test seam — lets a test start from a cold cache. */
export function resetPaidAccessCache() {
  inFlightCheck = null;
  cachedVerdict = null;
  listeners.clear();
}

/**
 * Called when a paid route answers 402: whatever we believed, the server has
 * just refused. Corrects the cache and tells the mounted screens, so a
 * conversation that gets cut off mid-thread turns into the lock rather than a
 * dead message the visitor cannot act on.
 */
export function markPaidAccessUnpaid() {
  const reportId = currentReportId();
  if (!reportId) return;
  cachedVerdict = { reportId, paid: false };
  writeReportAccess(createPreviewAccess(reportId));
  for (const notify of listeners) notify();
}

function currentReportId(): string | null {
  const report = readGeneratedReport();
  return report ? reportIdFromGeneratedAt(report.generatedAt) : null;
}

/** `null` means the cache cannot answer and the server has to be asked. */
function cachedState(): PaidAccessState | null {
  const reportId = currentReportId();
  // No report at all: there is nothing paid to unlock, and every screen that
  // uses this hook shows its "take the assessment" state instead.
  if (!reportId) return "unpaid";

  const access = readReportAccess(reportId);
  if (access.isPaid || access.status === "unlocked") return "paid";
  return null;
}

async function checkWithServer(): Promise<boolean> {
  const reportId = currentReportId();
  if (!reportId) return false;

  const assessmentId =
    readResultRegistration()?.assessmentId ??
    (await resolveCurrentAssessmentId(
      readLocalAssessment()?.versionId ?? null,
    ));

  // Reconciles the cache against the server and returns the corrected access.
  const access = await stripeReportPaymentService.restorePurchase({
    reportId,
    assessmentId,
  });
  return Boolean(access.isPaid || access.status === "unlocked");
}

export function usePaidAccess(): { state: PaidAccessState } {
  const [state, setState] = useState<PaidAccessState>(
    () => cachedState() ?? "checking",
  );

  useEffect(() => {
    const local = cachedState();
    if (local) {
      setState(local);
      return;
    }

    const reportId = currentReportId();
    if (reportId && cachedVerdict?.reportId === reportId) {
      setState(cachedVerdict.paid ? "paid" : "unpaid");
      return;
    }

    let active = true;
    inFlightCheck ??= checkWithServer().finally(() => {
      inFlightCheck = null;
    });

    void inFlightCheck
      .then((paid) => {
        if (reportId) cachedVerdict = { reportId, paid };
        if (active) setState(paid ? "paid" : "unpaid");
      })
      .catch(() => {
        // The check itself failed. Locking is the safe answer here: the server
        // refuses unpaid calls anyway, so a wrong "paid" would only produce a
        // confusing error deeper in.
        if (active) setState("unpaid");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const notify = () => setState(cachedState() ?? "unpaid");
    listeners.add(notify);
    return () => {
      listeners.delete(notify);
    };
  }, []);

  return { state };
}
