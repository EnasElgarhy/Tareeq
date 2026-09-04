import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * The browser-side Stripe.js handle.
 *
 * `loadStripe` injects the Stripe.js `<script>` and resolves once it is
 * ready. Calling it during a render would inject a fresh script tag and build
 * a new `Stripe` instance on every re-render, so it is invoked exactly once
 * here at module scope and the resulting promise is shared by every consumer.
 *
 * Safe to import from a client component that Next also renders on the
 * server: with no `window`, `loadStripe` resolves `null` without touching the
 * DOM.
 *
 * Only the publishable key ever reaches this file. The secret key lives in
 * `lib/payments/stripe-server.ts` and must never be imported from here.
 */

// Referenced as a complete `process.env.NEXT_PUBLIC_*` expression so Next can
// inline the literal at build time — `process.env` is not enumerable in the
// browser bundle, so a computed lookup would silently read `undefined`.
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

const stripePromise: Promise<Stripe | null> = publishableKey
  ? loadStripe(publishableKey, {
      // Follows `<html lang>`, which LocaleProvider keeps in sync with the
      // chosen locale, so the embedded form speaks the same language as the
      // sheet around it.
      locale: "auto",
    })
  : // A missing publishable key is a deployment fault, not a user error.
    // Resolving `null` lets the checkout surface render its own "payments
    // unavailable" state instead of throwing during module evaluation and
    // taking the whole results page down with it.
    Promise.resolve(null);

/** The shared Stripe.js promise. Never call `loadStripe` anywhere else. */
export function getStripe(): Promise<Stripe | null> {
  return stripePromise;
}

/**
 * Whether a publishable key was compiled into this bundle. The checkout
 * surface checks this before mounting Embedded Checkout so a misconfigured
 * deployment shows a readable message rather than an empty frame.
 */
export function isStripeConfigured(): boolean {
  return publishableKey.length > 0;
}
