"use client";

import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import { attributionFromCookieHeader } from "@/lib/analytics/attribution";
import {
  OPEN_CONSENT_EVENT,
  posthogSourceProperties,
  readConsent,
  writeConsent,
  type AnalyticsConsent as Consent,
} from "@/lib/analytics/consent";
import { assessmentScreen } from "@/lib/analytics/launch-events";
import {
  captureLaunchEvent,
  captureLaunchEventOnce,
  commonProperties,
  linkAttemptToVisitor,
} from "@/lib/analytics/posthog-client";
import { sanitizeReplayUrl } from "@/lib/analytics/posthog-privacy";
import { readLocalAssessment } from "@/lib/assessment/progress";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() ?? "";
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://eu.i.posthog.com";
const analyticsEnabled = process.env.NEXT_PUBLIC_POSTHOG_ENABLED === "true" && posthogKey.length > 0;

const COPY = {
  en: {
    label: "Cookie choice",
    body: "We'd like to use analytics cookies to see which parts of Map My CORE help and where people get stuck. We never record your answers, what you type or your chats with Kai.",
    decline: "Decline",
    accept: "Accept",
    privacy: "Privacy policy",
  },
  ar: {
    label: "اختيار ملفات تعريف الارتباط",
    body: "نودّ استخدام ملفات تعريف الارتباط التحليلية لنعرف أي أجزاء ماب ماي كور مفيدة وأين يتوقف الزوار. لا نسجّل إجاباتك أو ما تكتبه أو محادثاتك مع كاي.",
    decline: "رفض",
    accept: "موافقة",
    privacy: "سياسة الخصوصية",
  },
} as const;

let initialized = false;

function startPostHog(): void {
  if (!initialized) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      // Weekly-numbers brief of 19 Nov 2026, section 5: no autocapture, no
      // session recordings, no heatmaps, nothing typed into fields. These
      // are off in the PostHog project too; the code does not rely on that.
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: true,
      capture_heatmaps: false,
      capture_dead_clicks: false,
      disable_session_recording: true,
      disable_surveys: true,
      capture_performance: { web_vitals: true, network_timing: false },
      persistence: "localStorage+cookie",
      person_profiles: "identified_only",
      respect_dnt: true,
      before_send: (event) => {
        if (!event?.properties) return event;
        const properties = { ...event.properties };
        for (const key of ["$current_url", "$referrer", "$initial_referrer"]) {
          if (typeof properties[key] === "string") properties[key] = sanitizeReplayUrl(properties[key]);
        }
        return { ...event, properties };
      },
    });
    initialized = true;
  }
  posthog.opt_in_capturing();
  posthog.register(posthogSourceProperties(attributionFromCookieHeader(document.cookie)));
  void linkAttemptToVisitor();
}

function stopPostHog(): void {
  if (initialized) posthog.opt_out_capturing();
}

/** Follows <html lang>, which LocaleProvider keeps in step with the chosen language. */
function useDocumentLanguage(): "en" | "ar" {
  const [lang, setLang] = useState<"en" | "ar">("en");
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setLang(el.lang === "ar" ? "ar" : "en");
    read();
    const observer = new MutationObserver(read);
    observer.observe(el, { attributes: true, attributeFilter: ["lang"] });
    return () => observer.disconnect();
  }, []);
  return lang;
}

/**
 * The analytics cookie banner (28 Oct update: PostHog, with consent). Shown
 * once until the visitor chooses; "Cookie settings" in the footer reopens it.
 */
export function AnalyticsConsent() {
  const pathname = usePathname();
  const lang = useDocumentLanguage();
  const [consent, setConsent] = useState<Consent | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!analyticsEnabled) return;
    const saved = readConsent(window.localStorage);
    setConsent(saved);
    setOpen(saved === null);
    if (saved === "granted") startPostHog();
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  useEffect(() => {
    if (consent !== "granted") return;
    posthog.capture("$pageview", {
      ...commonProperties(),
      $current_url: `${window.location.origin}${pathname}`,
    });
    const screen = assessmentScreen(pathname);
    if (screen) captureLaunchEvent("screen_viewed", { screen });
    // The end screen is only reached once every question is answered.
    if (pathname === "/done") {
      captureLaunchEventOnce("assessment_finished", readLocalAssessment()?.assessmentId);
    }
    void linkAttemptToVisitor();
  }, [consent, pathname]);

  if (!analyticsEnabled || !open) return null;

  const copy = COPY[lang];
  const choose = (next: Consent) => {
    writeConsent(window.localStorage, next);
    setConsent(next);
    setOpen(false);
    if (next === "granted") startPostHog();
    else stopPostHog();
  };

  return (
    <aside
      aria-label={copy.label}
      dir={lang === "ar" ? "rtl" : "ltr"}
      lang={lang}
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-[100] mx-auto max-w-lg rounded-[22px] border border-white/12 bg-[#100A24] p-4 text-[#F5EEE6] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)] sm:p-5"
    >
      <p className={`text-[13.5px] leading-relaxed text-[#E6DFF5] ${lang === "ar" ? "font-arabic" : ""}`}>
        {copy.body}{" "}
        <a href="/privacy-policy" className="font-semibold text-[#F4C660] underline-offset-2 hover:underline">
          {copy.privacy}
        </a>
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => choose("denied")}
          className="min-h-11 rounded-full border border-white/20 px-5 text-sm font-semibold text-[#F5EEE6] transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4C660]"
        >
          {copy.decline}
        </button>
        <button
          type="button"
          onClick={() => choose("granted")}
          className="min-h-11 rounded-full bg-gradient-to-b from-[#F8D47E] to-[#F0B94A] px-6 text-sm font-bold text-[#14101F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4C660]"
        >
          {copy.accept}
        </button>
      </div>
    </aside>
  );
}
