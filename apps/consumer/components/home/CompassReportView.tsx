"use client";

import { Download, FileText, RefreshCcw, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CompassReport } from "@/components/assessment/CompassReport";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { CompassCardResult } from "@/components/results/CompassCard";
import { ParentViewModal } from "@/components/results/ParentViewModal";
import { ShareCardModal } from "@/components/results/ShareCardModal";
import { ReportUnlockedNotice } from "@/components/results/report-access/ReportUnlockedNotice";
import { CompassIdentityCard } from "@/components/results/report-access/story/CompassIdentityCard";
import { trackEvent } from "@/lib/analytics/track";
import {
  readLocalAssessment,
  resetLocalAssessment,
} from "@/lib/assessment/progress";
import { getClusterLabel } from "@/lib/results/cluster-visuals";
import {
  buildResultDocument,
  buildResultDocumentFilename,
  openResultDocument,
  type ResultDocumentVariant,
} from "@/lib/results/export-document";
import { getArchetypeKey } from "@/lib/results/report-labels";
import {
  clearResultStorage,
  readResultRegistration,
} from "@/lib/results/storage";
import type { PersonalizedCompassReport } from "@/lib/results/types";

interface CompassReportViewProps {
  report: PersonalizedCompassReport;
  studentName: string;
}

/**
 * The unlocked Compass tab: the identity card, then the complete report in
 * the app's light treatment, with the actions the old results screen had — share the
 * compass card, save the PDF, the parent view, start over.
 */
export function CompassReportView({
  report,
  studentName,
}: CompassReportViewProps) {
  const router = useRouter();
  const { locale, t } = useLocale();
  const [shareStatus, setShareStatus] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareCard, setShareCard] = useState<CompassCardResult | null>(null);
  const [parentViewOpen, setParentViewOpen] = useState(false);
  const [savingVariant, setSavingVariant] =
    useState<ResultDocumentVariant | null>(null);
  const [saveStatus, setSaveStatus] = useState("");
  const actionSentinelRef = useRef<HTMLDivElement>(null);
  const [hasPassedIdentity, setHasPassedIdentity] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  function handleStartOver() {
    resetLocalAssessment();
    clearResultStorage();
    router.push("/start");
  }

  /** Mints (or reuses) a public /share/[token] link for this report — the
   *  URL is meaningless to a third party without it, since this tab reads
   *  from this device's localStorage. Cached in state so repeat clicks
   *  don't re-hit the API. */
  async function ensureShareUrl(): Promise<string | null> {
    if (shareUrl) return shareUrl;

    try {
      const registration = readResultRegistration();
      const progress = readLocalAssessment();
      const response = await fetch("/api/assessments/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report,
          name: registration?.name,
          versionId: progress?.versionId,
          versionLabel: progress?.versionLabel,
        }),
      });
      if (!response.ok) return null;
      const data = (await response.json()) as { url?: unknown };
      if (typeof data.url !== "string") return null;
      setShareUrl(data.url);
      return data.url;
    } catch {
      return null;
    }
  }

  /** Opens the animated CompassCard over the tab — the actual share action
   *  (native share sheet with the exported PNG + link, or the download+copy
   *  fallback) lives in ShareCardModal. */
  async function handleShare() {
    const registration = readResultRegistration();
    if (!registration) return;

    setSharing(true);
    const url = await ensureShareUrl();
    setSharing(false);

    if (!url) {
      setShareStatus(t("share.link_error"));
      return;
    }

    setShareStatus("");
    setShareCard({
      name: registration.name,
      clusterCode: report.clusterCode,
      archetype: report.archetype,
      driverCode: report.score.primaryDriver,
      ecosystemFit: report.ecosystemFit,
    });
  }

  function handleSave(variant: ResultDocumentVariant) {
    if (!studentName) return;

    setSavingVariant(variant);
    setSaveStatus("");

    try {
      const html = buildResultDocument({
        report,
        name: studentName,
        locale,
        variant,
      });
      const method = openResultDocument(
        html,
        buildResultDocumentFilename(studentName, variant),
      );

      trackEvent("results_downloaded", {
        assessmentId: readLocalAssessment()?.assessmentId,
        method: `${variant}_${method}`,
      });
      if (variant === "full") {
        trackEvent("pdf_downloaded", {
          assessmentId: readLocalAssessment()?.assessmentId,
          method,
        });
      }
      setSaveStatus(
        method === "print"
          ? t("results.save.print_ready")
          : t("results.save.downloaded"),
      );
    } catch {
      setSaveStatus(t("results.save.error"));
    } finally {
      setSavingVariant(null);
    }
  }

  const status = shareStatus || (!parentViewOpen ? saveStatus : "");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const sentinel = actionSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(([entry]) => {
      setHasPassedIdentity(!entry.isIntersecting);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const showQuickActions = hasPassedIdentity;

  return (
    <>
      <header className="flex items-start justify-between gap-5 pt-1 lg:pt-2">
        <div>
          <h1 className="daybreak-heading text-[30px] leading-tight text-[color:var(--day-ink)] lg:text-[38px]">
            {t("home.compass.title")}
          </h1>
          <p className="mt-1 max-w-[58ch] text-[13px] leading-relaxed text-[color:var(--day-ink-2)] lg:text-[15px]">
            {t("home.compass.subtitle")}
          </p>
        </div>
        <div className="hidden max-w-[58%] shrink-0 flex-wrap justify-end gap-2 lg:flex">
          <button
            type="button"
            onClick={handleShare}
            className="daybreak-primary-action"
            disabled={sharing}
          >
            <Share2 size={16} aria-hidden="true" />
            {sharing ? t("share.generating") : t("results.action.share")}
          </button>
          <button
            type="button"
            onClick={() => handleSave("full")}
            className="daybreak-secondary-action"
            disabled={savingVariant === "full"}
          >
            <Download size={15} aria-hidden="true" />
            {savingVariant === "full"
              ? t("results.save.preparing")
              : t("results.action.save")}
          </button>
          <button
            type="button"
            onClick={() => {
              setSaveStatus("");
              setParentViewOpen(true);
            }}
            className="daybreak-secondary-action"
          >
            <FileText size={15} aria-hidden="true" />
            {t("results.action.parent_view")}
          </button>
          <button
            type="button"
            onClick={handleStartOver}
            className="daybreak-secondary-action"
          >
            <RefreshCcw size={15} aria-hidden="true" />
            {t("results.action.start_over")}
          </button>
        </div>
      </header>

      <ReportUnlockedNotice />

      <CompassIdentityCard report={report} />
      <div ref={actionSentinelRef} aria-hidden="true" />

      <CompassReport report={report} kaiHref="/kai?goal=explain_results" />

      {isMounted
        ? createPortal(
            <div
              className={`pointer-events-none fixed inset-x-4 bottom-24 z-50 transition-all duration-200 lg:hidden ${showQuickActions ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
              aria-hidden={!showQuickActions}
              style={{
                "--day-line": "rgba(43, 36, 28, 0.1)",
                "--day-card": "#fffcf6",
                "--day-ink-2": "#5c5142",
              } as React.CSSProperties}
            >
              <div className="pointer-events-auto mx-auto flex max-w-[440px] gap-2 rounded-[22px] border border-[color:var(--day-line)] bg-[color:var(--day-card)] p-2 shadow-[0_16px_36px_rgba(42,33,24,0.16)]">
                <button
                  type="button"
                  onClick={handleShare}
                  className="daybreak-primary-action min-w-0 flex-1"
                  disabled={sharing}
                  tabIndex={showQuickActions ? undefined : -1}
                >
                  <Share2 size={16} aria-hidden="true" />
                  <span className="truncate">
                    {sharing ? t("share.generating") : t("results.action.share")}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSave("full")}
                  className="daybreak-secondary-action min-w-0 flex-1"
                  disabled={savingVariant === "full"}
                  tabIndex={showQuickActions ? undefined : -1}
                >
                  <Download size={15} aria-hidden="true" />
                  <span className="truncate">
                    {savingVariant === "full"
                      ? t("results.save.preparing")
                      : t("results.action.save")}
                  </span>
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}

      {status ? (
        <p
          aria-live="polite"
          className="text-center text-[11px] font-semibold text-[color:var(--day-ink-3)]"
        >
          {status}
        </p>
      ) : null}

      <p className="text-center text-[11px] leading-snug text-[color:var(--day-ink-3)]">
        {report.source !== "fallback"
          ? t("results.footer.generated_with").replace(
              "{model}",
              report.model ?? "Gemini",
            )
          : t("results.footer.fallback").replace(
              "{reason}",
              report.fallbackReason ?? "",
            )}
      </p>

      {shareCard ? (
        <ShareCardModal
          result={shareCard}
          shareUrl={shareUrl}
          shareText={t("results.share.text")
            .replace("{cluster}", getClusterLabel(report.clusterCode, t))
            .replace("{archetype}", t(getArchetypeKey(report.archetype)))
            .replace("{driver}", report.primaryDriver)}
          assessmentId={readLocalAssessment()?.assessmentId}
          onClose={() => setShareCard(null)}
        />
      ) : null}

      {parentViewOpen ? (
        <ParentViewModal
          report={report}
          studentName={studentName}
          saveStatus={saveStatus}
          saving={savingVariant === "parent"}
          onSave={() => handleSave("parent")}
          onClose={() => setParentViewOpen(false)}
        />
      ) : null}
    </>
  );
}
