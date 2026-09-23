# Stripe integration — frozen contracts

Shared spec for the parallel build. **Do not change anything here without saying so** —
other tracks are coded against it.

Repo: `/Users/thisiswahba/Tareeq/apps/consumer` (Next 15 App Router, TS strict, pnpm via
`corepack pnpm@11.0.9`). Installed: `stripe@22.6.0`, `@stripe/stripe-js@9.15.0`,
`@stripe/react-stripe-js@6.8.2`.

## Env (already set in .env.local)

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…
STRIPE_SECRET_KEY=sk_test_…
STRIPE_PRICE_ID=price_1UAvYnACubWyG7EqrQQMTLdc   # 999 usd, one_time
STRIPE_WEBHOOK_SECRET=                            # filled by `stripe listen` in Phase 4
```

Price is **server-authoritative**: never accept an amount from the client.
`NEXT_PUBLIC_REPORT_LIST_PRICE_MINOR` (default 45000), `NEXT_PUBLIC_REPORT_OFFER_PERCENT` (default 20) and `NEXT_PUBLIC_REPORT_CURRENCY` (default AED) are display-only: the client shows the list price struck through, the percentage, and the resulting pay price (AED 450 → AED 360). The charge must be kept in step in Stripe — either a Price at the list amount plus a percentage coupon in `STRIPE_REPORT_COUPON_ID` (applied to every session as `discounts`), or a Price already at the pay amount with no coupon.

## Table: `public.report_entitlements`

```
id                       uuid pk default gen_random_uuid()
user_id                  uuid not null -> auth.users(id) on delete cascade
assessment_id            uuid not null -> public.assessments(id) on delete cascade
status                   text not null default 'active'  check in ('active','revoked')
stripe_session_id        text unique          -- webhook idempotency key
stripe_payment_intent_id text
amount_minor             integer
currency                 text
created_at               timestamptz not null default now()
revoked_at               timestamptz
unique (user_id, assessment_id)
```

RLS on. Owner may `select` own rows. Writes are service-role only.

## Identity

The entitlement key is **`(user_id, assessment_id)`** where `assessment_id` is
`public.assessments.id`. `reportIdFromGeneratedAt()` is display/local-cache only and must
not reach the server as an identity.

The user is already authenticated before the paywall renders — `/register` runs email OTP
and persists the assessment before routing to `/results`. Do not add a new auth step.

## Routes

### `POST /api/payments/checkout-session`

Auth required (`createSupabaseServerClient().auth.getUser()`), else 401.
Body: `{ assessmentId: string }`. Verify the row belongs to the caller, else 403.
If an active entitlement already exists → `409 { error: "already_owned" }`.

Creates a session with `ui_mode: "embedded"`, `mode: "payment"`,
`line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }]`,
`client_reference_id: assessmentId`, `metadata: { user_id, assessment_id }`,
`return_url` omitted (embedded uses `redirect: "if_required"` / completion event).

Returns `200 { clientSecret: string }`.

### `GET /api/payments/entitlement?assessmentId=…`

Auth required. Returns `200 { status: "active" | "none", unlockedAt?: string }`.
This is the **only** source of truth for unlock. Never trust the browser.

### `POST /api/payments/webhook`

`export const runtime = "nodejs"`. Read the **raw** body (`await request.text()`) and verify
with `stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET)`.
Return 400 on bad signature. Handle:

- `checkout.session.completed` (only when `payment_status === "paid"`) → record the
  paid entitlement: insert with `status='active', source='stripe'`; on conflict
  `stripe_session_id` do nothing (idempotent replay). On conflict
  `(user_id, assessment_id)`: reactivate a revoked row as paid, upgrade an active
  `admin_grant` row to paid (keeping `granted_by`/`granted_invite_id` audit), and
  never overwrite a different active paid transaction (acknowledge for manual
  reconciliation).
- `charge.refunded` → set `status='revoked'`, `revoked_at=now()`.
- `charge.dispute.created` → same revoke.

Always return 200 for handled/ignored events so Stripe stops retrying.

## Client seam

Keep the existing `ReportPaymentService` interface in
`lib/payments/report-payment-service.ts`. Add `stripeReportPaymentService` alongside the
mock; do not delete the mock. `restorePurchase` must call the entitlement route.
`localStorage` becomes a cache only — the server wins on conflict.

## Hard constraints

1. **Do not alter the results UI.** `ResultsScreen`, the result cards, and the report visual
   design stay exactly as they are. Only the checkout surface inside `CheckoutSheet` changes.
2. Keep every existing `trackEvent` call firing with the same names and payload shape.
3. Preserve EN/AR localization — new user-facing strings go through `lib/i18n/strings.ts`.
4. TypeScript strict must pass: `corepack pnpm@11.0.9 typecheck`.
5. Never log or echo `STRIPE_SECRET_KEY`.
