"use client";

import { Download, FileText, RefreshCcw, Share2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { ReportBody } from "@/components/assessment/report-parts";
import { trackEvent } from "@/lib/analytics/track";
import { readLocalAssessment, resetLocalAssessment } from "@/lib/assessment/progress";
import { getClusterLabel } from "@/lib/results/cluster-visuals";
import { getArchetypeKey } from "@/lib/results/report-labels";
import {
  clearResultStorage,
  readGeneratedReport,
  readResultRegistration,
} from "@/lib/results/storage";
import type { PersonalizedCompassReport } from "@/lib/results/types";

export function ResultsScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const [report, setReport] = useState<PersonalizedCompassReport | null>(null);
  const [shareStatus, setShareStatus] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const registration = readResultRegistration();
    const storedReport = readGeneratedReport();

    if (!registration) {
      router.replace("/register");
      return;
    }

    if (!storedReport) {
      router.replace("/analyzing");
      return;
    }

    setReport(storedReport);
    trackEvent("results_viewed", {
      assessmentId: readLocalAssessment()?.assessmentId,
    });
  }, [router]);

  function handleStartOver() {
    resetLocalAssessment();
    clearResultStorage();
    router.push("/start");
  }

  /** Mints (or reuses) a public /share/[token] link for this report — the
   *  URL is meaningless to a third party without it, since /results itself
   *  reads from this device's localStorage. Cached in state so repeat clicks
   *  don't re-hit the API. */
  async function ensureShareUrl(): Promise<string | null> {
    if (shareUrl) return shareUrl;
    if (!report) return null;

    try {
      const registration = readResultRegistration();
      const response = await fetch("/api/assessments/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, name: registration?.name }),
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

  async function handleShare() {
    if (!report) return;

    const shareText = t("results.share.text")
      .replace("{cluster}", getClusterLabel(report.clusterCode, t))
      .replace("{archetype}", t(getArchetypeKey(report.archetype)))
      .replace("{driver}", report.primaryDriver);
    const assessmentId = readLocalAssessment()?.assessmentId;

    setSharing(true);
    const url = await ensureShareUrl();
    setSharing(false);

    if (!url) {
      setShareStatus(t("share.link_error"));
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Tareeq Career Compass",
          text: shareText,
          url,
        });
        setShareStatus(t("results.share.shared"));
        trackEvent("results_shared", { assessmentId, method: "native_share" });
        return;
      }

      await navigator.clipboard.writeText(`${shareText}\n${url}`);
      setShareStatus(t("results.share.copied"));
      trackEvent("results_shared", { assessmentId, method: "clipboard" });
    } catch {
      setShareStatus(t("results.share.cancelled"));
    }
  }

  function handleDownloadView() {
    trackEvent("results_downloaded", {
      assessmentId: readLocalAssessment()?.assessmentId,
      method: "print",
    });
    window.print();
  }

  if (!report) return null;

  return (
    <section className="anim-screen-enter flex flex-1 flex-col gap-4 pb-2">
      <ReportBody report={report} t={t} />

      <div className="grid gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="btn-v2 btn-v2--primary w-full"
          data-size="lg"
          disabled={sharing}
        >
          <Share2 size={18} />
          {sharing ? t("share.generating") : t("results.action.share")}
        </button>
        <a href="/you" className="btn-v2 btn-v2--ghost-on-dark w-full" data-size="md">
          <Sparkles size={16} />
          {t("results.action.view_profile")}
        </a>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleDownloadView}
            className="btn-v2 btn-v2--ghost-on-dark w-full"
            data-size="md"
          >
            <Download size={16} />
            {t("results.action.save")}
          </button>
          <button
            type="button"
            onClick={handleDownloadView}
            className="btn-v2 btn-v2--ghost-on-dark w-full"
            data-size="md"
          >
            <FileText size={16} />
            {t("results.action.parent_view")}
          </button>
        </div>
        <button
          type="button"
          onClick={handleStartOver}
          className="btn-v2 btn-v2--ghost-on-dark w-full"
          data-size="md"
        >
          <RefreshCcw size={16} />
          {t("results.action.start_over")}
        </button>
        {shareStatus ? (
          <p className="text-center text-[11px] font-semibold text-sand/55">{shareStatus}</p>
        ) : null}
      </div>

      <p className="text-center text-[11px] leading-snug text-sand/38">
        {report.source === "claude"
          ? t("results.footer.generated_with").replace("{model}", report.model ?? "Claude")
          : t("results.footer.fallback").replace("{reason}", report.fallbackReason ?? "")}
      </p>
    </section>
  );
}
