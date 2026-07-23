"use client";

import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import {
  maskReplayText,
  sanitizeReplayUrl,
} from "@/lib/analytics/posthog-privacy";

const CONSENT_KEY = "tareeq.staging-replay-consent.v1";
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() ?? "";
const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://eu.i.posthog.com";
const replayEnabled =
  process.env.NEXT_PUBLIC_POSTHOG_ENABLED === "true" && posthogKey.length > 0;

type ReplayConsent = "granted" | "denied" | null;

let posthogInitialized = false;

function initializePostHog(): void {
  if (posthogInitialized) return;

  const config: Parameters<typeof posthog.init>[1] & {
    opt_out_useragent_filter: boolean;
  } = {
    api_host: posthogHost,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: true,
    disable_session_recording: true,
    // Automated UAT sessions still require explicit consent before initialization.
    opt_out_useragent_filter: true,
    persistence: "localStorage",
    person_profiles: "never",
    respect_dnt: true,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "*",
      maskTextFn: (text) => maskReplayText(text, window.location.pathname),
      blockSelector: ".ph-no-capture, [data-ph-no-capture]",
      captureCanvas: { recordCanvas: false },
      recordCrossOriginIframes: false,
      recordHeaders: false,
      recordBody: false,
      maskCapturedNetworkRequestFn: (request) => ({
        ...request,
        name: request.name ? sanitizeReplayUrl(request.name) : request.name,
      }),
    },
    before_send: (event) => {
      if (!event?.properties) return event;
      const properties = { ...event.properties };
      for (const key of ["$current_url", "$referrer", "$initial_referrer"]) {
        if (typeof properties[key] === "string") {
          properties[key] = sanitizeReplayUrl(properties[key]);
        }
      }
      return { ...event, properties };
    },
  };

  posthog.init(posthogKey, config);
  posthogInitialized = true;
}

function enableReplay(): void {
  initializePostHog();
  posthog.opt_in_capturing();
  posthog.startSessionRecording(true);
}

function disableReplay(): void {
  if (!posthogInitialized) return;
  posthog.stopSessionRecording();
  posthog.opt_out_capturing();
}

export function PostHogSessionReplay() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<ReplayConsent>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!replayEnabled) return;

    const saved = window.localStorage.getItem(CONSENT_KEY);
    if (saved === "granted") {
      setConsent("granted");
      enableReplay();
    } else if (saved === "denied") {
      setConsent("denied");
      disableReplay();
    }
    setReady(true);

    return () => {
      if (posthogInitialized) posthog.stopSessionRecording();
    };
  }, []);

  useEffect(() => {
    if (!replayEnabled || !ready || consent !== "granted") return;
    posthog.capture("$pageview", {
      $current_url: `${window.location.origin}${pathname}`,
      environment: "staging",
    });
  }, [consent, pathname, ready]);

  if (!replayEnabled || !ready || consent !== null) return null;

  const choose = (next: Exclude<ReplayConsent, null>) => {
    window.localStorage.setItem(CONSENT_KEY, next);
    setConsent(next);
    if (next === "granted") {
      enableReplay();
      posthog.capture("staging_replay_consent_granted", {
        environment: "staging",
      });
    } else {
      disableReplay();
    }
  };

  return (
    <aside
      aria-label="Staging session recording consent"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-xl border border-white/15 bg-[#1b1230] p-4 text-white shadow-2xl sm:bottom-5 sm:p-5"
    >
      <p className="text-sm font-semibold">Help us improve this test</p>
      <p className="mt-1 text-xs leading-5 text-white/75 sm:text-sm">
        Allow an anonymous session replay so we can spot delays and confusing
        steps. Emails, typed answers, Kai conversations, results, and account
        details are hidden.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => choose("denied")}
          className="min-h-10 border border-white/20 px-4 text-sm font-semibold text-white/80 hover:bg-white/10"
        >
          No thanks
        </button>
        <button
          type="button"
          onClick={() => choose("granted")}
          className="min-h-10 bg-[#f6c85f] px-4 text-sm font-bold text-[#1b1230] hover:bg-[#ffda7c]"
        >
          Allow recording
        </button>
      </div>
    </aside>
  );
}
