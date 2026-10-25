"use client";

import { Check, Copy, LockKeyholeOpen, Loader2, MessageCircle, Share2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { fill } from "@/components/results/report-access/story/story-data";
import { trackEvent } from "@/lib/analytics/track";
import type { StringKey } from "@/lib/i18n/strings";
import styles from "./AskParent.module.css";

/**
 * Ask-a-parent, student side: the sheet that mints and shares a private
 * `/pay/<token>` link, and the waiting card shown until the parent pays.
 * Server side: app/api/payments/parent-link/route.ts.
 */

export type ParentLinkState = "pending" | "paid" | "revoked" | "expired";

export interface ParentLinkStatus {
  state: ParentLinkState;
  createdAt: string;
  expiresAt: string;
  openedAt: string | null;
  paidAt: string | null;
}

interface StoredLink {
  url: string;
  expiresAt: string;
}

const POLL_MS = 5000;

/** The link URL only exists in the response that minted it; keep it to resend. */
function storageKey(assessmentId: string) {
  return `mmc.parentLink.${assessmentId}`;
}
function readStoredLink(assessmentId: string): StoredLink | null {
  try {
    const raw = window.localStorage.getItem(storageKey(assessmentId));
    const parsed = raw ? (JSON.parse(raw) as StoredLink) : null;
    if (!parsed?.url || new Date(parsed.expiresAt).getTime() <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}
function writeStoredLink(assessmentId: string, link: StoredLink) {
  try {
    window.localStorage.setItem(storageKey(assessmentId), JSON.stringify(link));
  } catch {
    // Private mode: resending will simply mint a new link.
  }
}

/** The newest link's state, polled while a link is out. `null` = none sent. */
export function useParentLink(assessmentId: string | null, onPaid: () => void) {
  const [status, setStatus] = useState<ParentLinkStatus | null>(null);
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  const refresh = useCallback(async () => {
    if (!assessmentId) return;
    try {
      const response = await fetch(
        `/api/payments/parent-link?assessmentId=${encodeURIComponent(assessmentId)}`,
        { cache: "no-store" },
      );
      if (!response.ok) return;
      const body = (await response.json()) as { link: ParentLinkStatus | null };
      setStatus(body.link);
      if (body.link?.state === "paid") onPaidRef.current();
    } catch {
      // Offline for a moment: the next poll tries again.
    }
  }, [assessmentId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isWaiting = status?.state === "pending";
  useEffect(() => {
    if (!isWaiting) return;
    const timer = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [isWaiting, refresh]);

  return { status, setStatus, refresh };
}

interface AskParentSheetProps {
  assessmentId: string;
  price: string;
  /** Reuse the last link instead of minting a new one (Send it again). */
  reuse: boolean;
  onClose(): void;
  onSent(status: ParentLinkStatus): void;
}

type SheetState =
  | { name: "creating" }
  | { name: "ready"; url: string }
  | { name: "error"; message: StringKey };

export function AskParentSheet({ assessmentId, price, reuse, onClose, onSent }: AskParentSheetProps) {
  const { t, locale, dir } = useLocale();
  const [sheet, setSheet] = useState<SheetState>({ name: "creating" });
  const [lang, setLang] = useState<"en" | "ar">(locale === "ar" ? "ar" : "en");
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const create = useCallback(async () => {
    setSheet({ name: "creating" });
    const stored = reuse ? readStoredLink(assessmentId) : null;
    if (stored) {
      setSheet({ name: "ready", url: stored.url });
      return;
    }
    try {
      const response = await fetch("/api/payments/parent-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assessmentId }),
      });
      const body = (await response.json().catch(() => ({}))) as Partial<ParentLinkStatus> & {
        url?: string;
      };
      if (response.status === 429) {
        setSheet({ name: "error", message: "unlock.ask.error.limit" });
        return;
      }
      if (!response.ok || !body.url || !body.expiresAt) throw new Error("parent_link_failed");
      writeStoredLink(assessmentId, { url: body.url, expiresAt: body.expiresAt });
      setSheet({ name: "ready", url: body.url });
      trackEvent("parent_link_created", { assessmentId });
      onSent({
        state: "pending",
        createdAt: body.createdAt ?? new Date().toISOString(),
        expiresAt: body.expiresAt,
        openedAt: null,
        paidAt: null,
      });
    } catch {
      setSheet({ name: "error", message: "unlock.ask.error" });
    }
  }, [assessmentId, onSent, reuse]);

  useEffect(() => {
    void create();
  }, [create]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const message = fill(t(lang === "ar" ? "unlock.ask.message.ar" : "unlock.ask.message.en"), { price });
  const url = sheet.name === "ready" ? sheet.url : "";
  const fullText = `${message}\n${url}`;

  function shared(channel: string) {
    trackEvent("parent_link_shared", { assessmentId, channel });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      shared("copy");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the link stays visible to copy by hand.
    }
  }

  async function shareMore() {
    try {
      await navigator.share({ text: message, url });
      shared("share");
    } catch {
      // Dismissed share sheet.
    }
  }

  // Portalled to <body> so no app-shell stacking context (the tab bar)
  // can sit above it.
  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ask-parent-title"
        dir={dir}
        className={`surface-day ${styles.sheet} ${locale === "ar" ? "font-arabic" : ""}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.sheetHead}>
          <h2 id="ask-parent-title" className="daybreak-heading">
            {t("unlock.ask.title")}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label={t("unlock.ask.close")}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <p className={styles.sheetBody}>{t("unlock.ask.body")}</p>

        <div className={styles.messageHead}>
          <span>{t("unlock.ask.message_label")}</span>
          <span className={styles.langToggle} role="group">
            {(["en", "ar"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={lang === option}
                onClick={() => setLang(option)}
                lang={option}
              >
                {option === "en" ? "EN" : "عربي"}
              </button>
            ))}
          </span>
        </div>
        <div className={styles.bubble} dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
          <p>{message}</p>
          <p className={styles.bubbleLink}>
            {sheet.name === "ready" ? url.replace(/^https?:\/\//, "") : t("unlock.ask.creating")}
          </p>
        </div>

        {sheet.name === "error" ? (
          <div role="alert" className={styles.error}>
            <p>{t(sheet.message)}</p>
            <button type="button" onClick={() => void create()}>
              {t("unlock.ask.retry")}
            </button>
          </div>
        ) : (
          <div className={styles.actions}>
            <a
              className={styles.whatsapp}
              href={sheet.name === "ready" ? `https://wa.me/?text=${encodeURIComponent(fullText)}` : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={sheet.name !== "ready"}
              onClick={() => shared("whatsapp")}
            >
              {sheet.name === "ready" ? (
                <MessageCircle size={18} aria-hidden="true" />
              ) : (
                <Loader2 size={18} aria-hidden="true" className={styles.spin} />
              )}
              {t("unlock.ask.whatsapp")}
            </a>
            <div className={styles.secondary}>
              <button type="button" onClick={() => void copy()} disabled={sheet.name !== "ready"}>
                {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                {copied ? t("unlock.ask.copied") : t("unlock.ask.copy")}
              </button>
              {canShare ? (
                <button type="button" onClick={() => void shareMore()} disabled={sheet.name !== "ready"}>
                  <Share2 size={16} aria-hidden="true" />
                  {t("unlock.ask.more")}
                </button>
              ) : null}
            </div>
          </div>
        )}
        <p className={styles.privacy}>{t("unlock.ask.privacy")}</p>
      </section>
    </div>,
    document.body,
  );
}

/**
 * A slim note above the report when a parent's payment just unlocked it.
 * The report is right below, so the note only needs a way to close.
 */
export function ParentUnlockedCard({ onDismiss }: { onDismiss(): void }) {
  const { t } = useLocale();
  return (
    <section className={`surface-day ${styles.unlocked}`} role="status">
      <span className={styles.unlockedIcon} aria-hidden="true">
        <LockKeyholeOpen size={18} strokeWidth={2.4} />
      </span>
      <span className={styles.unlockedText}>
        <strong>{t("unlock.parent_paid.title")}</strong>
        <span>{t("unlock.parent_paid.body")}</span>
      </span>
      <button
        type="button"
        className={styles.unlockedClose}
        onClick={onDismiss}
        aria-label={t("unlock.ask.close")}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </section>
  );
}
