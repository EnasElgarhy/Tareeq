"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  CheckoutSheet,
  type CheckoutStage,
} from "@/components/results/report-access/CheckoutSheet";
import { LockedReportStory } from "@/components/results/report-access/story/LockedReportStory";
import { trackEvent } from "@/lib/analytics/track";
import type { StringKey } from "@/lib/i18n/strings";
import {
  createPreviewAccess,
  getReportOffer,
  reportIdFromGeneratedAt,
  type PaymentProvider,
  type ReportAccess,
} from "@/lib/payments/report-access";
import {
  ReportPaymentError,
  stripeReportPaymentService,
} from "@/lib/payments/report-payment-service";
import { writeReportAccess } from "@/lib/payments/report-access-storage";
import { readLocalAssessment } from "@/lib/assessment/progress";
import { resolveCurrentAssessmentId } from "@/lib/results/assessment-identity";
import { readResultRegistration } from "@/lib/results/storage";
import type { PersonalizedCompassReport } from "@/lib/results/types";

interface ReportAccessExperienceProps {
  report: PersonalizedCompassReport;
  email: string;
  children: ReactNode;
}

/** Maps a payment adapter error code onto a localized, human message. */
function checkoutErrorKey(caught: unknown): StringKey {
  if (!(caught instanceof ReportPaymentError)) return "paywall.error";
  switch (caught.code) {
    case "not_authenticated":
      return "paywall.error.sign_in";
    case "forbidden":
      return "paywall.error.forbidden";
    case "network":
    case "checkout_unavailable":
      return "paywall.error.unavailable";
    case "entitlement_pending":
      return "paywall.error.pending";
    default:
      return "paywall.error";
  }
}

/** Questions answered in the local attempt; 0 when nothing is stored. */
function readAnsweredCount(): number {
  return Object.keys(readLocalAssessment()?.answers ?? {}).length;
}

export function ReportAccessExperience({
  report,
  email,
  children,
}: ReportAccessExperienceProps) {
  const { t } = useLocale();
  const reportId = useMemo(
    () => reportIdFromGeneratedAt(report.generatedAt),
    [report.generatedAt],
  );
  const offer = useMemo(getReportOffer, []);
  const answeredCount = useMemo(readAnsweredCount, []);
  const [access, setAccess] = useState<ReportAccess | null>(null);
  /** `null` means the checkout sheet is closed. */
  const [stage, setStage] = useState<CheckoutStage | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(
    () => readResultRegistration()?.assessmentId ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  /** Which step the retry button should repeat after a failure. */
  const retryStepRef = useRef<"checkout" | "confirm">("checkout");
  const previewTrackedRef = useRef(false);

  // Resolve the server-side assessment id (the entitlement key), then
  // reconcile the local access cache against the server. These are one
  // effect because the order matters: asking the entitlement route without
  // an id can only ever answer "unknown", which would leave a stale cache
  // uncorrected.
  useEffect(() => {
    let isActive = true;

    async function reconcileAccess() {
      const storedAssessmentId = readResultRegistration()?.assessmentId ?? null;
      const resolvedAssessmentId =
        storedAssessmentId ??
        (await resolveCurrentAssessmentId(
          readLocalAssessment()?.versionId ?? null,
        ));
      if (!isActive) return;
      if (resolvedAssessmentId) setAssessmentId(resolvedAssessmentId);

      const restored = await stripeReportPaymentService.restorePurchase({
        reportId,
        assessmentId: resolvedAssessmentId,
      });
      if (!isActive) return;
      const normalized =
        restored.status === "checkout" || restored.status === "payment_pending"
          ? writeReportAccess({ ...restored, status: "preview" })
          : restored;
      setAccess(normalized);
    }

    void reconcileAccess();
    return () => {
      isActive = false;
    };
  }, [reportId]);

  useEffect(() => {
    if (!access || previewTrackedRef.current) return;
    previewTrackedRef.current = true;
    trackEvent("report_preview_viewed", { reportId, isPaid: access.isPaid });
    if (!access.isPaid)
      trackEvent("paywall_viewed", { reportId, productId: offer.productId });
  }, [access, offer.productId, reportId]);

  function markFailed(caught: unknown, retryStep: "checkout" | "confirm") {
    retryStepRef.current = retryStep;
    const base = access ?? createPreviewAccess(reportId);
    setAccess(writeReportAccess({ ...base, status: "payment_failed" }));
    setError(t(checkoutErrorKey(caught)));
    setStage("failed");
    trackEvent("payment_failed", { reportId, productId: offer.productId });
  }

  async function startCheckout() {
    setStage("creating");
    setClientSecret(null);
    setError(null);

    // Fired where the mock flow fired it — the moment the user commits to
    // paying — with the same payload.
    trackEvent("payment_started", {
      reportId,
      productId: offer.productId,
      amountMinor: offer.amountMinor,
      currency: offer.currency,
    });

    try {
      const resolvedAssessmentId =
        assessmentId ??
        (await resolveCurrentAssessmentId(
          readLocalAssessment()?.versionId ?? null,
        ));
      if (!resolvedAssessmentId) {
        throw new ReportPaymentError("forbidden", "assessment_not_found");
      }
      setAssessmentId(resolvedAssessmentId);

      const session = await stripeReportPaymentService.createCheckoutSession({
        reportId,
        assessmentId: resolvedAssessmentId,
        email,
        offer,
      });

      // The server already holds an entitlement for this report. Unlock it
      // rather than opening a second charge.
      if (session.status === "already_owned") {
        await confirmAndUnlock(resolvedAssessmentId, session.provider);
        return;
      }

      setClientSecret(session.clientSecret);
      setStage("ready");
    } catch (caught) {
      markFailed(caught, "checkout");
    }
  }

  async function confirmAndUnlock(
    resolvedAssessmentId: string,
    provider: PaymentProvider,
  ) {
    setStage("confirming");
    setError(null);
    const base = access ?? createPreviewAccess(reportId);
    setAccess(writeReportAccess({ ...base, status: "payment_pending" }));

    try {
      // `confirmPayment` polls `/api/payments/entitlement`. Nothing here
      // unlocks on the browser's say-so: the entitlement row is written by
      // the signed Stripe webhook, and this waits for it to appear.
      const payment = await stripeReportPaymentService.confirmPayment({
        reportId,
        assessmentId: resolvedAssessmentId,
      });
      const unlocked = await stripeReportPaymentService.unlockReport(
        reportId,
        payment.paymentId,
      );
      setAccess(unlocked);
      setStage(null);
      setClientSecret(null);
      trackEvent("payment_succeeded", {
        reportId,
        productId: offer.productId,
        provider,
      });
      trackEvent("report_unlocked", { reportId, productId: offer.productId });
    } catch (caught) {
      markFailed(caught, "confirm");
    }
  }

  function openCheckout() {
    setError(null);
    if (access) setAccess(writeReportAccess({ ...access, status: "checkout" }));
    trackEvent("unlock_cta_clicked", { reportId, productId: offer.productId });
    trackEvent("checkout_opened", { reportId, productId: offer.productId });
    void startCheckout();
  }

  function closeCheckout() {
    // Never while the server is being asked whether the payment landed: the
    // sheet is the only place that outcome is reported.
    if (stage === "confirming") return;
    setStage(null);
    setClientSecret(null);
    if (access) setAccess(writeReportAccess({ ...access, status: "preview" }));
    trackEvent("checkout_closed", { reportId, productId: offer.productId });
  }

  function retryCheckout() {
    setError(null);
    // A payment that completed but was not yet confirmed must not restart
    // checkout — that would charge the customer twice. Ask the server again.
    if (retryStepRef.current === "confirm" && assessmentId) {
      void confirmAndUnlock(assessmentId, "stripe");
      return;
    }
    void startCheckout();
  }

  function handleCheckoutComplete() {
    // Embedded Checkout says the customer finished. That is a reason to ask
    // the server, not an answer.
    if (!assessmentId) {
      markFailed(
        new ReportPaymentError("forbidden", "assessment_not_found"),
        "checkout",
      );
      return;
    }
    void confirmAndUnlock(assessmentId, "stripe");
  }

  if (!access) {
    return <ReportAccessSkeleton />;
  }

  if (access.isPaid || access.status === "unlocked") {
    return (
      <div className="daybreak-reveal flex w-full flex-col gap-5">
        {children}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <LockedReportStory
        report={report}
        offer={offer}
        answeredCount={answeredCount}
        onOpen={openCheckout}
      />

      {stage ? (
        <CheckoutSheet
          offer={offer}
          stage={stage}
          clientSecret={clientSecret}
          error={error}
          onClose={closeCheckout}
          onComplete={handleCheckoutComplete}
          onRetry={retryCheckout}
        />
      ) : null}
    </div>
  );
}

function ReportAccessSkeleton() {
  return (
    <div
      className="grid w-full gap-x-8 gap-y-6 lg:grid-cols-12"
      aria-busy="true"
      aria-label="Loading report access"
    >
      <div className="h-32 animate-pulse rounded-[24px] border border-[color:var(--day-line)] bg-[color:var(--day-card)] lg:col-span-12 lg:h-36" />
      <div className="rounded-story h-72 animate-pulse bg-[#221248]/90 lg:col-span-12 lg:h-[380px]" />
    </div>
  );
}
