# Users Module — Architecture & Source-of-Truth Map

Operational Student & Account Management module for the Tareeq Admin CMS.
This documents the real data sources (audited, not assumed), what is built, and
what is gated behind an unapplied migration.

## Source-of-truth map (audited against the live schema)

| Field / metric | Real source | Notes |
|---|---|---|
| name, email, email_verified | `user_accounts` | The ONLY place real PII lives. RLS admin-read. |
| display_name, country, birth_year, gender, locale, role | `profiles` | Auto-created on signup (id + locale only). |
| registered_at | `profiles.created_at` | |
| assessments started / completed | `assessments` (by `user_id`) | `started_at` / `completed_at`. |
| CORE result (cluster, archetype, drivers…) | `assessments.result` jsonb | |
| results viewed / downloaded / shared | `analytics_events` (`results_viewed`, …) | keyed by `user_id_hash`. |
| Kai opened / sessions / plans saved / tasks | `analytics_events` (`kai_*`) | keyed by `user_id_hash`. |
| last_active_at | **derived** — max of `analytics_events.occurred_at` + assessment timestamps | No column exists. |
| account status | `user_accounts.deleted_at` only (+ `suspended_at` after migration) | No status enum today. |
| **Kai memory / plans content** | **localStorage only — NOT in Supabase** | CMS shows "Not available in CMS yet"; never faked. |
| **notes / flags / audit log** | **do not exist** — added by the gated migration | See below. |

**Honesty rule:** anything not collected renders as "Not collected" / "Not
available in CMS yet", never invented. Kai *conversation content* is never
exposed (localStorage-only today anyway).

### `analytics_events` join — ⚠ hash mismatch gotcha (resolve in Phase 3)

Events carry `user_id_hash`, never a raw id or PII. **Two different hashing
schemes exist in this codebase — do not confuse them:**

- **Consumer analytics** (`apps/consumer/lib/analytics/track.ts`): `user_id_hash = sha256("tareeq-analytics-v1:" + userId)` — full hex, fixed literal prefix, computed via WebCrypto. This is what actually lands in `analytics_events.user_id_hash`.
- **Admin research export** (`lib/admin/analytics/csv.ts` `hashUserId`): `sha256(ANALYTICS_HASH_SALT + ":" + userId).slice(0,16)` — a *different* salt and length, for anonymising CSV exports. **It does NOT match `analytics_events`.**

So to attribute Kai/activity events to a user, Phase 3 must replicate the
**consumer** algorithm server-side (node `crypto`, same `"tareeq-analytics-v1:"`
prefix, full hex), NOT reuse `csv.ts`. It must also confirm the hashed `userId`
is the auth uid (= `profiles.id`); if the consumer hashes a different id, the
join won't match and Kai aggregates must show "Not available" rather than 0.
Until confirmed, the list derives everything cleanly attributable from
`assessments` (FK `user_id`) and treats Kai counts as unverified — never faked.

## What is built (Phases 1–2, no migration required, verified)

Pure, deterministic, unit-tested foundation in `lib/admin/users/`:

- `types.ts` — `UserAggregate`, filters, sort keys, pagination, risk/engagement/timeline types.
- `risk.ts` — deterministic risk engine. Transparent reasons, explicit severities, **absence of data is never risk**. (`risk.test.ts`, 9 cases.)
- `engagement.ts` — deterministic engagement summary, separate from risk, positive factors only. (`engagement.test.ts`, 6 cases.)
- `filters.ts` / `sort.ts` / `pagination.ts` — allowlisted URL-param parsing (junk/injection falls back to safe defaults; per-page clamped). (`parsing.test.ts`.)
- `timeline.ts` — chronological journey assembly from real records, collapsing repeated milestone events to first occurrence. (`parsing.test.ts`.)

28 tests pass; `tsc` + `eslint` clean.

## What is gated (needs the migration applied — PENDING APPROVAL)

`supabase/migrations/202607150001_admin_users_module.sql` is **written but NOT
applied** (applying touches the shared production DB). It is fully additive:

- `admin_user_notes`, `admin_user_flags` (allowlisted taxonomy), `admin_audit_log`
- `user_accounts.suspended_at` (soft suspension, distinct from `deleted_at`)
- RLS admin-only, mirroring the existing `profiles.role = 'admin'` convention

Until it is applied, the Notes / Flags / Account-actions sections must render a
truthful "requires the pending migration" state — no fake writes.

## Remaining phases (next increment)

- **Phase 3** — `queries.ts` (service-role, house patterns: `Raw*`→`*Row` mappers, `select("*")` tolerance, batched `.in()` lookups, JS aggregation, offset pagination) assembling `UserAggregate` per user from existing tables. No migration needed for the READ path.
- **Phase 4** — Users list page: server-rendered table (existing `Table`/`Badge`/`PageHeader`), summary metrics, server-side search/filter/sort/pagination, URL-persisted filters.
- **Phase 5** — Student detail: Overview / Journey / Assessments / Kai / Plans("not in CMS yet") / Activity.
- **Phase 6–7** — Notes / flags / audit / account actions (**blocked on the migration**) + CSV export (existing `csv.ts` + `hashUserId`, filters-respecting, PII-excluded).
- **Phase 8** — browser verification + `USERS_MODULE_SUMMARY.md`.

## Constraints honored

Additive migration only (not applied); no deploy; no commit; no production-data
writes; no Kai conversation exposure; deterministic (non-LLM) scoring; existing
binary admin RBAC reused (`requireAdmin`); service-role stays server-only.
