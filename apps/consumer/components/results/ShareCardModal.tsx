"use client";

import { Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { CompassCard, type CompassCardResult } from "@/components/results/CompassCard";
import { trackEvent } from "@/lib/analytics/track";

interface ShareCardModalProps {
  result: CompassCardResult;
  shareUrl: string | null;
  shareText: string;
  assessmentId?: string;
  onClose(): void;
}

// Reference card is 360×640 (see CompassCard.tsx) — scaled down 2/3 so it
// comfortably fits inside the dialog down to a 320px-wide viewport.
const CARD_SCALE = 2 / 3;
const CARD_WIDTH = 360 * CARD_SCALE;
const CARD_HEIGHT = 640 * CARD_SCALE;
// ImageResponse marks generated PNGs immutable for a year. Bump this when
// rendering changes so clients do not reuse an older card from browser cache.
const SHARE_CARD_RENDER_VERSION = "2";

/**
 * Opens the animated CompassCard over the results screen with a single
 * share action below it. That action hands the OS's native share sheet
 * both the rendered PNG (via app/api/results/share-card) and the public
 * /share/[token] link together — "Add to Story", "Send to…", AirDrop, etc.
 * all show up for free through navigator.share's file support. Browsers
 * without file-sharing support (desktop Safari/Firefox, most desktop
 * Chrome) fall back to downloading the PNG and copying the link.
 */
export function ShareCardModal({
  result,
  shareUrl,
  shareText,
  assessmentId,
  onClose,
}: ShareCardModalProps) {
  const { t, locale } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<"idle" | "preparing" | "shared" | "saved" | "error">("idle");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  async function handleShare() {
    setStatus("preparing");
    try {
      const params = new URLSearchParams({
        name: result.name,
        cluster: result.clusterCode,
        archetype: result.archetype,
        driver: result.driverCode,
        ecosystem: result.ecosystemFit,
        locale,
        v: SHARE_CARD_RENDER_VERSION,
      });
      const response = await fetch(`/api/results/share-card?${params.toString()}`);
      if (!response.ok) throw new Error("share-card export failed");
      const blob = await response.blob();
      const file = new File([blob], "tareeq-compass.png", { type: "image/png" });

      const shareData: ShareData = {
        title: "Tareeq Career Compass",
        text: shareText,
        url: shareUrl ?? undefined,
        files: [file],
      };

      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        setStatus("shared");
        trackEvent("results_shared", { assessmentId, method: "native_share_image" });
        return;
      }

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "tareeq-compass.png";
      link.click();
      URL.revokeObjectURL(blobUrl);
      if (shareUrl) await navigator.clipboard.writeText(shareUrl);
      setStatus("saved");
      trackEvent("results_shared", { assessmentId, method: "image_download" });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("idle");
        return;
      }
      setStatus("error");
    }
  }

  if (!mounted) return null;

  const overlay = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t("share_card.modal.close_aria")}
        onClick={onClose}
        className="anim-backdrop-fade absolute inset-0 cursor-default"
        style={{
          background: "rgba(8, 5, 26, 0.72)",
          backdropFilter: "blur(10px) saturate(120%)",
          WebkitBackdropFilter: "blur(10px) saturate(120%)",
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="anim-sheet-up relative flex max-h-[calc(100dvh-32px)] w-full max-w-[380px] flex-col items-center gap-5 overflow-y-auto rounded-[28px] px-5 pb-6 pt-5 text-sand"
        style={{
          background: "linear-gradient(180deg, #221248 0%, #100A24 60%, #08051A 100%)",
          boxShadow: "0 -24px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(245,238,230,0.10)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="glass-tile absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-full text-sand/80 transition hover:text-sand"
          aria-label={t("share_card.modal.close_aria")}
        >
          <X size={16} />
        </button>

        <div
          className="anim-avatar-in relative overflow-hidden rounded-[20px]"
          style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
        >
          {/* Absolute + explicit left/top anchors this regardless of the
           *  page's dir="rtl" — a static-flow block child would otherwise
           *  hug the inline-start edge, which flips to the right under RTL
           *  and clips the wrong side of the scaled-down card. */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 360,
              height: 640,
              transform: `scale(${CARD_SCALE})`,
              transformOrigin: "top left",
            }}
          >
            <CompassCard result={result} />
          </div>
        </div>

        <div className="grid w-full gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="btn-v2 btn-v2--primary w-full"
            data-size="lg"
            disabled={status === "preparing"}
          >
            <Share2 size={18} />
            {status === "preparing" ? t("share_card.modal.preparing") : t("share_card.modal.share_cta")}
          </button>
          {status === "shared" ? (
            <p className="text-center text-[11px] font-semibold text-sand/55">
              {t("share_card.modal.shared_status")}
            </p>
          ) : null}
          {status === "saved" ? (
            <p className="text-center text-[11px] font-semibold text-sand/55">
              {t("share_card.modal.saved_status")}
            </p>
          ) : null}
          {status === "error" ? (
            <p className="text-center text-[11px] font-semibold text-sand/55">
              {t("share_card.modal.error_status")}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
