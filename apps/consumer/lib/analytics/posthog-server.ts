import "server-only";

import type { LaunchEventName, LaunchProperties } from "@/lib/analytics/launch-events";

/**
 * Sends one event to PostHog from the server: the payment confirmed by
 * Stripe and a parent opening their link. Neither depends on a browser tab
 * staying open. Uses the project's public key (the same one the browser
 * uses); there is no secret here. Never throws: a dropped event must not
 * fail the request that recorded it.
 */

const CAPTURE_PATH = "/i/v0/e/";
const CAPTURE_TIMEOUT_MS = 3000;

function config(): { key: string; host: string } | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() ?? "";
  if (process.env.NEXT_PUBLIC_POSTHOG_ENABLED !== "true" || !key) return null;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://eu.i.posthog.com";
  return { key, host: host.replace(/\/$/, "") };
}

export async function capturePostHogServerEvent(
  name: LaunchEventName,
  distinctId: string,
  properties: LaunchProperties,
): Promise<void> {
  const settings = config();
  if (!settings) return;
  try {
    const response = await fetch(`${settings.host}${CAPTURE_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: settings.key,
        event: name,
        distinct_id: distinctId,
        timestamp: new Date().toISOString(),
        // No IP-based location for server events: the IP is our server's.
        properties: { ...properties, $geoip_disable: true, $lib: "mmc-server" },
      }),
      signal: AbortSignal.timeout(CAPTURE_TIMEOUT_MS),
    });
    if (!response.ok) console.error(`[posthog] ${name} not recorded (${response.status})`);
  } catch (error) {
    console.error(`[posthog] ${name} not recorded`, error instanceof Error ? error.message : error);
  }
}
