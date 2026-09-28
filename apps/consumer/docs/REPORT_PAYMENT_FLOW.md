# Report payment flow

Stripe **Embedded Checkout**, one-time payment, server-verified entitlement.
Build plan and rationale: [STRIPE_INTEGRATION_PLAN.md](./STRIPE_INTEGRATION_PLAN.md).
Frozen interface spec: [STRIPE_CONTRACTS.md](./STRIPE_CONTRACTS.md).

## The rule everything else follows

**The browser never grants access.** Embedded Checkout firing `onComplete` is not proof of
payment — it only means the form submitted. Access is granted solely by a signed Stripe
webhook writing a `report_entitlements` row, and the client learns about it by asking
`GET /api/payments/entitlement`. `localStorage` is a cache, never a source of truth.

## Flow

```
/assessment  ->  /register  ->  email OTP (real Supabase session)
                               POST /api/assessments/persist -> { ok, assessmentId }
             ->  /results   ->  paywall preview
                               "Unlock" -> POST /api/payments/checkout-session
                                        -> { clientSecret }
                               <EmbeddedCheckout> (Stripe iframe, in our sheet)
                               onComplete -> poll GET /api/payments/entitlement
                                          -> status:"active" -> unlock

  meanwhile, out of band:
  Stripe -> POST /api/payments/webhook -> report_entitlements row (the real grant)
```

The user is already signed in before the paywall renders, so checkout adds no auth step.

## Identity

The entitlement key is **`(user_id, assessments.id)`**. `reportIdFromGeneratedAt()` survives
only as the `localStorage` cache key — it is derived from a client timestamp and must never
reach the server as an identity.

`persistAssessment()` in `RegistrationScreen.tsx` stays deliberately fail-open, so the stored
`assessmentId` can be missing. `lib/results/assessment-identity.ts` repairs that from the
server (`GET /api/assessments/current`) before checkout rather than blocking the user.

## Routes

| Route | Returns |
|---|---|
| `POST /api/payments/checkout-session` | `200 { clientSecret }`; `401` unauthenticated; `403` not the caller's assessment (also `403` when absent, so ids can't be enumerated); `409 already_owned`; `502 checkout_unavailable` |
| `GET /api/payments/entitlement?assessmentId=` | `200 { status: "active", unlockedAt }` or `200 { status: "none" }`; `500` on DB fault — deliberately **not** `none`, since reporting a paid report as unowned is the worst failure here |
| `POST /api/payments/webhook` | `200 { received: true, outcome }` for handled and ignored events alike; `400` on missing/invalid signature |

The session is created with `ui_mode: "embedded"` and `redirect_on_completion: "never"`, so
there is no `return_url` and no success page to forge. The price is read from
`STRIPE_PRICE_ID` **server-side** — a tampered request cannot change the amount.

## Webhook idempotency

Stripe retries and can deliver duplicates. Correctness is enforced by the database, not by
bookkeeping:

- Grants insert `on conflict (stripe_session_id) do nothing returning id`. An empty return
  *is* "already processed" — no read-then-write race.
- The `(user_id, assessment_id)` unique constraint is handled explicitly: a `23505` against a
  still-active row is a no-op (and logs a possible-duplicate-charge warning worth a manual
  refund check); against a `revoked` row it reactivates, covering refund-then-repurchase.
- Revocations filter on `status = 'active'`, so a redelivered refund updates zero rows and
  `revoked_at` is written exactly once.
- Unhandled event types return 200 — a 500 would make Stripe retry forever.
- A DB fault on a *handled* event returns 500 on purpose, so Stripe redelivers. The rules
  above make redelivery safe.

## Configuration

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY   pk_test_… / pk_live_…
STRIPE_SECRET_KEY                    server only, never logged
STRIPE_PRICE_ID                      authoritative price
STRIPE_WEBHOOK_SECRET                from `stripe listen`, or the dashboard endpoint
NEXT_PUBLIC_REPORT_PRICE_MINOR       display only (default 999)
NEXT_PUBLIC_REPORT_CURRENCY          display only (default USD)
```

The `NEXT_PUBLIC_REPORT_*` pair only formats the price shown in the sheet. Stripe charges the
Price object regardless — keep them reconciled or the sheet will advertise the wrong number.

## Local testing

```bash
corepack pnpm@11.0.9 dev                     # or ./node_modules/.bin/next dev -p 3010
stripe listen --forward-to localhost:3010/api/payments/webhook
```

`stripe listen` prints the `whsec_…` that must be in `STRIPE_WEBHOOK_SECRET`.

Test cards: `4242 4242 4242 4242` succeeds, `4000 0025 0000 3155` forces 3DS,
`4000 0000 0000 9995` declines. Replay delivery with
`stripe trigger checkout.session.completed`.

`mockReportPaymentService` is still exported and still works offline for UI work without
Stripe. Its failure hook now lives on `createCheckoutSession` (an email containing `+fail@`),
because the embedded flow has no second round-trip left to fail in.

## Known limitation: purchases are single-browser

The generated `PersonalizedCompassReport` lives **only in `localStorage`** —
`/api/results/generate` performs no database write. So while the *entitlement* is server-side
and does follow the user across devices, the *report content* does not: signing in elsewhere
unlocks a report that isn't stored there.

Closing this means either persisting the generated report or regenerating it server-side from
the stored `answers`. It touches the results path and was deliberately left out of the payment
work.

## Before accepting real money

- [ ] Apply `supabase/migrations/202609010001_report_entitlements.sql` (`scripts/apply_stripe_migration.mts`)
- [ ] Swap to the Tareeq Stripe account — the current one is a different, unactivated account
      (`charges_enabled: false`)
- [ ] Live keys, live Price, and a production webhook endpoint (its `whsec_` differs from the CLI's)
- [ ] Confirm the real price and currency, and reconcile `NEXT_PUBLIC_REPORT_PRICE_MINOR`
- [ ] Stripe Dashboard → Branding (Embedded Checkout takes no client-side `appearance` option)
- [ ] Real Terms, Privacy, refund policy, and support links in the sheet footer
- [ ] Decide the single-browser limitation above
