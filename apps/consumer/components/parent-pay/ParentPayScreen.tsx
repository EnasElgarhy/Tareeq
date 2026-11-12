"use client";

import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import {
  Check,
  Compass,
  FileText,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  fill,
  formatOfferListPrice,
  formatOfferPrice,
  formatOfferSaving,
  hasOfferDiscount,
} from "@/components/results/report-access/story/story-data";
import type { StringKey } from "@/lib/i18n/strings";
import { getReportOffer } from "@/lib/payments/report-access";
import { getStripe, isStripeConfigured } from "@/lib/payments/stripe-client";
import { PayFeatureSlider } from "./PayFeatureSlider";
import styles from "./parent-pay.module.css";

export type ParentPayOutcome =
  | "ready"
  | "paid"
  | "expired"
  | "revoked"
  | "invalid";

interface ParentPayScreenProps {
  token: string;
  outcome: ParentPayOutcome;
}

type Stage =
  | { name: "offer" }
  | { name: "opening" }
  | { name: "checkout"; clientSecret: string }
  | { name: "confirming" }
  | { name: "paid"; confirmed: boolean };

const SUPPORT_EMAIL = "support@mapmycore.com";
const POLL_INTERVAL_MS = 1500;
const POLL_ATTEMPTS = 20;

const CLOSED_COPY: Record<
  Exclude<ParentPayOutcome, "ready">,
  { title: StringKey; body: StringKey }
> = {
  paid: { title: "pay.state.paid.title", body: "pay.state.paid.body" },
  expired: { title: "pay.state.expired.title", body: "pay.state.expired.body" },
  revoked: { title: "pay.state.revoked.title", body: "pay.state.revoked.body" },
  invalid: { title: "pay.state.invalid.title", body: "pay.state.invalid.body" },
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The parent's page behind `/pay/<token>`: what the report holds, then pay. */
export function ParentPayScreen({ token, outcome }: ParentPayScreenProps) {
  const { t } = useLocale();
  const [stage, setStage] = useState<Stage>({ name: "offer" });

  return (
    <main className={styles.page}>
      <PayHeader />
      {outcome !== "ready" ? (
        <ClosedState copy={CLOSED_COPY[outcome]} />
      ) : stage.name === "paid" ? (
        <PaidState confirmed={stage.confirmed} />
      ) : (
        <>
          <h1 className={styles.title}>{t("pay.title")}</h1>
          <p className={styles.intro}>{t("pay.intro")}</p>
          <PayFeatureSlider />
          <PayTicket
            audience={{ kind: "parent", token }}
            stage={stage}
            onStage={setStage}
          />
        </>
      )}
    </main>
  );
}

export function PayHeader() {
  const { t, locale, setLocale } = useLocale();
  return (
    <header className={styles.header}>
      <span className={styles.brand}>
        <Compass size={22} aria-hidden="true" />
        <span className="daybreak-heading">Map My CORE</span>
      </span>
      <button
        type="button"
        className={styles.langButton}
        lang={locale === "ar" ? "en" : "ar"}
        onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
      >
        {t("pay.lang")}
      </button>
    </header>
  );
}

/**
 * Who the ticket is for. A parent pays here, through the link's own checkout
 * and with the guardian confirmation; a student hands off to the report's
 * existing checkout sheet, so there is no consent box.
 */
type TicketAudience =
  | { kind: "parent"; token: string }
  | { kind: "student"; onPay(): void };

interface PayTicketProps {
  audience: TicketAudience;
  stage: Stage;
  onStage(stage: Stage): void;
}

function PayTicket({ audience, stage, onStage }: PayTicketProps) {
  const { t, locale } = useLocale();
  const offer = useMemo(getReportOffer, []);
  const price = formatOfferPrice(offer, locale);
  const isStudent = audience.kind === "student";
  const [consented, setConsented] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canPay = isStudent || consented;

  async function openCheckout() {
    if (audience.kind === "student") {
      audience.onPay();
      return;
    }
    const { token } = audience;
    if (!consented) return;
    if (!isStripeConfigured()) {
      setError(t("pay.error"));
      return;
    }
    setError(null);
    onStage({ name: "opening" });
    try {
      const response = await fetch(
        `/api/pay/${encodeURIComponent(token)}/checkout`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ consent: true }),
        },
      );
      const body = (await response.json().catch(() => ({}))) as {
        clientSecret?: string;
        error?: string;
      };
      if (response.status === 409) {
        onStage({ name: "paid", confirmed: true });
        return;
      }
      if (!response.ok || !body.clientSecret)
        throw new Error(body.error ?? "checkout_unavailable");
      onStage({ name: "checkout", clientSecret: body.clientSecret });
    } catch {
      setError(t("pay.error"));
      onStage({ name: "offer" });
    }
  }

  async function confirmPaid() {
    if (audience.kind !== "parent") return;
    const { token } = audience;
    onStage({ name: "confirming" });
    // Checkout finishing is not proof of payment: wait for the signed
    // webhook to mark the link paid, then say so.
    for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
      try {
        const response = await fetch(`/api/pay/${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        const body = (await response.json().catch(() => ({}))) as {
          state?: string;
        };
        if (body.state === "paid") {
          onStage({ name: "paid", confirmed: true });
          return;
        }
      } catch {
        // A dropped poll is retried on the next tick.
      }
      await sleep(POLL_INTERVAL_MS);
    }
    onStage({ name: "paid", confirmed: false });
  }

  if (stage.name === "checkout" || stage.name === "confirming") {
    return (
      <section
        className={styles.checkoutPanel}
        aria-label={t("pay.checkout.title")}
      >
        {stage.name === "checkout" ? (
          <>
            <button
              type="button"
              className={styles.backLink}
              onClick={() => onStage({ name: "offer" })}
            >
              {t("pay.checkout.back")}
            </button>
            <EmbeddedCheckoutProvider
              stripe={getStripe()}
              options={{
                clientSecret: stage.clientSecret,
                onComplete: () => void confirmPaid(),
              }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </>
        ) : (
          <p className={styles.confirming} role="status">
            <Loader2 size={18} aria-hidden="true" className={styles.spin} />
            {t("pay.confirming")}
          </p>
        )}
      </section>
    );
  }

  const isOpening = stage.name === "opening";
  const perks: { label: StringKey; icon: React.ReactNode; tone: string }[] = [
    {
      label: "pay.ticket.report",
      icon: <FileText size={18} aria-hidden="true" />,
      tone: styles.perkGold,
    },
    {
      label: "pay.ticket.kai",
      icon: (
        <Image
          src="/kai/avatar/kai-avatar-idle.webp"
          unoptimized
          alt=""
          width={34}
          height={34}
        />
      ),
      tone: styles.perkKai,
    },
    {
      label: "pay.ticket.parents",
      icon: <Users size={18} aria-hidden="true" />,
      tone: styles.perkViolet,
    },
  ];

  return (
    <section className={styles.ticketArea} aria-labelledby="pay-ticket-title">
      <div className={styles.ticketGlow} aria-hidden="true" />
      <div className={styles.ticketBorder}>
        <div className={styles.ticket}>
          <div className={styles.ticketTop}>
            <div className={styles.priceRow}>
              <span>
                <span id="pay-ticket-title" className={styles.ticketLabel}>
                  {t(isStudent ? "pay.ticket.label.you" : "pay.ticket.label")}
                </span>
                <span className={styles.price}>
                  <strong className="daybreak-heading">{price}</strong>
                  {hasOfferDiscount(offer) ? (
                    <s>{formatOfferListPrice(offer, locale)}</s>
                  ) : null}
                </span>
              </span>
              {hasOfferDiscount(offer) ? (
                <span className={styles.ribbon}>
                  {fill(t("pay.ticket.ribbon"), {
                    percent: String(offer.discountPercent),
                  })}
                </span>
              ) : null}
            </div>
            <ul className={styles.perks}>
              {perks.map((perk) => (
                <li key={perk.label}>
                  <span className={`${styles.perkIcon} ${perk.tone}`}>
                    {perk.icon}
                  </span>
                  {t(perk.label)}
                </li>
              ))}
            </ul>
            <OrderSummary isStudent={isStudent} />
          </div>

          <div className={styles.perforation} aria-hidden="true" />

          <div className={styles.ticketBottom}>
            {isStudent ? null : (
              <label className={styles.consent} data-checked={consented}>
                <input
                  type="checkbox"
                  checked={consented}
                  onChange={(event) => setConsented(event.target.checked)}
                />
                <span className={styles.consentBox} aria-hidden="true">
                  {consented ? <Check size={14} strokeWidth={3} /> : null}
                </span>
                <span>
                  {t("pay.consent.lead")}{" "}
                  <Link href="/terms-of-service" target="_blank">
                    {t("pay.consent.terms")}
                  </Link>{" "}
                  {t("pay.consent.and")}{" "}
                  <Link href="/privacy-policy" target="_blank">
                    {t("pay.consent.privacy")}
                  </Link>
                  .
                </span>
              </label>
            )}
            {isStudent ? null : (
              <p className={styles.consentNote}>{t("pay.consent.note")}</p>
            )}
            <button
              type="button"
              className={styles.payButton}
              data-ready={canPay}
              disabled={!canPay || isOpening}
              onClick={() => void openCheckout()}
            >
              {isOpening ? (
                <Loader2 size={16} aria-hidden="true" className={styles.spin} />
              ) : (
                <LockKeyhole size={16} aria-hidden="true" />
              )}
              {isOpening ? t("pay.cta.loading") : fill(t("pay.cta"), { price })}
            </button>
            {error ? (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <ul className={styles.trust}>
        <li>
          <ShieldCheck size={13} aria-hidden="true" />
          {t("pay.trust.stripe")}
        </li>
        <li>
          <Check size={13} aria-hidden="true" />
          {t(isStudent ? "pay.trust.yours" : "pay.trust.account")}
        </li>
        <li>
          <Mail size={13} aria-hidden="true" />
          {t("pay.trust.receipt")}
        </li>
      </ul>
      <p className={styles.footnote}>
        {t(isStudent ? "pay.student.footnote" : "pay.footnote")}
      </p>
    </section>
  );
}

const SUMMARY_INCLUDES: StringKey[] = [
  "pay.summary.inc_chapters",
  "pay.summary.inc_careers",
  "pay.summary.inc_kai",
  "pay.summary.inc_parents",
];

/**
 * Desktop only: the ticket's top half as a website order summary (product,
 * what's included, a price breakdown). Phones keep the ticket's price and tiles.
 */
function OrderSummary({ isStudent }: { isStudent: boolean }) {
  const { t, locale } = useLocale();
  const offer = useMemo(getReportOffer, []);
  const discount = offer.listAmountMinor - offer.amountMinor;
  return (
    <div className={styles.summary}>
      <p className={styles.summaryTitle}>{t("pay.summary.title")}</p>
      <div className={styles.summaryProduct}>
        <Image
          src="/kai/avatar/kai-avatar-idle.webp"
          unoptimized
          alt=""
          width={48}
          height={48}
        />
        <span>
          <strong>
            {t(isStudent ? "pay.ticket.label.you" : "pay.ticket.label")}
          </strong>
          <small>{t("pay.summary.one_time")}</small>
        </span>
      </div>
      <ul className={styles.summaryIncludes}>
        {SUMMARY_INCLUDES.map((key) => (
          <li key={key}>
            <Check size={15} strokeWidth={2.6} aria-hidden="true" />
            {t(key)}
          </li>
        ))}
      </ul>
      <dl className={styles.summaryLines}>
        {hasOfferDiscount(offer) ? (
          <>
            <div>
              <dt>{t("pay.summary.full")}</dt>
              <dd>{formatOfferListPrice(offer, locale)}</dd>
            </div>
            <div className={styles.summaryOffer}>
              <dt>
                {fill(t("pay.summary.offer"), {
                  percent: String(offer.discountPercent),
                })}
              </dt>
              <dd>
                −{formatOfferPrice({ ...offer, amountMinor: discount }, locale)}
              </dd>
            </div>
          </>
        ) : null}
        <div className={styles.summaryTotal}>
          <dt>{t("pay.summary.total")}</dt>
          <dd className="daybreak-heading">
            {formatOfferPrice(offer, locale)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** Two voices, the child's with a spark: ask what surprised them first. */
function ConversationIcon() {
  return (
    <span className={styles.tipIcon} aria-hidden="true">
      <svg viewBox="0 0 32 32" width="26" height="26" fill="none">
        <path
          d="M4.5 9.5c0-2.2 1.8-4 4-4h9c2.2 0 4 1.8 4 4v5c0 2.2-1.8 4-4 4h-5.5l-4.2 3.2c-.5.4-1.3 0-1.3-.6v-2.7c-1.2-.7-2-2-2-3.4v-5.5Z"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <path
          d="M24.5 13.2c1.8.4 3 2 3 3.8v4.5c0 1.3-.7 2.5-1.8 3.2v2.4c0 .6-.7 1-1.2.6l-3.8-2.9H16c-1.6 0-3-.9-3.6-2.3"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.55}
        />
        <path
          d="M13 8.6l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7.7-1.7Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

/**
 * The link a parent sends their child once the report is open. Read after
 * mount: the server doesn't know the site's address, and a different first
 * render would not hydrate.
 */
function useReportLink(): string {
  const [link, setLink] = useState("");
  useEffect(() => setLink(`${window.location.origin}/compass`), []);
  return link;
}

export function PaidState({ confirmed }: { confirmed: boolean }) {
  const { t, locale } = useLocale();
  const offer = useMemo(getReportOffer, []);
  const saving = formatOfferSaving(offer, locale);
  const link = useReportLink();
  const message = fill(t("pay.paid.share_message"), { link });
  return (
    <section className={styles.endState} aria-live="polite">
      <span className={`anim-paid-ring ${styles.endIcon}`} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="34" height="34" fill="none">
          <path
            className="anim-paid-tick"
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <p className={`anim-paid-rise ${styles.paidLabel}`}>
        {t("paywall.done.label")}
      </p>
      <h1 className={`daybreak-heading anim-paid-rise ${styles.endTitle}`}>
        {t("pay.paid.title")}
      </h1>
      <p className="anim-paid-rise">
        {confirmed ? t("pay.paid.body") : t("pay.paid.pending")}
      </p>

      <dl className={`anim-paid-rise ${styles.receipt}`}>
        <div>
          <dt>{t("paywall.product")}</dt>
          <dd>
            {saving
              ? formatOfferListPrice(offer, locale)
              : formatOfferPrice(offer, locale)}
          </dd>
        </div>
        {saving ? (
          <div>
            <dt>{t("paywall.done.offer")}</dt>
            <dd className={styles.receiptSaving}>−{saving}</dd>
          </div>
        ) : null}
        <div className={styles.receiptTotal}>
          <dt>{t("paywall.done.paid")}</dt>
          <dd>{formatOfferPrice(offer, locale)}</dd>
        </div>
      </dl>

      <a
        className={`anim-paid-rise ${styles.shareButton}`}
        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("pay.paid.share")}
      </a>
      <p className={`anim-paid-rise ${styles.shareNote}`}>
        {t("pay.paid.share_note")}
      </p>

      <div className={`anim-paid-rise ${styles.tip} ${styles.tipWithIcon}`}>
        <ConversationIcon />
        <div>
          <strong>{t("pay.paid.tip_title")}</strong>
          <p>{t("pay.paid.tip")}</p>
        </div>
      </div>
      <p className={styles.help}>
        {t("pay.help")} <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
    </section>
  );
}

function ClosedState({
  copy,
}: {
  copy: { title: StringKey; body: StringKey };
}) {
  const { t } = useLocale();
  return (
    <section className={styles.endState}>
      <h1 className={`daybreak-heading ${styles.endTitle}`}>{t(copy.title)}</h1>
      <p>{t(copy.body)}</p>
      <p className={styles.help}>
        {t("pay.help")} <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
    </section>
  );
}

interface StudentPayScreenProps {
  /** Hands over to the report's own checkout sheet. */
  onPay(): void;
  onClose(): void;
}

/**
 * "Me" on the locked report: the same page a parent sees (what's inside, then
 * the ticket), in the student's words and without the guardian box. Paying
 * closes it and opens the report's existing checkout.
 */
export function StudentPayScreen({ onPay, onClose }: StudentPayScreenProps) {
  const { t, dir, locale } = useLocale();
  const [stage, setStage] = useState<Stage>({ name: "offer" });

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-pay-intro"
      dir={dir}
      className={`${styles.overlay} ${locale === "ar" ? "font-arabic" : ""}`}
    >
      <main className={styles.page}>
        <header className={styles.header}>
          <span className={styles.brand}>
            <Compass size={22} aria-hidden="true" />
            <span className="daybreak-heading">Map My CORE</span>
          </span>
          <button
            type="button"
            className={styles.langButton}
            onClick={onClose}
            aria-label={t("unlock.ask.close")}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <p id="student-pay-intro" className={styles.intro}>
          {t("pay.student.intro")}
        </p>
        <PayFeatureSlider audience="student" />
        <PayTicket
          audience={{ kind: "student", onPay }}
          stage={stage}
          onStage={setStage}
        />
      </main>
    </div>,
    document.body,
  );
}
