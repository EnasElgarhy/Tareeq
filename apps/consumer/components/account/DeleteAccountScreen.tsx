"use client";

import { ArrowLeft, CreditCard, FileText, MessagesSquare, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { DAYBREAK_FIELD } from "@/components/auth/OtpSignIn";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { clearBrowserUserData } from "@/lib/auth/local-data";
import { OTP_MAX_LENGTH, OTP_MIN_LENGTH, sendEmailOtp, verifyEmailOtp } from "@/lib/auth/otp";
import type { StringKey } from "@/lib/i18n/strings";
import { useKaiProfile } from "@/lib/kai/useKaiProfile";

type Step = "review" | "confirm" | "deleted";

const DELETED_ITEMS: ReadonlyArray<{ title: StringKey; detail: StringKey; icon: LucideIcon }> = [
  { title: "account.delete.item_identity_title", detail: "account.delete.item_identity", icon: UserRound },
  { title: "account.delete.item_core_title", detail: "account.delete.item_core", icon: FileText },
  { title: "account.delete.item_kai_title", detail: "account.delete.item_kai", icon: MessagesSquare },
  { title: "account.delete.item_paid_title", detail: "account.delete.item_paid", icon: CreditCard },
];

/** What the delete route answers with, mapped to the message the student sees. */
const ROUTE_ERRORS: Readonly<Record<string, StringKey>> = {
  confirm_required: "account.delete.error_code",
  too_many_attempts: "account.delete.error_limit",
  admin_account: "account.delete.error_admin",
};

const HEADING =
  "daybreak-heading text-balance text-[30px] leading-tight text-[color:var(--day-ink)] outline-none lg:text-[36px]";
const LEAD = "max-w-[46ch] text-[15px] leading-relaxed text-[color:var(--day-ink-2)]";
const ACTIONS = "grid grid-cols-2 gap-2.5 [&>*]:px-3";
/** On a phone the actions stay pinned above the tab bar, within thumb reach, while the list scrolls behind them. */
const ACTION_AREA =
  "grid gap-3 max-sm:sticky max-sm:-bottom-3 max-sm:z-10 max-sm:-mx-4 max-sm:mt-auto max-sm:bg-[linear-gradient(to_top,var(--day-bg)_78%,transparent)] max-sm:px-4 max-sm:pb-3 max-sm:pt-6";
const SUPPORT_EMAIL = "support@mapmycore.com";

/** Puts the student's email, in bold, where the wording says {email}. */
function withEmail(text: string, email: string): ReactNode {
  const [before, after] = text.split("{email}");
  return (
    <>
      {before}
      <bdi className="font-semibold text-[color:var(--day-ink)]">{email}</bdi>
      {after}
    </>
  );
}

/** Makes the support address in a sentence a mail link. */
function withSupportLink(text: string): ReactNode {
  const [before, after] = text.split(SUPPORT_EMAIL);
  return (
    <>
      {before}
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="font-semibold text-[color:var(--day-ink-2)] underline decoration-[color:var(--day-line-strong)] underline-offset-[3px] transition-colors hover:text-[color:var(--day-ink)] hover:decoration-current"
      >
        {SUPPORT_EMAIL}
      </a>
      {after}
    </>
  );
}

/**
 * Deleting an account in three steps: read what goes, confirm with a code
 * sent to the account's own email, then the deletion itself. The server
 * only deletes when that code was confirmed in the last few minutes.
 */
export function DeleteAccountScreen() {
  const { t } = useLocale();
  const { authState, displayName, email } = useKaiProfile();
  const [step, setStep] = useState<Step>("review");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<StringKey | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstStep = useRef(true);

  // Each step replaces the last one in place, so move focus to its heading:
  // a keyboard or screen-reader user lands on the new step, not on a button
  // that is no longer there.
  useEffect(() => {
    if (isFirstStep.current) {
      isFirstStep.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  async function sendCode() {
    setError(null);
    setBusy(true);
    const { ok } = await sendEmailOtp(email);
    setBusy(false);
    if (!ok) {
      setError("account.delete.error_send");
      return;
    }
    setCode("");
    setCodeSent(true);
  }

  async function handleDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.trim().length < OTP_MIN_LENGTH) {
      setError("account.delete.error_code");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const verified = await verifyEmailOtp(email, code.trim());
      if (!verified.ok) {
        setError("account.delete.error_code");
        return;
      }
      const response = await fetch("/api/account/delete", { method: "POST" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(ROUTE_ERRORS[body?.error ?? ""] ?? "account.delete.error_failed");
        return;
      }
      clearBrowserUserData();
      setStep("deleted");
    } catch {
      setError("account.delete.error_failed");
    } finally {
      setBusy(false);
    }
  }

  if (step === "deleted") {
    return (
      <section className="step-enter mx-auto flex w-full max-w-[34rem] flex-1 flex-col items-start justify-center gap-5 py-10">
        <span className="grid size-12 place-items-center rounded-full bg-[color:var(--day-inset)] text-[color:var(--day-ink)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              className="tick-draw"
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div className="grid gap-2" role="status">
          <h1 ref={headingRef} tabIndex={-1} className={HEADING}>
            {t("account.delete.done_title")}
          </h1>
          <p className={LEAD}>{t("account.delete.done_body")}</p>
        </div>
        {/* A full page load, so nothing of the old session stays in memory. */}
        <button type="button" className="daybreak-primary-action" onClick={() => window.location.assign("/")}>
          {t("account.delete.done_cta")}
        </button>
      </section>
    );
  }

  if (authState !== "signed-in") {
    return authState === "loading" ? (
      <div
        aria-hidden="true"
        className="mx-auto h-[260px] w-full max-w-[34rem] animate-pulse rounded-[20px] bg-[color:var(--day-inset)] motion-reduce:animate-none"
      />
    ) : null;
  }

  return (
    <section key={step} className="step-enter mx-auto flex w-full max-w-[34rem] flex-1 flex-col gap-7 pb-4 sm:pb-8">
      <Link
        href="/you#account"
        className="-ms-1 inline-flex min-h-9 items-center gap-1.5 self-start rounded-full px-1 text-[13px] font-semibold text-[color:var(--day-ink-2)] transition-colors hover:text-[color:var(--day-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D5BA8]"
      >
        <ArrowLeft size={15} className="flip-rtl" aria-hidden="true" />
        {t("account.delete.back")}
      </Link>

      {step === "review" ? (
        <>
          <header className="grid gap-2.5">
            <h1 ref={headingRef} tabIndex={-1} className={HEADING}>
              {t("account.delete.title")}
            </h1>
            <p className={LEAD}>{t("account.delete.intro")}</p>
          </header>

          <div className="flex items-center gap-3 rounded-[18px] border border-[color:var(--day-line)] bg-[color:var(--day-card)] px-4 py-3">
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-[#221248] text-[15px] font-bold text-[#FFFCF6]"
            >
              {(displayName || email).trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              {displayName ? (
                <p className="truncate text-[14.5px] font-semibold leading-snug text-[color:var(--day-ink)]">
                  {displayName}
                </p>
              ) : null}
              <p className="truncate text-[13.5px] text-[color:var(--day-ink-2)]">
                <bdi>{email}</bdi>
              </p>
            </div>
          </div>

          <div className="grid gap-1">
            <h2 className="text-[13px] font-bold text-[color:var(--day-ink)]">{t("account.delete.list_label")}</h2>
            <ul className="step-enter-rows divide-y divide-[color:var(--day-line)] border-b border-[color:var(--day-line)]">
              {DELETED_ITEMS.map(({ title, detail, icon: Icon }) => (
                <li key={title} className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3 py-3">
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                    aria-hidden="true"
                    className="mt-[2px] text-[color:var(--daybreak-clay-ink)]"
                  />
                  <div>
                    <p className="text-[14.5px] font-semibold leading-snug text-[color:var(--day-ink)]">{t(title)}</p>
                    <p className="mt-0.5 text-[13.5px] leading-relaxed text-[color:var(--day-ink-2)]">{t(detail)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="pt-2.5 text-[13px] leading-relaxed text-[color:var(--day-ink-3)]">{t("account.delete.kept")}</p>
            <p className="text-[13px] leading-relaxed text-[color:var(--day-ink-3)]">
              {withSupportLink(t("account.delete.help"))}
            </p>
            <p className="text-[13px] leading-relaxed text-[color:var(--day-ink-3)]">{t("account.delete.reassure")}</p>
          </div>

          <div className={ACTION_AREA}>
            <div className={ACTIONS}>
              <Link href="/you#account" className="daybreak-primary-action">
                {t("account.delete.keep_cta")}
              </Link>
              <button type="button" className="daybreak-secondary-action !min-h-[2.875rem] !text-[0.8125rem]" onClick={() => setStep("confirm")}>
                {t("account.delete.continue_cta")}
              </button>
            </div>
          </div>
        </>
      ) : (
        <form onSubmit={handleDelete} className="flex flex-1 flex-col gap-6" noValidate>
          <header className="grid gap-2.5">
            <h1 ref={headingRef} tabIndex={-1} className={HEADING}>
              {t("account.delete.confirm_title")}
            </h1>
            <p className={LEAD} aria-live="polite">
              {withEmail(t(codeSent ? "account.delete.code_sent" : "account.delete.confirm_body"), email)}
            </p>
          </header>

          {codeSent ? (
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className={`${DAYBREAK_FIELD} h-14 px-4 text-center text-[22px] font-bold tracking-[0.3em] tabular-nums placeholder:font-medium placeholder:opacity-45`}
              placeholder={"0".repeat(OTP_MIN_LENGTH)}
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label={t("auth.otp.code_label")}
              aria-invalid={error === "account.delete.error_code"}
              maxLength={OTP_MAX_LENGTH}
              dir="ltr"
              autoFocus
            />
          ) : null}

          {error ? (
            <p role="alert" className="step-enter text-[13px] font-semibold leading-relaxed text-[color:var(--daybreak-clay-ink)]">
              {t(error)}
            </p>
          ) : null}

          <div className={ACTION_AREA}>
            <div className={ACTIONS}>
              {codeSent ? (
                <button type="submit" className="daybreak-danger-action" disabled={busy}>
                  {busy ? t("account.delete.deleting") : t("account.delete.delete_cta")}
                </button>
              ) : (
                <button type="button" className="daybreak-primary-action" disabled={busy} onClick={sendCode}>
                  {busy ? t("auth.otp.sending") : t("account.delete.send_cta")}
                </button>
              )}
              <Link href="/you#account" className="daybreak-secondary-action !min-h-[2.875rem] !text-[0.8125rem]">
                {t("account.delete.keep_cta")}
              </Link>
            </div>
            {codeSent ? (
              <button
                type="button"
                disabled={busy}
                onClick={sendCode}
                className="-my-1 justify-self-start py-1 text-[13px] font-semibold text-[color:var(--day-ink-2)] underline decoration-[color:var(--day-line-strong)] underline-offset-[3px] transition-colors hover:text-[color:var(--day-ink)] hover:decoration-current disabled:opacity-60 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D5BA8]"
              >
                {t("account.delete.resend")}
              </button>
            ) : null}
          </div>
        </form>
      )}
    </section>
  );
}
