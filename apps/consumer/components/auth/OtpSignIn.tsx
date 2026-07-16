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
export function OtpSignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const { t } = useLocale();
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
      <form onSubmit={handleSend} className="glass-card grid gap-3 !p-4">
        <label className="grid gap-1.5">
          <span className="text-[12px] font-semibold text-sand/70">
            {t("auth.otp.email_label")}
          </span>
          <span className="relative">
            <Mail
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-carbon/45"
            />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-[52px] w-full rounded-2xl bg-sand py-3 pl-11 pr-4 text-[16px] font-semibold text-carbon outline-none shadow-sand-sm focus-visible:ring-2 focus-visible:ring-gold"
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
          className="btn-v2 btn-v2--primary w-full"
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
    <form onSubmit={handleVerify} className="glass-card grid gap-3 !p-4">
      <div className="rounded-2xl border border-sand/12 bg-sand/[0.06] p-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-sand/45">
          {t("auth.otp.code_label")}
        </p>
        <p className="mt-1 text-body-sm text-sand/70">
          {(() => {
            const [before, after] = t("auth.otp.code_sent_to").split("{email}");
            return (
              <>
                {before}
                <span className="font-semibold text-sand">{email}</span>
                {after}
              </>
            );
          })()}
        </p>
      </div>

      <input
        value={code}
        onChange={(event) => setCode(event.target.value)}
        className="h-14 w-full rounded-2xl bg-sand px-4 text-center text-[20px] font-bold tracking-[0.24em] text-carbon outline-none shadow-sand-sm focus-visible:ring-2 focus-visible:ring-gold"
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
        className="btn-v2 btn-v2--primary w-full"
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
        className="btn-v2 btn-v2--ghost-on-dark w-full"
        data-size="md"
      >
        {t("auth.otp.use_different_email")}
      </button>
    </form>
  );
}
