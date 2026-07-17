"use client";

import { Download, FileText, RefreshCcw, Share2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { ReportBody } from "@/components/assessment/report-parts";
import type { CompassCardResult } from "@/components/results/CompassCard";
import { ParentViewModal } from "@/components/results/ParentViewModal";
import { ShareCardModal } from "@/components/results/ShareCardModal";
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
  readGeneratedReport,
  readResultRegistration,
} from "@/lib/results/storage";
import type { PersonalizedCompassReport } from "@/lib/results/types";

export function ResultsScreen() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const [report, setReport] = useState<PersonalizedCompassReport | null>(null);
  const [studentName, setStudentName] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareCard, setShareCard] = useState<CompassCardResult | null>(null);
  const [parentViewOpen, setParentViewOpen] = useState(false);
  const [savingVariant, setSavingVariant] =
    useState<ResultDocumentVariant | null>(null);
  const [saveStatus, setSaveStatus] = useState("");

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

    setStudentName(registration.name);
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

  /** Opens the animated CompassCard over the results screen — the actual
   *  share action (native share sheet with the exported PNG + link, or the
   *  download+copy fallback) lives in ShareCardModal. */
  async function handleShare() {
    if (!report) return;
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
    if (!report || !studentName) return;

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
        <a
          href="/you"
          className="btn-v2 btn-v2--ghost-on-dark w-full"
          data-size="md"
        >
          <Sparkles size={16} />
          {t("results.action.view_profile")}
        </a>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleSave("full")}
            className="btn-v2 btn-v2--ghost-on-dark w-full"
            data-size="md"
            disabled={savingVariant === "full"}
          >
            <Download size={16} />
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
          <p className="text-center text-[11px] font-semibold text-sand/55">
            {shareStatus}
          </p>
        ) : null}
        {!parentViewOpen && saveStatus ? (
          <p
            aria-live="polite"
            className="text-center text-[11px] font-semibold text-sand/55"
          >
            {saveStatus}
          </p>
        ) : null}
      </div>

      <p className="text-center text-[11px] leading-snug text-sand/38">
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
    </section>
  );
}
