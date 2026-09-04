# Stripe integration plan

Supersedes the "Stripe integration TODO" list in [REPORT_PAYMENT_FLOW.md](./REPORT_PAYMENT_FLOW.md).

Decisions taken: **Embedded Checkout** (Stripe's form inside our existing `CheckoutSheet`),
account exists but keys not yet fetched, price stays env-driven until the client confirms it.

## 1. How the flow is actually built today

Tracing the real code, not the docs:

```
/assessment (localStorage)
   -> /register   RegistrationScreen.tsx
                  sendEmailOtp -> verifyEmailOtp        => REAL Supabase session
                  persistAssessment() -> POST /api/assessments/persist
                                         => row in `assessments` (one per user+version)
   -> /results    ResultsScreen -> ReportAccessExperience -> CheckoutSheet
```

**The key finding: the user is already authenticated before the paywall renders.**
Registration is email-OTP against Supabase and happens *before* results. So keying the
entitlement to `user_id` costs zero extra friction — the sign-in step already exists. That
settles the open entitlement question in the affirmative, with no new auth work.

### Three gaps that block a server-backed entitlement

| # | Gap | Where | Impact |
|---|-----|-------|--------|
| 1 | `persistAssessment()` is deliberately fail-open (`catch {}`) | `RegistrationScreen.tsx:52` | The `assessments` row may not exist at checkout time. Fine for results, not for money. |
| 2 | `reportIdFromGeneratedAt()` derives the ID from a localStorage timestamp | `lib/payments/report-access.ts:53` | Not a server-resolvable identity. Unusable as an entitlement key. |
| 3 | The `PersonalizedCompassReport` is **localStorage-only** — never written to the DB | `lib/results/storage.ts:9`; `/api/results/generate` does no DB write | An entitlement restored on a second device unlocks a report that isn't there. |

### What is already right

`ReportPaymentService` (`lib/payments/report-payment-service.ts`) is a clean four-method
interface with `mockReportPaymentService` behind it, and `ReportAccessExperience` is its only
consumer. Swapping in a Stripe implementation is a contained change — the paywall UI, the
analytics events, and the access state machine all stay as they are.

## 2. Entitlement model

Key the entitlement to **`(user_id, assessment_id)`**, with `assessments.id` becoming the
report's server identity in place of the timestamp-derived string.

`localStorage` is demoted from source of truth to cache: it may unlock the UI optimistically,
but the server re-checks on load and wins on conflict. The browser success URL never grants
access — only the verified webhook does.

## 3. Phases

Sized so each is one focused work session with a tight file list.

### Phase 0 — Dashboard prep (no code)
You do this in Stripe; I need the output.
- Product + one-time Price for the complete report (test mode).
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`.
- `brew install stripe/stripe-cli/stripe` for local webhook forwarding.

### Phase 1 — Schema
`supabase/migrations/<ts>_report_entitlements.sql`: `report_entitlements` table
(`user_id`, `assessment_id`, `status`, `stripe_session_id`, `stripe_payment_intent_id`,
`amount_minor`, `currency`, `created_at`, `revoked_at`), unique on
`(user_id, assessment_id)`, unique on `stripe_session_id` for webhook idempotency.
RLS: owner reads own; service role writes. Remember `NOTIFY pgrst, 'reload schema'`.

### Phase 2 — Server-addressable report identity
- `/api/assessments/persist` returns the inserted `assessments.id`.
- Store it alongside the local registration; add an `ensureAssessmentRecord` path so a
  fail-open miss is repaired before checkout rather than blocking it.
- Thread the real ID into `ReportAccessExperience` in place of `reportIdFromGeneratedAt`.

### Phase 3 — Checkout session route
`POST /api/payments/checkout-session` — auth required, `ui_mode: "embedded"`, price read
from `STRIPE_PRICE_ID` server-side (never trusted from the client), `client_reference_id` =
assessment ID, metadata carries `user_id`. Returns `client_secret`.
`GET /api/payments/entitlement?assessmentId=` — server truth for restore.

### Phase 4 — Webhook
`POST /api/payments/webhook` — raw body, `stripe.webhooks.constructEvent` signature check,
idempotent upsert on `stripe_session_id`. Handles `checkout.session.completed`,
`charge.refunded`, `charge.dispute.created` (revoke on the last two).

### Phase 5 — Client swap
`stripeReportPaymentService` implementing the existing interface; mount
`<EmbeddedCheckoutProvider>` inside `CheckoutSheet` where the mock test-payment area is now;
`restorePurchase` hits the entitlement route instead of reading localStorage.
Keep every existing analytics event firing.

### Phase 6 — Tests and verification
Unit tests for entitlement resolution and webhook idempotency; update
`e2e/report-payment-wall.spec.ts` for the embedded flow; `stripe trigger` + `stripe listen`
replay; test cards including `4000 0025 0000 3155` (3DS) and `4000 0000 0000 9995` (decline).

### Phase 7 — Go-live
Live keys, real Price, production webhook endpoint, Terms/Privacy/refund/support links
(items 7 of the old TODO), and the `NEXT_PUBLIC_REPORT_PRICE_MINOR` display value reconciled
against the server-authoritative Stripe Price.

## 4. Deferred, needs a call

**Cross-device report delivery (gap 3).** The entitlement will travel across devices after
Phase 4, but the report content will not, because it lives only in the buyer's browser. Two
options: persist the generated report (new column or table, written by
`/api/results/generate`), or regenerate it server-side on demand from the stored `answers`.
This is real scope and touches the results path, so it is not folded into the phases above.
Until it is done, a purchase is effectively single-browser.

**Price and currency.** Stays at the `999`/`USD` placeholder until confirmed. The Stripe
Price is authoritative at charge time regardless.

## 5. Contract note

`docs/PROJECT_COMPLETION_PLAN.md` records Stripe test-card payment as a Milestone 3 closure
criterion, pending the client supplying the account. Phases 0–6 satisfy it; Phase 7 and the
deferred item above are what remain for final closure.
