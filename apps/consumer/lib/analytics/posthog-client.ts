import posthog from "posthog-js";
import { attributionFromCookieHeader } from "@/lib/analytics/attribution";
import {
  attemptDistinctId,
  profileProperties,
  utmProperties,
  type LaunchEventName,
  type LaunchProperties,
} from "@/lib/analytics/launch-events";
import { readLocalAssessment } from "@/lib/assessment/progress";
import { readResultRegistration } from "@/lib/results/storage";

/**
 * Sends the Friday-report events to PostHog from the browser. PostHog only
 * loads after the visitor accepts the cookie banner (AnalyticsConsent), so
 * every function here does nothing until then.
 */

const ONCE_KEY_PREFIX = "mmc.ph.once.";

function isCapturing(): boolean {
  return typeof window !== "undefined" && posthog.__loaded && !posthog.has_opted_out_capturing();
}

/** What every event carries: first-visit link tags, language, and the background groups. */
export function commonProperties(): LaunchProperties {
  const attempt = readLocalAssessment();
  return {
    ...utmProperties(attributionFromCookieHeader(document.cookie)),
    ...profileProperties({ locale: document.documentElement.lang || "en", answers: attempt?.answers }),
  };
}

export function captureLaunchEvent(name: LaunchEventName, properties: LaunchProperties = {}): void {
  try {
    if (!isCapturing()) return;
    posthog.capture(name, { ...commonProperties(), ...properties });
  } catch {
    // Tracking must never break the page.
  }
}

/**
 * Sends an event at most once per attempt on this device (for example
 * assessment_started), so going back and forth does not count twice.
 */
export function captureLaunchEventOnce(name: LaunchEventName, attemptId: string | null | undefined): void {
  if (!attemptId || !isCapturing()) return;
  const key = `${ONCE_KEY_PREFIX}${name}`;
  try {
    if (window.localStorage.getItem(key) === attemptId) return;
    window.localStorage.setItem(key, attemptId);
  } catch {
    return; // Storage blocked: skip rather than count on every screen.
  }
  captureLaunchEvent(name);
}

/**
 * Once the attempt is saved to an account, gives this browser the attempt's
 * anonymous ID, so the payment the server records joins the same journey.
 */
export async function linkAttemptToVisitor(): Promise<void> {
  try {
    const assessmentId = readResultRegistration()?.assessmentId;
    if (!assessmentId || !isCapturing()) return;
    const distinctId = await attemptDistinctId(assessmentId);
    if (posthog.get_distinct_id() !== distinctId) posthog.identify(distinctId);
  } catch {
    // Tracking must never break the page.
  }
}
