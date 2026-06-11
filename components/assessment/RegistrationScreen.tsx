"use client";

import { ArrowRight, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { KaiChromaVideo } from "@/components/brand/KaiChromaVideo";
import { uiSounds } from "@/lib/audio/ui-sounds";
import { readLocalAssessment } from "@/lib/assessment/progress";
import {
  createEmptyResultConsent,
  readResultRegistration,
  writeResultRegistration,
} from "@/lib/results/storage";
import type { ConsentAgeGate } from "@/lib/results/types";

function createVerificationCode() {
  const values = new Uint32Array(1);
  window.crypto.getRandomValues(values);
  return String(100000 + (values[0] % 900000));
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function RegistrationScreen() {
  const router = useRouter();
  const existingRegistration = useMemo(() => readResultRegistration(), []);
  const [name, setName] = useState(existingRegistration?.name ?? "");
  const [email, setEmail] = useState(existingRegistration?.email ?? "");
  const [verificationCode, setVerificationCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [error, setError] = useState("");
  const [codeSent, setCodeSent] = useState(false);
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

  function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      setError("Enter the name you want on your Compass.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    uiSounds.advance();
    setName(trimmedName);
    setEmail(trimmedEmail);
    setVerificationCode(createVerificationCode());
    setEnteredCode("");
    setCodeSent(true);
    setError("");
  }

  function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (enteredCode.trim() !== verificationCode) {
      setError("That code does not match yet.");
      return;
    }

    uiSounds.confirm();
    const canOptIn = ageGate !== "minor";
    writeResultRegistration({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      verifiedAt: new Date().toISOString(),
      consent: {
        ...createEmptyResultConsent(ageGate),
        generalResearch: canOptIn && generalResearch,
        longitudinalFollowup: canOptIn && longitudinalFollowup,
        universitySharing: canOptIn && universitySharing,
      },
    });
    router.push("/analyzing");
  }

  const canOptIntoResearch = ageGate !== "minor";

  return (
    <section className="anim-screen-enter flex flex-1 flex-col gap-4">
      <div className="relative mx-auto flex h-[150px] w-[150px] items-center justify-center">
        <div
          aria-label="Kai, your guide"
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
          One more step
        </span>
        <h1 className="text-display-2 max-w-[12ch] text-sand">
          Save your Compass.
        </h1>
        <p className="text-body-sm max-w-[34ch] text-sand/70">
          Kai needs a verified contact before building the final report. Your
          email is kept out of the AI prompt.
        </p>
      </div>

      {!codeSent ? (
        <form onSubmit={handleSendCode} className="glass-card grid gap-3 !p-4">
          <label className="grid gap-1.5">
            <span className="text-[12px] font-semibold text-sand/70">Name</span>
            <span className="relative">
              <UserRound
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-carbon/45"
              />
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-[52px] w-full rounded-2xl bg-sand py-3 pl-11 pr-4 text-[16px] font-semibold text-carbon outline-none shadow-sand-sm focus-visible:ring-2 focus-visible:ring-gold"
                placeholder="Your name"
                autoComplete="name"
              />
            </span>
          </label>

          <label className="grid gap-1.5">
            <span className="text-[12px] font-semibold text-sand/70">
              Email address
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

          <div className="grid gap-2 rounded-2xl border border-sand/10 bg-sand/[0.045] p-3">
            <div className="grid gap-1">
              <p className="text-[12px] font-bold text-sand">
                Optional research consent
              </p>
              <p className="text-[11px] leading-snug text-sand/55">
                These are opt-in and unchecked by default. Declining will not
                change your result.
              </p>
              {!canOptIntoResearch ? (
                <p className="rounded-xl bg-night/35 px-3 py-2 text-[11px] leading-snug text-sand/58">
                  Research opt-in is off because this response is marked under
                  18. You can still receive your Compass.
                </p>
              ) : null}
            </div>

            <ConsentToggle
              checked={generalResearch}
              disabled={!canOptIntoResearch}
              label="Use my anonymized answers for CORE research."
              onChange={setGeneralResearch}
            />
            <ConsentToggle
              checked={longitudinalFollowup}
              disabled={!canOptIntoResearch}
              label="Contact me later to learn how my path is going."
              onChange={setLongitudinalFollowup}
            />
            <ConsentToggle
              checked={universitySharing}
              disabled={!canOptIntoResearch}
              label="Share anonymized insights with university partners."
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
          >
            Send verification code
            <ArrowRight size={18} />
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="glass-card grid gap-3 !p-4">
          <div className="rounded-2xl border border-sand/12 bg-sand/[0.06] p-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-sand/45">
              Verification code
            </p>
            <p className="mt-1 text-body-sm text-sand/70">
              Enter the 6-digit code for{" "}
              <span className="font-semibold text-sand">{email}</span>.
            </p>
            <p className="mt-2 rounded-xl bg-night/45 px-3 py-2 text-center text-[22px] font-bold tracking-[0.22em] text-gold">
              {verificationCode}
            </p>
            <p className="mt-2 text-[11px] leading-snug text-sand/45">
              Prototype mode shows the code here. In production this connects to
              an email provider.
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
          >
            Verify and analyze
            <ArrowRight size={18} />
          </button>

          <button
            type="button"
            onClick={() => {
              setCodeSent(false);
              setError("");
            }}
            className="btn-v2 btn-v2--ghost-on-dark w-full"
            data-size="md"
          >
            Edit details
          </button>
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
