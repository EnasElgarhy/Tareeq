"use client";

import { ArrowUpRight, ReceiptText, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { OtpSignIn } from "@/components/auth/OtpSignIn";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Payments & Invoices — the user's payment history, embedded in the You tab
 * and styled after that account page: a quiet list of cards, not an
 * accounting dashboard.
 *
 * The screen never sees a Stripe id. The history endpoint resolves the hosted
 * invoice/receipt URLs server-side from the authenticated user's own rows and
 * returns only the safe URL; this screen simply renders what comes back.
 */

type PurchaseStatus = "paid" | "refunded";

interface Purchase {
  id: string;
  kind: "report_unlock";
  status: PurchaseStatus;
  /** 'paid' for Stripe purchases, 'free' for admin-granted access. */
  source: "paid" | "free";
  amountMinor: number | null;
  currency: string | null;
  paidAt: string;
  documentUrl: string | null;
}

type ScreenState =
  | { phase: "loading" }
  | { phase: "signed-out" }
  | { phase: "error" }
  | { phase: "ready"; purchases: Purchase[] };

const HISTORY_ENDPOINT = "/api/payments/history";

class SignedOutError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

/** Defensive parse — an API response is data from a trust boundary. */
function normalizePurchase(value: unknown): Purchase | null {
  if (!isRecord(value)) return null;
  const { id, kind, status, source, amountMinor, currency, paidAt, documentUrl } = value;
  if (typeof id !== "string") return null;
  if (kind !== "report_unlock") return null;
  if (status !== "paid" && status !== "refunded") return null;
  return {
    id,
    kind,
    status,
    source: source === "free" ? "free" : "paid",
    amountMinor: typeof amountMinor === "number" ? amountMinor : null,
    currency: typeof currency === "string" ? currency : null,
    paidAt: typeof paidAt === "string" ? paidAt : "",
    documentUrl: typeof documentUrl === "string" ? documentUrl : null,
  };
}

async function fetchHistory(): Promise<Purchase[]> {
  let response: Response;
  try {
    response = await fetch(HISTORY_ENDPOINT, { cache: "no-store" });
  } catch {
    throw new Error("network");
  }

  if (response.status === 401) throw new SignedOutError();
  if (!response.ok) throw new Error("unavailable");

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error("invalid_response");
  }

  if (!isRecord(body) || !Array.isArray(body.purchases)) {
    throw new Error("invalid_response");
  }

  return body.purchases
    .map(normalizePurchase)
    .filter((purchase): purchase is Purchase => purchase !== null);
}

function formatAmount(
  amountMinor: number | null,
  currency: string | null,
  locale: Locale,
): string | null {
  if (amountMinor === null || !currency) return null;
  const hasCents = amountMinor % 100 !== 0;
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar" : "en", {
      style: "currency",
      currency,
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: hasCents ? 2 : 0,
    }).format(amountMinor / 100);
  } catch {
    // Unknown currency code — still show something truthful rather than crash.
    return `${(amountMinor / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function formatDate(iso: string, locale: Locale): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function PurchaseCard({ purchase }: { purchase: Purchase }) {
  const { locale, t } = useLocale();

  const product = t("payments.product.report");
  const type = t("payments.type.premium_unlock");
  const statusLabel = t(
    purchase.source === "free"
      ? "payments.status.free"
      : purchase.status === "refunded"
        ? "payments.status.refunded"
        : "payments.status.paid",
  );
  const amount = formatAmount(purchase.amountMinor, purchase.currency, locale);
  const date = formatDate(purchase.paidAt, locale);

  return (
    <li className="rounded-story border border-[color:var(--day-line)] bg-[color:var(--day-card)] p-4 sm:p-5">
      <div className="flex items-start gap-3.5">
        <span className="daybreak-icon-tile size-10 shrink-0">
          <ReceiptText size={18} aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-[14px] font-bold text-[color:var(--day-ink)]">
              {product}
            </p>
            {amount ? (
              <p className="text-[15px] font-bold tabular-nums text-[color:var(--day-ink)]">
                {amount}
              </p>
            ) : null}
          </div>
          <p className="mt-0.5 text-[12.5px] text-[color:var(--day-ink-2)]">
            {type}
          </p>
          <p className="mt-2 text-[12px] text-[color:var(--day-ink-2)]">
            <span
              className={
                purchase.status === "refunded"
                  ? "font-semibold text-[color:var(--day-ink-3)]"
                  : "font-semibold text-[color:var(--daybreak-green,#3d8a73)]"
              }
            >
              {statusLabel}
            </span>
            {date ? ` · ${date}` : ""}
          </p>
        </div>
      </div>

      {purchase.documentUrl ? (
        <div className="mt-3 flex justify-end border-t border-[color:var(--day-line)] pt-3">
          <a
            href={purchase.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("payments.view_invoice_aria").replace(
              "{product}",
              product,
            )}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[color:var(--day-ink-2)] transition hover:text-[color:var(--day-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D5BA8]"
          >
            {t("payments.view_invoice")}
            <ArrowUpRight size={14} aria-hidden="true" className="rtl:-scale-x-100" />
          </a>
        </div>
      ) : null}
    </li>
  );
}

function SkeletonList() {
  return (
    <div className="grid gap-2.5" role="status" aria-live="polite">
      {[0, 1].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-story border border-[color:var(--day-line)] bg-[color:var(--day-card)] p-4 sm:p-5"
        >
          <div className="flex items-center gap-3.5">
            <span className="size-10 shrink-0 rounded-full bg-[color:var(--day-inset)]" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/3 rounded-full bg-[color:var(--day-inset)]" />
              <div className="h-3 w-1/4 rounded-full bg-[color:var(--day-inset)]" />
            </div>
            <div className="h-4 w-16 rounded-full bg-[color:var(--day-inset)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  const { t } = useLocale();
  return (
    <div className="rounded-story border border-[color:var(--day-line)] bg-[color:var(--day-card)] px-5 py-8 text-center">
      <span className="daybreak-icon-tile mx-auto size-11">
        <ReceiptText size={20} aria-hidden="true" />
      </span>
      <p className="daybreak-heading mt-3 text-[17px] text-[color:var(--day-ink)]">
        {t("payments.empty_title")}
      </p>
      <p className="mx-auto mt-1 max-w-[42ch] text-[13px] leading-relaxed text-[color:var(--day-ink-2)]">
        {t("payments.empty_body")}
      </p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useLocale();
  return (
    <div className="rounded-story border border-[color:var(--day-line)] bg-[color:var(--day-card)] px-5 py-8 text-center">
      <span className="daybreak-icon-tile mx-auto size-11">
        <RefreshCw size={19} aria-hidden="true" />
      </span>
      <p className="daybreak-heading mt-3 text-[17px] text-[color:var(--day-ink)]">
        {t("payments.error_title")}
      </p>
      <p className="mx-auto mt-1 max-w-[42ch] text-[13px] leading-relaxed text-[color:var(--day-ink-2)]">
        {t("payments.error_body")}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-[color:var(--day-line)] px-4 text-[13px] font-bold text-[color:var(--day-ink)] transition hover:bg-[color:var(--day-inset)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D5BA8]"
      >
        <RefreshCw size={14} aria-hidden="true" />
        {t("payments.retry")}
      </button>
    </div>
  );
}

function SignedOutState({ onSignedIn }: { onSignedIn: () => void }) {
  const { t } = useLocale();
  return (
    <div className="rounded-story border border-[color:var(--day-line)] bg-[color:var(--day-card)] px-5 py-8">
      <p className="daybreak-heading text-[17px] text-[color:var(--day-ink)]">
        {t("payments.signin_title")}
      </p>
      <p className="mt-1 max-w-[52ch] text-[13px] leading-relaxed text-[color:var(--day-ink-2)]">
        {t("payments.signin_body")}
      </p>
      <div className="mt-3 lg:mx-auto lg:max-w-[420px]">
        <OtpSignIn onSignedIn={onSignedIn} variant="daybreak" />
      </div>
    </div>
  );
}

/**
 * The Payments & Invoices section, embedded in the You tab. Renders its own
 * section heading, supporting text, and the purchase-history states.
 */
export function PaymentsSection() {
  const { t } = useLocale();
  const [state, setState] = useState<ScreenState>({ phase: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ phase: "loading" });

    fetchHistory()
      .then((purchases) => {
        if (active) setState({ phase: "ready", purchases });
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof SignedOutError) {
          setState({ phase: "signed-out" });
          return;
        }
        setState({ phase: "error" });
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  return (
    <section className="grid gap-2.5">
      <div className="ps-0.5">
        <p className="daybreak-eyebrow">{t("payments.title")}</p>
        <p className="mt-1 max-w-[58ch] text-[12.5px] leading-relaxed text-[color:var(--day-ink-2)]">
          {t("payments.subtitle")}
        </p>
      </div>

      <p className="mt-1 ps-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--day-ink-3)]">
        {t("payments.section_label")}
      </p>

      {state.phase === "loading" ? <SkeletonList /> : null}
      {state.phase === "signed-out" ? (
        <SignedOutState onSignedIn={() => setAttempt((value) => value + 1)} />
      ) : null}
      {state.phase === "error" ? (
        <ErrorState onRetry={() => setAttempt((value) => value + 1)} />
      ) : null}
      {state.phase === "ready" && state.purchases.length === 0 ? (
        <EmptyState />
      ) : null}
      {state.phase === "ready" && state.purchases.length > 0 ? (
        <ul className="grid gap-2.5">
          {state.purchases.map((purchase) => (
            <PurchaseCard key={purchase.id} purchase={purchase} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
