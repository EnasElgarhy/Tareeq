"use client";

import { ArrowRight, Mail } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  OTP_MAX_LENGTH,
  OTP_MIN_LENGTH,
  sendEmailOtp,
  verifyEmailOtp,
} from "@/lib/auth/otp";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Email-OTP sign-in card for returning users (e.g. the signed-out profile).
 * Shares the same Supabase OTP flow as registration; calls `onSignedIn` once a
 * session is established.
 */
export function OtpSignIn({
  onSignedIn,
  variant = "default",
}: {
  onSignedIn: () => void;
  variant?: "default" | "daybreak";
}) {
  const { t } = useLocale();
  const isDaybreak = variant === "daybreak";
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      setError(t("auth.otp.invalid_email"));
      return;
    }
    setError("");
    setSending(true);
    const { ok, error: otpError } = await sendEmailOtp(trimmed);
    setSending(false);
    if (!ok) {
      setError(otpError ?? t("auth.otp.send_failed"));
      return;
    }
    setEmail(trimmed);
    setCode("");
    setSent(true);
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.trim().length < OTP_MIN_LENGTH) {
      setError(t("auth.otp.invalid_code_length"));
      return;
    }
    setError("");
    setVerifying(true);
    const { ok, error: otpError } = await verifyEmailOtp(
      email.trim().toLowerCase(),
      code.trim(),
    );
    if (!ok) {
      setVerifying(false);
      setError(otpError ?? t("auth.otp.verify_failed"));
      return;
    }
    onSignedIn();
  }

  if (!sent) {
    return (
      <form
        onSubmit={handleSend}
        className={
          isDaybreak
            ? "rounded-story grid gap-3 border border-[color:var(--day-line)] bg-[color:var(--day-card)] p-4 shadow-[var(--day-shadow-card)] lg:p-5"
            : "glass-card grid gap-3 !p-4"
        }
      >
        <label className="grid gap-1.5">
          <span
            className={
              isDaybreak
                ? "text-[12px] font-semibold text-[color:var(--day-ink-2)]"
                : "text-[12px] font-semibold text-sand/70"
            }
          >
            {t("auth.otp.email_label")}
          </span>
          <span className="relative">
            <Mail
              size={17}
              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${isDaybreak ? "text-[color:var(--day-ink-3)]" : "text-carbon/45"}`}
            />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={
                isDaybreak
                  ? "h-[52px] w-full rounded-[10px] border border-[color:var(--day-line)] bg-[color:var(--day-inset)] py-3 pl-11 pr-4 text-[16px] font-semibold text-[color:var(--day-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[#6D5BA8]"
                  : "h-[52px] w-full rounded-2xl bg-sand py-3 pl-11 pr-4 text-[16px] font-semibold text-carbon outline-none shadow-sand-sm focus-visible:ring-2 focus-visible:ring-gold"
              }
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
            />
          </span>
        </label>

        {error ? (
          <p role="alert" className="text-[12px] font-semibold text-error">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className={
            isDaybreak
              ? "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#221248] px-5 text-[14px] font-bold text-[#FFFCF6] shadow-[0_12px_24px_rgba(34,18,72,0.2)] transition hover:bg-[#34205F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5BA8] focus-visible:ring-offset-2"
              : "btn-v2 btn-v2--primary w-full"
          }
          data-size="lg"
          disabled={sending}
        >
          {sending ? t("auth.otp.sending") : t("auth.otp.send_cta")}
          <ArrowRight size={18} />
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleVerify}
      className={
        isDaybreak
          ? "rounded-story grid gap-3 border border-[color:var(--day-line)] bg-[color:var(--day-card)] p-4 shadow-[var(--day-shadow-card)] lg:p-5"
          : "glass-card grid gap-3 !p-4"
      }
    >
      <div
        className={
          isDaybreak
            ? "rounded-[10px] border border-[color:var(--day-line)] bg-[color:var(--day-inset)] p-3"
            : "rounded-2xl border border-sand/12 bg-sand/[0.06] p-3"
        }
      >
        <p
          className={
            isDaybreak
              ? "daybreak-eyebrow"
              : "text-[12px] font-semibold uppercase text-sand/45"
          }
        >
          {t("auth.otp.code_label")}
        </p>
        <p className={`mt-1 text-body-sm ${isDaybreak ? "text-[color:var(--day-ink-2)]" : "text-sand/70"}`}>
          {(() => {
            const [before, after] = t("auth.otp.code_sent_to").split("{email}");
            return (
              <>
                {before}
                <span className={isDaybreak ? "font-semibold text-[color:var(--day-ink)]" : "font-semibold text-sand"}>{email}</span>
                {after}
              </>
            );
          })()}
        </p>
      </div>

      <input
        value={code}
        onChange={(event) => setCode(event.target.value)}
        className={
          isDaybreak
            ? "h-14 w-full rounded-[10px] border border-[color:var(--day-line)] bg-[color:var(--day-inset)] px-4 text-center text-[20px] font-bold text-[color:var(--day-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[#6D5BA8]"
            : "h-14 w-full rounded-2xl bg-sand px-4 text-center text-[20px] font-bold text-carbon outline-none shadow-sand-sm focus-visible:ring-2 focus-visible:ring-gold"
        }
        placeholder={"0".repeat(OTP_MIN_LENGTH)}
        inputMode="numeric"
        maxLength={OTP_MAX_LENGTH}
      />

      {error ? (
        <p role="alert" className="text-[12px] font-semibold text-error">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className={
          isDaybreak
            ? "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#221248] px-5 text-[14px] font-bold text-[#FFFCF6] shadow-[0_12px_24px_rgba(34,18,72,0.2)] transition hover:bg-[#34205F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5BA8] focus-visible:ring-offset-2"
            : "btn-v2 btn-v2--primary w-full"
        }
        data-size="lg"
        disabled={verifying}
      >
        {verifying ? t("auth.otp.verifying") : t("auth.otp.signin_cta")}
        <ArrowRight size={18} />
      </button>

      <button
        type="button"
        onClick={() => {
          setSent(false);
          setError("");
        }}
        className={
          isDaybreak
            ? "inline-flex h-10 w-full items-center justify-center rounded-full border border-[color:var(--day-line)] bg-transparent px-4 text-[13px] font-bold text-[color:var(--day-ink-2)] transition hover:bg-[color:var(--day-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5BA8]"
            : "btn-v2 btn-v2--ghost-on-dark w-full"
        }
        data-size="md"
      >
        {t("auth.otp.use_different_email")}
      </button>
    </form>
  );
}
