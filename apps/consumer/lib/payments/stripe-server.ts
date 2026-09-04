import Stripe from "stripe";

/**
 * Server-only Stripe client. Never import this from client code — it reads
 * `STRIPE_SECRET_KEY`, and that value must never reach the browser or a log.
 *
 * The client is built lazily and memoized rather than at module scope. A
 * top-level `new Stripe(...)` would throw during import in any environment
 * that has not configured Stripe yet (CI, a preview build, a developer
 * running only the assessment flow), and in the App Router that failure
 * would surface on unrelated routes that merely share a chunk. Building on
 * first use keeps a missing key scoped to the payment routes that need it.
 */

/**
 * Pinned deliberately. In `stripe@22.6.0` the `apiVersion` config field is
 * typed as the literal `LatestApiVersion`, so this string must match
 * `stripe/esm/apiVersion.d.ts` exactly or `tsc --noEmit` fails. Bumping the
 * SDK means bumping this line in the same commit.
 */
const STRIPE_API_VERSION = "2026-08-26.dahlia" as const;

type StripeEnvVar =
  | "STRIPE_SECRET_KEY"
  | "STRIPE_PRICE_ID"
  | "STRIPE_WEBHOOK_SECRET";

let cachedClient: Stripe | null = null;

/**
 * Reads a required Stripe environment variable. The thrown message names the
 * missing variable but never echoes a value — all three of these are secrets
 * or near-secrets, and this error is allowed to reach a server log.
 */
function requireStripeEnv(name: StripeEnvVar): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Stripe is not configured: ${name} is missing from the environment.`,
    );
  }
  return value;
}

/**
 * The shared Stripe client. Throws if `STRIPE_SECRET_KEY` is absent — callers
 * are route handlers and must translate that into a 5xx, never into a silent
 * "payment unavailable" that looks like a normal empty result.
 */
export function getStripeClient(): Stripe {
  if (cachedClient) return cachedClient;
  cachedClient = new Stripe(requireStripeEnv("STRIPE_SECRET_KEY"), {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
    // Stripe's own exponential backoff. It attaches an idempotency key to
    // each retried write, so a retried session create cannot double-charge.
    maxNetworkRetries: 2,
  });
  return cachedClient;
}

/**
 * The report price, resolved server-side on every checkout. The amount is
 * never accepted from the client — see docs/STRIPE_CONTRACTS.md.
 */
export function getStripePriceId(): string {
  return requireStripeEnv("STRIPE_PRICE_ID");
}

/** The signing secret used to verify inbound webhook payloads. */
export function getStripeWebhookSecret(): string {
  return requireStripeEnv("STRIPE_WEBHOOK_SECRET");
}
