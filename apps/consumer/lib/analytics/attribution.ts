/**
 * Where a visitor came from: the label on the link they followed
 * (`?source=instagram&post=parent-toolkit-1`, or the utm_ tags ads add), or
 * the site that referred them. Kept in one first-party cookie so both the
 * browser (`trackEvent`) and server routes (checkout, persist) can read it.
 *
 * Two touches are kept: `first` never changes once set, so a family is
 * credited to the post that first brought them; `last` moves on every later
 * tagged or referred visit. Pure and isomorphic: no DOM or Next imports.
 */

export const ATTRIBUTION_COOKIE = "mmc_attr";
/** 180 days: long enough to cover a family deciding over a term. */
export const ATTRIBUTION_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

const SLUG = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const MAX_LANDING_LENGTH = 120;
const DIRECT = "direct";
const REFERRAL = "referral";

export interface AttributionTouch {
  source: string;
  post: string | null;
  medium: string | null;
  campaign: string | null;
  /** Path only, never the query string. */
  landing: string;
  at: string;
}

export interface AttributionState {
  first: AttributionTouch;
  last: AttributionTouch;
}

export interface AttributionRequest {
  url: URL;
  referer: string | null;
  now: string;
}

function slug(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return SLUG.test(normalized) ? normalized : null;
}

function firstParam(params: URLSearchParams, names: string[]): string | null {
  for (const name of names) {
    const value = slug(params.get(name));
    if (value) return value;
  }
  return null;
}

function externalReferrerHost(referer: string | null, ownHost: string): string | null {
  if (!referer) return null;
  try {
    const host = new URL(referer).hostname.replace(/^www\./, "");
    if (host === ownHost.replace(/^www\./, "")) return null;
    return slug(host);
  } catch {
    return null;
  }
}

/** What this one request says about where the visitor came from, if anything. */
function touchFromRequest({ url, referer, now }: AttributionRequest): AttributionTouch | null {
  const landing = url.pathname.slice(0, MAX_LANDING_LENGTH);
  const params = url.searchParams;
  const source = firstParam(params, ["source", "utm_source"]);
  if (source) {
    return {
      source,
      post: firstParam(params, ["post", "utm_content"]),
      medium: firstParam(params, ["utm_medium"]),
      campaign: firstParam(params, ["utm_campaign"]),
      landing,
      at: now,
    };
  }
  const referrer = externalReferrerHost(referer, url.hostname);
  if (referrer) {
    return { source: referrer, post: null, medium: REFERRAL, campaign: null, landing, at: now };
  }
  return null;
}

/**
 * The attribution to store after this request, or null when nothing changes
 * (a returning visitor clicking around the site). A first visit with no tag
 * and no outside referrer is recorded as `direct`.
 */
export function attributionFromRequest(
  current: AttributionState | null,
  request: AttributionRequest,
): AttributionState | null {
  const touch = touchFromRequest(request);
  if (current) return touch ? { first: current.first, last: touch } : null;
  const first = touch ?? {
    source: DIRECT,
    post: null,
    medium: null,
    campaign: null,
    landing: request.url.pathname.slice(0, MAX_LANDING_LENGTH),
    at: request.now,
  };
  return { first, last: first };
}

/** Plain JSON: the cookie layer (`response.cookies.set`) URL-encodes it. */
export function serializeAttribution(state: AttributionState): string {
  return JSON.stringify(state);
}

function parseTouch(raw: unknown): AttributionTouch | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const source = typeof value.source === "string" ? slug(value.source) : null;
  if (!source) return null;
  const optional = (key: string) => (typeof value[key] === "string" ? slug(value[key] as string) : null);
  return {
    source,
    post: optional("post"),
    medium: optional("medium"),
    campaign: optional("campaign"),
    landing: typeof value.landing === "string" ? value.landing.slice(0, MAX_LANDING_LENGTH) : "/",
    at: typeof value.at === "string" ? value.at : "",
  };
}

/**
 * Reads the cookie value back, either decoded (`request.cookies`) or still
 * URL-encoded (a raw header or `document.cookie`). Anything malformed or
 * tampered reads as none.
 */
export function parseAttributionCookie(value: string | undefined | null): AttributionState | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value.startsWith("{") ? value : decodeURIComponent(value));
    if (!parsed || typeof parsed !== "object") return null;
    const { first, last } = parsed as Record<string, unknown>;
    const firstTouch = parseTouch(first);
    if (!firstTouch) return null;
    return { first: firstTouch, last: parseTouch(last) ?? firstTouch };
  } catch {
    return null;
  }
}

/**
 * One key per utm tag, first touch and latest: `src` = utm_source (or
 * `source`), `post` = utm_content (or `post`), `medium`, `campaign`.
 */
export interface AttributionMetadata {
  src?: string;
  post?: string | null;
  medium?: string | null;
  campaign?: string | null;
  src_last?: string;
  post_last?: string | null;
  medium_last?: string | null;
  campaign_last?: string | null;
}

/** The short keys every analytics event carries, so reports can group by source. */
export function attributionMetadata(state: AttributionState | null): AttributionMetadata {
  if (!state) return {};
  return {
    src: state.first.source,
    post: state.first.post,
    medium: state.first.medium,
    campaign: state.first.campaign,
    src_last: state.last.source,
    post_last: state.last.post,
    medium_last: state.last.medium,
    campaign_last: state.last.campaign,
  };
}

/**
 * The same metadata from a raw `Cookie` header (server routes) or
 * `document.cookie` (browser); both use the `a=1; b=2` format.
 */
export function attributionFromCookieHeader(header: string | null | undefined): AttributionMetadata {
  const entry = header
    ?.split(/;\s*/)
    .find((part) => part.startsWith(`${ATTRIBUTION_COOKIE}=`));
  return attributionMetadata(parseAttributionCookie(entry?.slice(ATTRIBUTION_COOKIE.length + 1)));
}

/**
 * The first-touch labels that are set, as plain strings: what goes on a
 * Stripe session's metadata and a parent link's `attribution` column.
 */
export function attributionLabels(meta: AttributionMetadata): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const key of ["src", "post", "medium", "campaign"] as const) {
    const value = meta[key];
    if (typeof value === "string" && value) labels[key] = value;
  }
  return labels;
}
