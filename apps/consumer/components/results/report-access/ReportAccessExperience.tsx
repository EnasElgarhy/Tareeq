"use client";

import {
  ArrowRight,
  Check,
  LockSimple,
  ShieldCheck,
} from "@phosphor-icons/react";
import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AcademicIcon,
  ArchetypeIcon,
  CareerIcon,
  CompassResultIcon,
  DriverIcon,
  EcosystemIcon,
  NextStepsIcon,
  PathForwardIcon,
  RealityIcon,
} from "@/components/brand/ResultIcons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  CheckoutSheet,
  type CheckoutStage,
} from "@/components/results/report-access/CheckoutSheet";
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
import { getClusterLabel } from "@/lib/results/cluster-visuals";
import { resolveCurrentAssessmentId } from "@/lib/results/assessment-identity";
import { readResultRegistration } from "@/lib/results/storage";
import {
  getArchetypeKey,
  getEcosystemFitKey,
} from "@/lib/results/report-labels";
import type { PersonalizedCompassReport } from "@/lib/results/types";

interface ReportAccessExperienceProps {
  report: PersonalizedCompassReport;
  email: string;
  children: ReactNode;
}

const lockedSectionKeys: StringKey[] = [
  "paywall.locked.personality",
  "paywall.locked.decisions",
  "paywall.locked.environments",
  "paywall.locked.careers",
  "paywall.locked.drainers",
  "paywall.locked.growth",
  "paywall.locked.skills",
  "paywall.locked.action_plan",
  "paywall.locked.pdf",
];

const featuredBenefits: Array<{ key: StringKey; icon: typeof ArchetypeIcon }> =
  [
    { key: "paywall.benefit.analysis", icon: ArchetypeIcon },
    { key: "paywall.benefit.careers", icon: CareerIcon },
    { key: "paywall.benefit.environments", icon: EcosystemIcon },
    { key: "paywall.benefit.advice", icon: NextStepsIcon },
  ];

const chapterIcons = [
  ArchetypeIcon,
  DriverIcon,
  EcosystemIcon,
  CareerIcon,
  RealityIcon,
  PathForwardIcon,
  AcademicIcon,
  NextStepsIcon,
  CompassResultIcon,
] as const;

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

export function ReportAccessExperience({
  report,
  email,
  children,
}: ReportAccessExperienceProps) {
  const { locale, t } = useLocale();
  const reportId = useMemo(
    () => reportIdFromGeneratedAt(report.generatedAt),
    [report.generatedAt],
  );
  const offer = useMemo(getReportOffer, []);
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
  const paywallRef = useRef<HTMLDivElement>(null);

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
      <div className="anim-screen-enter mx-auto w-full max-w-[860px]">
        <PaymentSuccessState />
        {children}
      </div>
    );
  }

  const price = new Intl.NumberFormat(locale === "ar" ? "ar" : "en", {
    style: "currency",
    currency: offer.currency,
  }).format(offer.amountMinor / 100);
  const coreSignals = [
    {
      letter: "C",
      label: t("results.core.curiosities_label"),
      value: getClusterLabel(report.clusterCode, t),
      icon: CompassResultIcon,
    },
    {
      letter: "O",
      label: t("results.core.operations_label"),
      value: t(getArchetypeKey(report.archetype)),
      icon: ArchetypeIcon,
    },
    {
      letter: "R",
      label: t("results.core.rewards_label"),
      value: report.primaryDriver,
      icon: DriverIcon,
    },
    {
      letter: "E",
      label: t("results.core.ecosystems_label"),
      value: t(getEcosystemFitKey(report.ecosystemFit)),
      icon: EcosystemIcon,
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[1140px] pb-24 sm:pb-8">
      <div className="grid lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-stretch">
        <header className="relative isolate overflow-hidden rounded-[28px] border border-sand/12 bg-night shadow-[0_28px_90px_rgba(0,0,0,0.42)] lg:rounded-[28px] lg:rounded-e-none lg:border-e-0">
          <div className="relative aspect-[4/5] w-full md:aspect-[16/10] lg:h-full lg:min-h-[610px] lg:aspect-auto">
            <Image
              src="/illustrations/report-map-reveal-v1.webp"
              alt={t("paywall.preview.illustration_alt")}
              fill
              priority
              unoptimized
              sizes="(max-width: 767px) 100vw, (max-width: 1023px) 820px, 620px"
              className="object-cover object-[center_58%] md:object-[center_52%] lg:object-[center_50%]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-night/30 via-transparent to-night" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-5 sm:p-7">
              <span className="rounded-full border border-sand/15 bg-night/55 px-3 py-2 text-[10px] font-bold text-sand backdrop-blur-md">
                {t("paywall.preview.label")}
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-mint">
                <Check size={12} weight="bold" aria-hidden="true" />
                {t("paywall.preview.ready")}
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
              <p className="text-[11px] font-bold text-gold">
                {t("paywall.preview.reveal_label")}
              </p>
              <h1 className="mt-2 max-w-[13ch] font-heading text-[38px] font-black leading-[1.02] text-sand sm:text-[54px]">
                {report.headline}
              </h1>
            </div>
          </div>
        </header>

        <section className="relative z-10 -mt-1 overflow-hidden rounded-b-[28px] rounded-t-[10px] border border-carbon/8 bg-sand px-5 py-7 text-carbon shadow-[0_22px_60px_rgba(0,0,0,0.22)] sm:px-8 sm:py-9 lg:mt-0 lg:flex lg:flex-col lg:rounded-[28px] lg:rounded-s-none lg:border-s-0 lg:px-7">
          <p className="max-w-[64ch] text-[15px] leading-7 text-carbon/72 sm:text-[16px]">
            {report.summary}
          </p>

          <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-[18px] border border-carbon/10 bg-carbon/10 md:grid-cols-4 lg:grid-cols-2">
            {coreSignals.map((signal) => {
              const SignalIcon = signal.icon;
              return (
                <article key={signal.letter} className="min-w-0 bg-paper p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="grid size-9 place-items-center rounded-[12px] bg-carbon text-sand">
                      <SignalIcon size={20} />
                    </span>
                    <span className="font-heading text-[22px] font-black text-violet/30">
                      {signal.letter}
                    </span>
                  </div>
                  <p className="mt-3 text-[9px] font-bold text-carbon/45">
                    {signal.label}
                  </p>
                  <p className="mt-1 break-words text-[12px] font-bold leading-snug text-carbon">
                    {signal.value}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-8 grid gap-4 border-t border-carbon/10 pt-7 sm:grid-cols-[auto_minmax(0,1fr)] lg:mt-auto">
            <span className="grid size-12 place-items-center rounded-[16px] bg-violet text-sand shadow-[0_10px_24px_rgba(110,72,228,0.25)]">
              <PathForwardIcon size={25} />
            </span>
            <div>
              <p className="text-[10px] font-bold text-violet">
                {t("paywall.preview.direction_label")}
              </p>
              <h2 className="mt-1 font-heading text-[24px] font-bold leading-tight text-carbon">
                {getClusterLabel(report.clusterCode, t)}
              </h2>
              <p className="mt-3 line-clamp-4 text-[13px] leading-6 text-carbon/65">
                {report.careerLandscape}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(370px,0.72fr)] xl:items-start xl:gap-5">
        <section className="relative overflow-hidden rounded-[28px] border border-sand/10 bg-midnight px-5 py-7 sm:px-8 sm:py-9 xl:min-h-[760px]">
          <div
            className="absolute -right-16 top-8 size-48 rounded-full border border-violet-soft/10"
            aria-hidden="true"
          />
          <p className="text-[10px] font-bold text-gold">
            {t("paywall.locked.map_label")}
          </p>
          <h2 className="mt-2 font-heading text-[30px] font-bold leading-tight text-sand">
            {t("paywall.locked.title")}
          </h2>
          <p className="mt-2 max-w-[54ch] text-[13px] leading-6 text-sand/56">
            {t("paywall.locked.subtitle")}
          </p>

          <div
            className="relative mt-7"
            aria-label={t("paywall.locked.accessible")}
          >
            <span
              className="absolute bottom-4 start-[19px] top-4 w-px bg-gradient-to-b from-gold via-violet-soft/50 to-transparent"
              aria-hidden="true"
            />
            <div className="grid gap-1">
              {lockedSectionKeys.map((key, index) => (
                <LockedReportSection
                  key={key}
                  title={t(key)}
                  index={index}
                  preview={index === 0 ? report.integration : undefined}
                />
              ))}
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-b from-transparent via-midnight/88 to-midnight" />
        </section>

        <div
          ref={paywallRef}
          className="relative z-10 -mt-16 overflow-hidden rounded-[28px] border border-gold/22 bg-[#130d2b] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.48)] sm:p-8 xl:sticky xl:top-4 xl:mt-0 xl:p-7"
        >
          <div
            className="absolute -right-20 -top-20 size-56 rounded-full border border-gold/10"
            aria-hidden="true"
          />
          <div
            className="absolute -right-10 -top-10 size-36 rounded-full border border-violet-soft/14"
            aria-hidden="true"
          />
          <div className="relative max-w-[650px]">
            <p className="text-[10px] font-bold text-gold">
              {t("paywall.product")}
            </p>
            <h2 className="mt-3 max-w-[20ch] font-heading text-[31px] font-black leading-[1.08] text-sand sm:text-[40px] xl:text-[34px]">
              {t("paywall.title")}
            </h2>
            <p className="mt-4 max-w-[58ch] text-[13px] leading-6 text-sand/62">
              {t("paywall.description")}
            </p>
          </div>

          <div className="relative mt-7 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 xl:grid-cols-2">
            {featuredBenefits.map(({ key, icon: BenefitIcon }) => {
              return (
                <div key={key} className="min-w-0">
                  <span className="grid size-10 place-items-center rounded-[14px] border border-sand/10 bg-sand/[0.06]">
                    <BenefitIcon size={21} />
                  </span>
                  <p className="mt-2 text-[11px] font-semibold leading-5 text-sand/72">
                    {t(key)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="relative mt-8 border-t border-sand/10 pt-6 md:flex md:items-end md:justify-between md:gap-6 xl:block">
            <div>
              <p className="text-[10px] font-semibold text-sand/45">
                {t("paywall.complete_report")}
              </p>
              <p className="mt-1 text-[27px] font-black text-sand">
                {t("paywall.price").replace("{price}", price)}
              </p>
            </div>
            <button
              type="button"
              className="btn-v2 btn-v2--primary mt-4 w-full md:mt-0 md:w-auto xl:mt-4 xl:w-full"
              data-size="lg"
              onClick={openCheckout}
            >
              {t("paywall.cta")}
              <ArrowRight
                size={16}
                weight="bold"
                className="flip-rtl"
                aria-hidden="true"
              />
            </button>
          </div>

          <div className="relative mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-medium text-sand/44">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} aria-hidden="true" />
              {t("paywall.reassurance")}
            </span>
            <span>{t("paywall.saved")}</span>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sand/10 bg-night/96 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-lg sm:hidden">
        <div className="mx-auto flex max-w-[480px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-sand/52">
              {t("paywall.complete_report")}
            </p>
            <p className="text-[15px] font-bold text-sand">{price}</p>
          </div>
          <button
            type="button"
            className="btn-v2 btn-v2--primary"
            data-size="sm"
            onClick={openCheckout}
          >
            {t("paywall.cta.short")}
          </button>
        </div>
      </div>

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

function LockedReportSection({
  title,
  index,
  preview,
}: {
  title: string;
  index: number;
  preview?: string;
}) {
  const ChapterIcon = chapterIcons[index] ?? CompassResultIcon;
  const opacity = Math.max(0.38, 1 - index * 0.07);

  return (
    <article
      className="relative flex min-h-[76px] items-start gap-4 py-3"
      style={{ opacity }}
    >
      <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-[13px] border border-sand/12 bg-[#1c1437] shadow-[0_8px_20px_rgba(0,0,0,0.22)]">
        <ChapterIcon size={21} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-semibold leading-5 text-sand/78">
            {title}
          </h3>
          <LockSimple
            size={12}
            weight="duotone"
            className="shrink-0 text-violet-soft/75"
            aria-hidden="true"
          />
        </div>
        {preview ? (
          <p className="mt-1.5 line-clamp-2 max-w-[62ch] text-[11px] leading-5 text-sand/38">
            {preview}
          </p>
        ) : (
          <span
            className="mt-2 block h-1.5 w-[min(72%,22rem)] rounded-full bg-sand/[0.055]"
            aria-hidden="true"
          />
        )}
      </div>
    </article>
  );
}

function ReportAccessSkeleton() {
  return (
    <div
      className="mx-auto grid w-full max-w-[1140px] gap-3 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]"
      aria-busy="true"
      aria-label="Loading report access"
    >
      <div className="h-80 animate-pulse rounded-[20px] border border-sand/8 bg-sand/[0.04] lg:h-[610px]" />
      <div className="h-56 animate-pulse rounded-[20px] border border-sand/8 bg-sand/[0.04] lg:h-[610px]" />
    </div>
  );
}

function PaymentSuccessState() {
  const { t } = useLocale();
  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-3 rounded-[16px] border border-mint/22 bg-mint/[0.08] p-4"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mint/15 text-mint">
        <Check size={17} weight="bold" aria-hidden="true" />
      </span>
      <div>
        <p className="text-[14px] font-bold text-sand">
          {t("paywall.success")}
        </p>
        <p className="mt-1 text-[12px] leading-5 text-sand/58">
          {t("paywall.success.description")}
        </p>
      </div>
    </div>
  );
}
