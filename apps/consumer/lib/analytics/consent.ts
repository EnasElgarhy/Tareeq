import type { AttributionMetadata } from "@/lib/analytics/attribution";

/**
 * The visitor's choice on the analytics cookie banner. PostHog only loads
 * after "granted"; "denied" is remembered so the banner does not come back.
 * Our own first-party events (`trackEvent`, the `mmc_attr` source cookie)
 * are not PostHog and run either way: they hold no personal data and are
 * what credits a payment to the post that brought the family.
 */

export type AnalyticsConsent = "granted" | "denied";

export const CONSENT_STORAGE_KEY = "mmc.analytics-consent.v1";
/** Dispatch on `window` to reopen the banner (the footer's "Cookie settings"). */
export const OPEN_CONSENT_EVENT = "mmc:open-cookie-settings";

export function readConsent(storage: Pick<Storage, "getItem"> | null): AnalyticsConsent | null {
  try {
    const value = storage?.getItem(CONSENT_STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function writeConsent(storage: Pick<Storage, "setItem"> | null, consent: AnalyticsConsent): void {
  try {
    storage?.setItem(CONSENT_STORAGE_KEY, consent);
  } catch {
    // Storage blocked: the choice holds for this page only.
  }
}

/** The utm labels as PostHog super properties, so every PostHog event carries them. */
export function posthogSourceProperties(meta: AttributionMetadata): Record<string, string> {
  const pairs: [string, string | null | undefined][] = [
    ["utm_source_first", meta.src],
    ["utm_medium_first", meta.medium],
    ["utm_campaign_first", meta.campaign],
    ["utm_content_first", meta.post],
    ["utm_source_latest", meta.src_last],
    ["utm_medium_latest", meta.medium_last],
    ["utm_campaign_latest", meta.campaign_last],
    ["utm_content_latest", meta.post_last],
  ];
  return Object.fromEntries(pairs.filter((pair): pair is [string, string] => Boolean(pair[1])));
}
