"use client";

import { useEffect } from "react";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { trackEvent } from "@/lib/analytics/track";

const LOGGED_KEY = "tareeq_visit_logged";

/**
 * Logs one `session_started` per analytics session: the "visits" line of the
 * weekly report. The event carries the visitor's source labels like every
 * other event (see lib/analytics/attribution.ts).
 */
export function VisitTracker() {
  useEffect(() => {
    try {
      const sessionId = getOrCreateSessionId();
      if (window.sessionStorage.getItem(LOGGED_KEY) === sessionId) return;
      window.sessionStorage.setItem(LOGGED_KEY, sessionId);
      trackEvent("session_started", { landing: window.location.pathname });
    } catch {
      // Storage blocked (private mode): skip the visit rather than log it on every page.
    }
  }, []);
  return null;
}
