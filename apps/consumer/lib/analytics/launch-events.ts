import type { AttributionMetadata } from "@/lib/analytics/attribution";

/**
 * The events the Friday report reads from PostHog (weekly-numbers brief of
 * 19 Nov 2026, sections 3 to 5). Pure and isomorphic: the browser and the
 * Stripe webhook build the same properties from the same rules.
 *
 * Privacy (section 5): no names, emails, answers, report content or Kai
 * conversations. The only facts taken from the background questions are the
 * three the brief lists, each reduced to a coarse group.
 */

export const LAUNCH_EVENT_NAMES = [
  "screen_viewed",
  "assessment_started",
  "assessment_finished",
  "registered",
  "parent_link_sent",
  "parent_link_opened",
  "report_paid",
  "kai_opened",
] as const;

export type LaunchEventName = (typeof LAUNCH_EVENT_NAMES)[number];

export type LaunchProperties = Record<string, string | number>;

const DIRECT = "direct";
const ATTEMPT_ID_SALT = "mmc-posthog-v1:";
const ATTEMPT_ID_LENGTH = 24;

const COUNTRY_GROUPS: Readonly<Record<string, string>> = {
  "United Arab Emirates": "UAE",
  "Saudi Arabia": "Saudi Arabia",
  Egypt: "Egypt",
};

const AGE_GROUPS: Readonly<Record<string, string>> = {
  "AGE-13-15": "13-17",
  "AGE-16-17": "13-17",
  "AGE-18-19": "18-21",
  "AGE-20-21": "18-21",
  "AGE-22P": "22+",
};

const STUDY_STAGES: Readonly<Record<string, string>> = {
  "QD3-A": "Grade 7-8",
  "QD3-B": "Grade 9-10",
  "QD3-C": "Grade 11-12",
  "QD3-D": "Gap year",
  "QD3-E": "College or diploma",
  "QD3-F": "University year 1-2",
  "QD3-G": "University year 3+",
  "QD3-H": "Not studying",
};

/** The link tags of the first visit; a visit with no tags counts as "direct". */
export function utmProperties(meta: AttributionMetadata): LaunchProperties {
  const properties: LaunchProperties = { utm_source: meta.src || DIRECT };
  if (meta.medium) properties.utm_medium = meta.medium;
  if (meta.campaign) properties.utm_campaign = meta.campaign;
  if (meta.post) properties.utm_content = meta.post;
  return properties;
}

export interface AttemptFacts {
  locale?: string | null;
  /** Background answers by question ID (QD1 age, QD2 country, QD3 stage). */
  answers?: Readonly<Record<string, unknown>> | null;
}

/** Language, country, stage of study and age group, each only once known. */
export function profileProperties({ locale, answers }: AttemptFacts): LaunchProperties {
  const properties: LaunchProperties = {};
  if (locale) properties.language = locale.toLowerCase().startsWith("ar") ? "AR" : "EN";

  const answer = (id: string) => {
    const value = answers?.[id];
    return typeof value === "string" ? value : null;
  };
  const country = answer("QD2");
  if (country) properties.country = COUNTRY_GROUPS[country] ?? "other";
  const stage = STUDY_STAGES[answer("QD3") ?? ""];
  if (stage) properties.stage_of_study = stage;
  const ageGroup = AGE_GROUPS[answer("QD1") ?? ""];
  if (ageGroup) properties.age_group = ageGroup;
  return properties;
}

/**
 * The screen name for an assessment route, or null for any other page.
 * Question screens are named by QuestionScreen, which knows the number.
 */
export function assessmentScreen(pathname: string): string | null {
  const fixed: Readonly<Record<string, string>> = {
    "/start": "start",
    "/intro": "meet_kai",
    "/contract": "promises",
    "/about-you": "background_intro",
    "/done": "end",
    "/register": "registration",
  };
  if (fixed[pathname]) return fixed[pathname];
  const part = /^\/part\/([1-4])$/.exec(pathname);
  return part ? `part_${part[1]}_intro` : null;
}

/** Paid amount in dirhams, or null when the payment was not in AED. */
export function amountAed(amountMinor: number | null, currency: string | null): number | null {
  if (amountMinor === null || currency?.toLowerCase() !== "aed") return null;
  return amountMinor / 100;
}

/**
 * The anonymous ID one attempt has in PostHog, the same in the browser and
 * on the server, so a payment recorded by the webhook joins the visit that
 * led to it. A one-way hash: PostHog never receives the assessment ID.
 */
export async function attemptDistinctId(assessmentId: string): Promise<string> {
  const data = new TextEncoder().encode(`${ATTEMPT_ID_SALT}${assessmentId}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `attempt_${hex.slice(0, ATTEMPT_ID_LENGTH)}`;
}
