"use client";

import { LockKey, ShieldCheck, SpinnerGap, X } from "@phosphor-icons/react";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { ReportOffer } from "@/lib/payments/report-access";
import { getStripe, isStripeConfigured } from "@/lib/payments/stripe-client";
import {
  fill,
  formatOfferListPrice,
  formatOfferPrice,
  hasOfferDiscount,
} from "@/components/results/report-access/story/story-data";

/**
 * Where the checkout sheet is in the payment flow.
 *
 * `confirming` is the window between Embedded Checkout firing `onComplete`
 * and the server confirming the entitlement. The sheet stays open and locked
 * for it, because closing early would hide the only place the outcome is
 * reported.
 */
export type CheckoutStage = "creating" | "ready" | "confirming" | "failed";

interface CheckoutSheetProps {
  offer: ReportOffer;
  stage: CheckoutStage;
  /** Stripe's Embedded Checkout client secret; `null` until the session opens. */
  clientSecret: string | null;
  error: string | null;
  onClose(): void;
  /** Embedded Checkout reported completion. Not proof of payment. */
  onComplete(): void;
  onRetry(): void;
}

export function CheckoutSheet({
  offer,
  stage,
  clientSecret,
  error,
  onClose,
  onComplete,
  onRetry,
}: CheckoutSheetProps) {
  const { locale, t } = useLocale();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const price = formatOfferPrice(offer, locale);
  const listPrice = formatOfferListPrice(offer, locale);
  const showDiscount = hasOfferDiscount(offer);

  // Locked while the server is being asked whether the payment landed.
  const isBusy = stage === "confirming";

  // The keydown handler below is installed once, on mount, so that a state
  // change mid-checkout cannot re-run the effect and pull focus out of
  // Stripe's iframe. It reads the current values through this ref instead of
  // through its closure.
  const liveRef = useRef({ isBusy, onClose });
  useEffect(() => {
    liveRef.current = { isBusy, onClose };
  }, [isBusy, onClose]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      const { isBusy: busy, onClose: close } = liveRef.current;
      if (event.key === "Escape" && !busy) close();
      if (event.key !== "Tab" || !panelRef.current) return;
      // Deliberately does not match `iframe`: treating Stripe's frame as one
      // stop would trap Tab inside the wrapper and break tabbing between the
      // card fields. Keydown inside a cross-origin frame never reaches this
      // listener, so the frame governs its own focus order and stays
      // reachable through the natural DOM order around it.
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), a[href]",
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center md:items-center md:p-5">
      <button
        type="button"
        aria-label={t("paywall.checkout.close")}
        onClick={onClose}
        disabled={isBusy}
        className="anim-backdrop-fade absolute inset-0 cursor-default bg-night/82 backdrop-blur-md"
      />
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        aria-describedby="checkout-description"
        className="anim-sheet-up relative flex max-h-[92dvh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-[24px] border border-sand/12 bg-[#17102f] text-sand shadow-[0_-24px_80px_rgba(0,0,0,0.55)] md:rounded-[24px]"
      >
        <header className="flex items-start gap-3 border-b border-sand/10 px-5 pb-4 pt-5 sm:px-6">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-violet/20 text-violet-soft">
            <LockKey size={19} weight="duotone" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-violet-soft">
              {t("paywall.checkout.label")}
            </p>
            <h2
              id="checkout-title"
              className="mt-1 text-[22px] font-bold leading-tight"
            >
              {t("paywall.checkout.title")}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="grid size-11 shrink-0 place-items-center rounded-full border border-sand/10 bg-sand/[0.05] text-sand/70 transition hover:bg-sand/[0.09] hover:text-sand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-soft disabled:opacity-40"
            aria-label={t("paywall.checkout.close")}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-4 rounded-[14px] border border-sand/10 bg-sand/[0.045] p-4">
            <div>
              <p className="text-[14px] font-bold text-sand">
                {t("paywall.product")}
              </p>
              <p className="mt-1 text-[11px] text-sand/50">
                {t("paywall.one_time")}
              </p>
            </div>
            <div className="text-end">
              <p className="text-[20px] font-bold text-sand">{price}</p>
              {showDiscount ? (
                <p className="mt-0.5 text-[11px] font-semibold text-sand/55">
                  <s>
                    <span className="sr-only">
                      {fill(t("paywall.offer.full_price"), {
                        price: listPrice,
                      })}
                    </span>
                    <span aria-hidden="true">{listPrice}</span>
                  </s>
                  {" · "}
                  {fill(t("paywall.offer.percent_off"), {
                    percent: String(offer.discountPercent),
                  })}
                </p>
              ) : null}
            </div>
          </div>

          <p
            id="checkout-description"
            className="mt-4 text-[13px] leading-6 text-sand/62"
          >
            {t("paywall.checkout.description")}
          </p>

          <div className="mt-5">
            <PaymentArea
              stage={stage}
              clientSecret={clientSecret}
              onComplete={onComplete}
              onRetry={onRetry}
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-[12px] border border-error/25 bg-error/10 p-3 text-[12px] leading-5 text-sand/75"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-sand/45">
            <ShieldCheck size={15} weight="duotone" aria-hidden="true" />
            {t("paywall.checkout.security")}
          </div>
        </div>

        <footer className="border-t border-sand/10 bg-[#17102f] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
          <p className="text-center text-[10px] leading-4 text-sand/38">
            <a
              href="/terms"
              className="text-inherit underline underline-offset-2"
            >
              {t("paywall.checkout.terms")}
            </a>
            {" · "}
            <a
              href="/privacy"
              className="text-inherit underline underline-offset-2"
            >
              {t("paywall.checkout.privacy")}
            </a>
          </p>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

interface PaymentAreaProps {
  stage: CheckoutStage;
  clientSecret: string | null;
  onComplete(): void;
  onRetry(): void;
}

/**
 * The one region of the sheet that Stripe owns. Everything around it — the
 * framed panel, the price, the trust line — is ours and stays put.
 */
function PaymentArea({
  stage,
  clientSecret,
  onComplete,
  onRetry,
}: PaymentAreaProps) {
  const { t } = useLocale();

  if (!isStripeConfigured()) {
    return (
      <StatusPanel tone="error" title={t("paywall.checkout.unavailable")} />
    );
  }

  if (stage === "confirming") {
    return (
      <StatusPanel
        busy
        title={t("paywall.checkout.confirming")}
        note={t("paywall.checkout.confirming_note")}
      />
    );
  }

  if (stage === "failed") {
    return (
      <button
        type="button"
        className="btn-v2 btn-v2--primary w-full"
        data-size="lg"
        onClick={onRetry}
      >
        {t("paywall.checkout.retry")}
      </button>
    );
  }

  if (stage === "creating" || !clientSecret) {
    return <StatusPanel busy title={t("paywall.checkout.preparing")} />;
  }

  return <StripeCheckout clientSecret={clientSecret} onComplete={onComplete} />;
}

function StripeCheckout({
  clientSecret,
  onComplete,
}: {
  clientSecret: string;
  onComplete(): void;
}) {
  // EmbeddedCheckoutProvider refuses to accept a changed `onComplete` after
  // init (it warns and ignores it), so the callback handed to Stripe is a
  // stable wrapper that reads the latest one through a ref.
  const completeRef = useRef(onComplete);
  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  const options = useMemo(
    () => ({ clientSecret, onComplete: () => completeRef.current() }),
    [clientSecret],
  );

  return (
    // Embedded Checkout renders in a Stripe-hosted iframe on a light surface,
    // and this SDK exposes no client-side `appearance` API for it — Checkout
    // branding is configured server-side, in the Stripe Dashboard. So the
    // frame is given a deliberate `paper` card here, matching the radius and
    // border language of the price panel above, rather than a raw white
    // rectangle butting against the sheet's near-black violet.
    <div
      // Keying on the secret guarantees a genuinely new session mounts a new
      // provider instead of mutating a live one.
      key={clientSecret}
      className="overflow-hidden rounded-[14px] border border-sand/12 bg-paper p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.28)]"
    >
      <EmbeddedCheckoutProvider stripe={getStripe()} options={options}>
        <EmbeddedCheckout className="min-h-[300px] w-full" />
      </EmbeddedCheckoutProvider>
    </div>
  );
}

function StatusPanel({
  title,
  note,
  busy = false,
  tone = "neutral",
}: {
  title: string;
  note?: string;
  busy?: boolean;
  tone?: "neutral" | "error";
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed p-5 text-center ${
        tone === "error"
          ? "border-error/30 bg-error/[0.08]"
          : "border-violet-soft/30 bg-violet/[0.08]"
      }`}
    >
      <div
        className={`flex items-center gap-2 ${
          tone === "error" ? "text-error" : "text-violet-soft"
        }`}
      >
        {busy ? (
          <SpinnerGap size={17} className="animate-spin" aria-hidden="true" />
        ) : null}
        <p className="text-[12px] font-bold">{title}</p>
      </div>
      {note ? (
        <p className="max-w-[38ch] text-[11px] leading-5 text-sand/50">
          {note}
        </p>
      ) : null}
    </div>
  );
}
