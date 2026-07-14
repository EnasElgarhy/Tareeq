"use client";

import { ArrowRight, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { KaiChromaVideo } from "@/components/brand/KaiChromaVideo";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { sendEmailOtp, verifyEmailOtp } from "@/lib/auth/otp";
import { uiSounds } from "@/lib/audio/ui-sounds";
import { readLocalAssessment } from "@/lib/assessment/progress";
import {
  createEmptyResultConsent,
  readResultRegistration,
  writeResultRegistration,
} from "@/lib/results/storage";
import type { ConsentAgeGate } from "@/lib/results/types";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Persist the completed assessment to the signed-in account. Fail-open: a DB
 *  hiccup must never block the user from seeing their result. */
async function persistAssessment(name: string, locale: string) {
  try {
    const progress = readLocalAssessment();
    if (!progress?.result) return;
    await fetch("/api/assessments/persist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: progress.answers,
        result: progress.result,
        locale,
        name,
        startedAt: progress.startedAt,
      }),
    });
  } catch {
    // fail-open — the result still shows from local state.
  }
}

export function RegistrationScreen() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const existingRegistration = useMemo(() => readResultRegistration(), []);
  const [name, setName] = useState(existingRegistration?.name ?? "");
  const [email, setEmail] = useState(existingRegistration?.email ?? "");
  const [enteredCode, setEnteredCode] = useState("");
  const [error, setError] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [ageGate, setAgeGate] = useState<ConsentAgeGate>("unknown");
  const [generalResearch, setGeneralResearch] = useState(
    existingRegistration?.consent.generalResearch ?? false,
  );
  const [longitudinalFollowup, setLongitudinalFollowup] = useState(
    existingRegistration?.consent.longitudinalFollowup ?? false,
  );
  const [universitySharing, setUniversitySharing] = useState(
    existingRegistration?.consent.universitySharing ?? false,
  );

  useEffect(() => {
    const progress = readLocalAssessment();
    if (!progress?.completedAt || !progress.result) {
      router.replace("/start");
      return;
    }

    const nextAgeGate =
      progress.answers.QD1 === "A" || progress.answers.QD1 === "B"
        ? "minor"
        : progress.answers.QD1 === "C" ||
            progress.answers.QD1 === "D" ||
            progress.answers.QD1 === "E"
          ? "adult"
          : "unknown";

    setAgeGate(nextAgeGate);
    if (nextAgeGate === "minor") {
      setGeneralResearch(false);
      setLongitudinalFollowup(false);
      setUniversitySharing(false);
    }
  }, [router]);

  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      setError(t("register.name_error"));
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError(t("register.email_error"));
      return;
    }

    setError("");
    setSending(true);
    const { ok, error: otpError } = await sendEmailOtp(trimmedEmail, trimmedName);
    setSending(false);
    if (!ok) {
      setError(otpError ?? t("register.send_error_fallback"));
      return;
    }

    uiSounds.advance();
    setName(trimmedName);
    setEmail(trimmedEmail);
    setEnteredCode("");
    setCodeSent(true);
  }

  async function handleResend() {
    if (sending) return;
    setError("");
    setSending(true);
    const { ok, error: otpError } = await sendEmailOtp(
      email.trim().toLowerCase(),
      name.trim(),
    );
    setSending(false);
    if (!ok) setError(otpError ?? t("register.resend_error_fallback"));
    else uiSounds.advance();
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = enteredCode.trim();

    if (code.length < 6) {
      setError(t("register.code_length_error"));
      return;
    }

    setError("");
    setVerifying(true);
    const trimmedEmail = email.trim().toLowerCase();
    const { ok, error: otpError } = await verifyEmailOtp(trimmedEmail, code);
    if (!ok) {
      setVerifying(false);
      setError(otpError ?? t("register.verify_error_fallback"));
      return;
    }

    uiSounds.confirm();
    const canOptIn = ageGate !== "minor";
    const trimmedName = name.trim();
    writeResultRegistration({
      name: trimmedName,
      email: trimmedEmail,
      verifiedAt: new Date().toISOString(),
      consent: {
        ...createEmptyResultConsent(ageGate),
        generalResearch: canOptIn && generalResearch,
        longitudinalFollowup: canOptIn && longitudinalFollowup,
        universitySharing: canOptIn && universitySharing,
      },
    });

    // Save the result to their account (non-blocking).
    void persistAssessment(trimmedName, locale);

    router.push("/analyzing");
  }

  const canOptIntoResearch = ageGate !== "minor";

  return (
    <section className="anim-screen-enter flex flex-1 flex-col gap-4">
      <div className="relative mx-auto flex h-[150px] w-[150px] items-center justify-center">
        <div
          aria-label={t("kai.guide_aria")}
          role="img"
          className="anim-kai-drop relative z-10"
        >
          <div className="anim-kai-drop-bob">
            {/* No narration here — Kai rests on a closed-mouth frame so she
                doesn't murmur silently; the CSS float keeps her alive. */}
            <KaiChromaVideo
              src="/kai/kai-mentor-green.mp4"
              size={168}
              playing={false}
              restTime={2.3}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <span className="chip chip--violet-on-dark w-fit">
          <ShieldCheck size={13} />
          {t("register.eyebrow")}
        </span>
        <h1 className="text-display-2 max-w-[12ch] text-sand">
          {t("register.headline")}
        </h1>
        <p className="text-body-sm max-w-[34ch] text-sand/70">
          {t("register.subtitle")}
        </p>
      </div>

      {!codeSent ? (
        <form onSubmit={handleSendCode} className="glass-card grid gap-3 !p-4">
          <label className="grid gap-1.5">
            <span className="text-[12px] font-semibold text-sand/70">
              {t("register.name_label")}
            </span>
            <span className="relative">
              <UserRound
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-carbon/45"
              />
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-[52px] w-full rounded-2xl bg-sand py-3 pl-11 pr-4 text-[16px] font-semibold text-carbon outline-none shadow-sand-sm focus-visible:ring-2 focus-visible:ring-gold"
                placeholder={t("register.name_placeholder")}
                autoComplete="name"
              />
            </span>
          </label>

          <label className="grid gap-1.5">
            <span className="text-[12px] font-semibold text-sand/70">
              {t("register.email_label")}
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
                dir="ltr"
              />
            </span>
          </label>

          <div className="grid gap-2 rounded-2xl border border-sand/10 bg-sand/[0.045] p-3">
            <div className="grid gap-1">
              <p className="text-[12px] font-bold text-sand">
                {t("register.consent_title")}
              </p>
              <p className="text-[11px] leading-snug text-sand/55">
                {t("register.consent_body")}
              </p>
              {!canOptIntoResearch ? (
                <p className="rounded-xl bg-night/35 px-3 py-2 text-[11px] leading-snug text-sand/58">
                  {t("register.consent_minor_notice")}
                </p>
              ) : null}
            </div>

            <ConsentToggle
              checked={generalResearch}
              disabled={!canOptIntoResearch}
              label={t("register.consent_general")}
              onChange={setGeneralResearch}
            />
            <ConsentToggle
              checked={longitudinalFollowup}
              disabled={!canOptIntoResearch}
              label={t("register.consent_followup")}
              onChange={setLongitudinalFollowup}
            />
            <ConsentToggle
              checked={universitySharing}
              disabled={!canOptIntoResearch}
              label={t("register.consent_university")}
              onChange={setUniversitySharing}
            />
          </div>

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
            {sending ? t("register.sending") : t("register.send_code_cta")}
            <ArrowRight size={18} />
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="glass-card grid gap-3 !p-4">
          <div className="rounded-2xl border border-sand/12 bg-sand/[0.06] p-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-sand/45">
              {t("register.code_label")}
            </p>
            <p className="mt-1 text-body-sm text-sand/70">
              {t("register.code_sent_before")}{" "}
              <span className="font-semibold text-sand" dir="ltr">{email}</span>
              {t("register.code_sent_after")}
            </p>
            <p className="mt-2 text-[11px] leading-snug text-sand/45">
              {t("register.code_help")}
            </p>
          </div>

          <input
            value={enteredCode}
            onChange={(event) => setEnteredCode(event.target.value)}
            className="h-14 w-full rounded-2xl bg-sand px-4 text-center text-[20px] font-bold tracking-[0.24em] text-carbon outline-none shadow-sand-sm focus-visible:ring-2 focus-visible:ring-gold"
            placeholder="000000"
            inputMode="numeric"
            maxLength={6}
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
            {verifying ? t("register.verifying") : t("register.verify_cta")}
            <ArrowRight size={18} />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setCodeSent(false);
                setError("");
              }}
              className="btn-v2 btn-v2--ghost-on-dark w-full"
              data-size="md"
            >
              {t("register.edit_details_cta")}
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={sending}
              className="btn-v2 btn-v2--ghost-on-dark w-full"
              data-size="md"
            >
              {sending ? t("register.sending") : t("register.resend_cta")}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function ConsentToggle({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start gap-2 text-[11px] leading-snug ${
        disabled ? "text-sand/35" : "text-sand/68"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 accent-gold disabled:opacity-45"
      />
      <span>{label}</span>
    </label>
  );
}
