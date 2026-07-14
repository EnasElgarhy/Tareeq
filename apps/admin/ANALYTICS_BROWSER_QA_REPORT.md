# Analytics Browser QA Report

**Date:** 2026-07-01 (QA pass); **updated 2026-07-02** (fix session — see bottom section).
**Scope:** `/admin/analytics` (all 6 tabs) on `feat/hybrid-assessment`, browser-tested end to end for the first time (no Playwright was available in the environment that built Phase 1 / Phase 1.5 / Phase 2 — see `ANALYTICS_PHASE_1_SUMMARY.md` and `ANALYTICS_INSTRUMENTATION.md`).
**Constraints honored:** no new features built, nothing committed, nothing deployed, no real content published/modified, question-level analytics not touched.

> **Status as of 2026-07-02:** the CRITICAL (event ingestion) and the two lower-severity findings (export UX, Data Quality tile) below have all been **fixed and verified**. See [Fix Session — 2026-07-02](#fix-session--2026-07-02) at the end of this report for what changed and how it was verified. The QA findings below are left as originally written (as-found record).

**Environment:** Admin CMS dev server on `localhost:3020` (`./node_modules/.bin/next dev -p 3020`, existing process, reused not restarted). Playwright + Chromium installed to a scratch location outside the repo (`PLAYWRIGHT_BROWSERS_PATH` overridden — the repo's own `node_modules`/`package.json`/`pnpm-lock.yaml` were not touched). DB verified directly via `psql` against the live Supabase Postgres instance (`.env.local`'s `DATABASE_URL`).

## Summary

Every page renders correctly and nothing 500s at the UI layer. But the thing this QA pass was specifically designed to catch — a real event actually landing in `analytics_events` — **fails every time**, silently, everywhere it's called. That's the one CRITICAL finding below and it should be fixed before Phase 2 is considered functional, even though the UI itself looks done.

## Tabs tested

| Tab | HTTP status | Console errors | Renders correctly |
|---|---|---|---|
| Overview | 200 | 0 | ✅ |
| Assessments | 200 | 0 | ✅ |
| Audience | 200 | 0 | ✅ |
| Quality | 200 | 0 | ✅ |
| Research | 200 | 0 | ✅ |
| Exports | 200 | 0 | ✅ |

Login (`ahmedwahbn22@gmail.com`) succeeded first try, redirected to `/admin/content`, no errors.

## What passed

- **No 500s on any of the 6 analytics pages**, cold-loaded and after tab navigation.
- **Seed data renders correctly.** Overview shows Total Assessments **4** (of 5 raw `assessments` rows — the 5th has `completed_at: null`, correctly excluded, matching the documented behavior in `ANALYTICS_PHASE_1_SUMMARY.md`), Completion Rate 80%, Avg. Completion Time 150 min, and the Growth charts (Assessments completed / New users / Completion rate / Retakes) all draw real spike lines from that data — see `screenshots/tab-overview.png`.
- **0-event charts don't break anything.** `analytics_events` has 0 rows (see below) and every chart/section that depends on it degraded to an explicit empty state instead of crashing or rendering `NaN`/`undefined`: Research Consent shows "—% · No data yet · Not collected yet", AI Insights shows "Not enough historical data yet to surface insights," Retakes chart renders a flat empty line rather than erroring.
- **Filters render correctly** (From/To date, Assessment, Country, Age, Gender, Records, Completed-only/Consented-only checkboxes, Apply/Reset) on every tab. Could not fully exercise "pick a different value → results change" because Country/Age/Gender dropdowns only have one option ("All") in the current seed data — this matches the known gap in `ANALYTICS_PHASE_1_SUMMARY.md` ("Country/gender are sparse... anonymous/guest completions show as Unknown"), not a bug in the filter mechanism itself. The Overview's own Alerts panel confirms this: *"Demographic data is mostly missing — 100% of respondents have no country or gender on file."*
- **No PII in analytics tables.** Scanned all 6 tabs' rendered text for email addresses; the only hit on every page is `ahmedwahbn22@gmail.com` — that's the logged-in admin's own account shown in the sidebar "signed in as" widget (`components/admin` shell chrome), not a respondent record. Verified in the raw HTML that it's inside the sidebar identity block, not any analytics table/card. No respondent names or emails appear anywhere in the Overview/Assessments/Audience/Quality/Research tables.
- **Export UI's own guard fires correctly at the code level.** `lib/admin/analytics/csv.ts:38-42` throws a clear, specific error (`"ANALYTICS_HASH_SALT is not set..."`) instead of silently falling back to a guessable default salt — confirmed by hitting `/api/admin/analytics/export?type=summary` directly (see below).

## What failed

### 🔴 CRITICAL — event ingestion is completely broken; `analytics_events` has never received a row

Per the task, I POSTed one safe synthetic `page_view` event directly to the public ingestion endpoint (`/api/analytics/ingest`) from inside the logged-in browser session — the same code path any real `trackEvent()` call uses — instead of triggering it via a UI action that would "publish or modify content." No `page_view` call site actually exists in the app yet (confirmed in `ANALYTICS_INSTRUMENTATION.md`: "no existing UI concept maps to these yet"), so this was the only safe way to exercise the pipeline without violating the "don't modify real content" constraint.

**Result:** HTTP 500, `{"error":"there is no unique or exclusion constraint matching the ON CONFLICT specification"}`.

**Root cause (confirmed by reading both sides):**
- `supabase/migrations/202607010001_analytics_instrumentation.sql:38-39` creates a **partial** unique index: `create unique index ... on analytics_events(event_id) where event_id is not null`.
- `app/api/analytics/ingest/route.ts:63` calls `.upsert(rows, { onConflict: "event_id", ignoreDuplicates: true })`, which Postgres translates to `ON CONFLICT (event_id) DO NOTHING` — with **no `WHERE` predicate**. Postgres requires the `ON CONFLICT` target to exactly match an existing unique constraint or index (partial indexes only qualify if the same predicate is restated in the `ON CONFLICT` clause itself, which supabase-js's `.upsert()` doesn't do). There is no plain (non-partial) unique constraint on `event_id`, so Postgres can't find a matching arbiter and rejects every upsert.

**Impact — this is not just my test event.** `trackEvent()` (`lib/analytics/track.ts:104-125`) is explicitly designed to **never surface an error to the caller** ("Tracking must never surface an error to the caller — a dropped event is an acceptable failure mode, a crashed page/action is not") and the `catch` block is empty — no logging, no reporting. That means **all 9 real call sites wired in `ANALYTICS_INSTRUMENTATION.md`** (`assessment_created`, `assessment_published`, `ai_generation_started/completed/failed`, etc., in both this repo and the consumer app) have been hitting this exact same 500 and silently dropping every event since the migration was applied — which is why `analytics_events` has 0 rows despite real admin activity (5 assessments exist) and despite the migration being live. This was previously undiagnosed because nothing anywhere surfaces the failure.

**Confirmed via DB query after the test:** `SELECT count(*) FROM analytics_events` → **0** both before and after the test POST — the row never landed, exactly as the 500 predicted.

**Not fixed** — out of scope per this task's instructions (QA/report only, no new features). The fix is almost certainly either (a) drop the partial predicate and make it a plain `unique (event_id)` index/constraint, since `event_id` is always populated by every real caller (`buildEvent()` in `track.ts` always sets it via `crypto.randomUUID()`), or (b) change the upsert call to pass an `ignoreDuplicates`-compatible plain constraint. Recommend (a) — the partial predicate doesn't appear to protect anything real, since `event_id` is never actually null in practice.

### 🟡 MEDIUM — Export buttons will dump the admin onto a raw JSON error page today

`components/admin/analytics/ExportPanel.tsx` renders the three export actions as plain `<a href="/api/admin/analytics/export?type=...">` links, not intercepted `fetch` calls. Right now, with `ANALYTICS_HASH_SALT` unset, clicking **any** of the three export buttons (Summary / Anonymized rows / Flagged records) navigates the whole tab to `/api/admin/analytics/export?...`, which returns the raw JSON `{"error":"ANALYTICS_HASH_SALT is not set..."}` at HTTP 500 — no toast, no inline message, no "go back" affordance. The backend behavior itself is correct and safe (loud failure, no default-salt fallback, no PII/stack-trace leak in the body); the gap is purely UX polish for the moment the salt is missing. Confirmed by direct `GET` request (see raw body above) and by reading the component source.

### 🟢 LOW — Data Quality Score tile is ambiguous between "no data" and "real 0%"

On Overview, the "DATA QUALITY SCORE" tile shows **0%** with a **"No data yet"** chip, while the Alerts panel directly below simultaneously reports *"Data quality score is 0% — 5 records flagged for review"* as a real, actionable alert. Both can't be true at once — either it's a real computed 0% (5/5 records flagged) and the "No data yet" chip is misleading, or it's a placeholder and the Alerts panel is over-claiming precision. Not a crash, just a small trust/consistency issue worth a follow-up look. Screenshot: `screenshots/tab-overview.png`.

## DB rows observed

```
-- Before test
SELECT count(*) FROM analytics_events;  →  0

-- Test event sent (event_id 7bf89564-a105-4ff3-8450-ff30014d12f2), ingest responded 500

-- After test
SELECT count(*) FROM analytics_events;  →  0   (event never landed — matches the 500)
SELECT * FROM analytics_events WHERE metadata->>'qa_marker' = 'browser-qa-2026-07-01';  →  0 rows

-- Reference: seed data the dashboard is reading
SELECT count(*) FROM assessments;  →  5   (4 completed, 1 in-progress — matches the "Total Assessments: 4" tile)
```

So: **event_id present, session_id present, no name/email in the payload, metadata was valid JSON** (`{"qa_marker":"browser-qa-2026-07-01","path":"/admin/analytics"}`) — the *event I constructed* satisfied every shape requirement in `lib/analytics/events.ts`'s `analyticsEventSchema`. It never reached a row because the **database write itself fails** before any of that matters. This is a schema/migration bug, not a payload or validation bug.

## `ANALYTICS_HASH_SALT` — requirement (documenting per task ask)

- **Required for:** the Exports tab's "Anonymized assessment rows" and "Flagged records" CSV exports (`lib/admin/analytics/csv.ts:37-43`, `hashUserId()`). Not required for the Summary export or for any of the dashboard read views (Overview/Assessments/Audience/Quality/Research) — those don't call `hashUserId`.
- **Current state:** not set in `.env.local`. Confirmed by direct API call returning the exact guard error.
- **What it should be:** any long, random secret string (e.g. `openssl rand -hex 32`), kept out of git, distinct from any other app secret. It's mixed with each `user_id` before hashing (`sha256(salt:userId)`) specifically so someone with a CSV export can't brute-force back to real user ids from a known id list — rotating it would silently break correlation between old and new exports (new hashes for the same user), so treat it as a set-once, don't-rotate-casually secret once real exports start being used downstream.
- **Action needed:** add `ANALYTICS_HASH_SALT=<random-secret>` to `.env.local` (and to whatever env the app deploys to later) before the Exports tab's row/flagged CSVs can be used for anything real. This wasn't done as part of this QA pass since it's an environment/secrets decision, not a code or verification task.

## Remaining blockers before production

1. **CRITICAL:** Fix the `event_id` unique index / `ON CONFLICT` mismatch (`supabase/migrations/202607010001_analytics_instrumentation.sql:38-39` vs `app/api/analytics/ingest/route.ts:63`). Until this is fixed, **zero analytics events will ever be recorded**, from any of the 9 wired call sites in either repo, and every dashboard number that depends on `analytics_events` (currently just the funnel's two bottom stages) will silently stay at zero forever, not just "until traffic arrives."
2. Set `ANALYTICS_HASH_SALT` before anyone relies on the Anonymized-rows or Flagged-records exports.
3. Decide on UX for export failures (toast/inline error instead of raw JSON navigation) — low effort, but currently a real "looks broken" moment for whoever clicks Export before the salt is set.
4. Re-verify the ingestion fix with the exact same test-event method used here once the index issue is patched, to confirm a real row lands with `event_id`/`session_id` populated and no PII — this report's method (`fetch` to `/api/analytics/ingest` from the browser) is reusable for that follow-up check.
5. Reconcile the Data Quality Score "No data yet" vs. real-0%-with-alert inconsistency (low priority, cosmetic).
6. Question-level events (`question_viewed`, etc.) and true abandonment tracking remain explicitly out of scope, per this task's instructions and the original Phase 2 deferral.

## Screenshots

Saved outside the repo (scratch QA session): `/Users/thisiswahba/.claude/jobs/8b856a6e/tmp/qa-playwright/screenshots/` — `00-post-login.png`, `tab-overview.png`, `tab-assessments.png`, `tab-audience.png`, `tab-quality.png`, `tab-research.png`, `tab-exports.png`, `filters-after.png`. Not copied into the repo since this task said not to commit anything; happy to move them in if useful for a PR later.

---

## Fix Session — 2026-07-02

Constraints honored: no new features, nothing committed, nothing deployed. All three findings above were fixed. Nothing outside the analytics surface was touched.

### 1. 🔴 CRITICAL — event ingestion — FIXED

**Change:** new additive migration `supabase/migrations/202607010002_analytics_event_id_unique_fix.sql`:
- `drop index if exists analytics_events_event_id_key;` (removed the partial index)
- `alter table analytics_events alter column event_id set not null;` — safe because the table had 0 rows and both writers (`app/api/analytics/ingest/route.ts` in this repo and in the Tareeq consumer repo) always populate `event_id` from the validated Zod schema before insert; there is no other write path into this table.
- `alter table analytics_events add constraint analytics_events_event_id_key unique (event_id);` — a plain (non-partial) unique constraint, which is what `.upsert(..., { onConflict: "event_id" })` needs to find a matching arbiter.
- `notify pgrst, 'reload schema';` — reloads PostgREST's schema cache per the existing project convention (see `project_trubuild... ` memory / `scripts/reload_schema_cache.mts` precedent).

Applied directly to the live dev Supabase Postgres via `psql` (not through a script) — verified after: `event_id` is `NOT NULL`, and `pg_indexes` shows `analytics_events_event_id_key` with no `WHERE` clause.

**No application code change was needed** — the ingest route's `.upsert(valid.map(toDbRow), { onConflict: "event_id", ignoreDuplicates: true })` was already correct; it just had nothing valid to conflict against. This is identical in both repos, and the fix is DB-only (one shared Supabase project), so it fixes ingestion for **both** the admin CMS and the Tareeq consumer app at once — no changes needed in the consumer repo.

**Verified (HTTP + DB, via the browser session, same method as the original QA pass):**
1. POST a synthetic `page_view` event to `/api/analytics/ingest` → **HTTP 200**, `{"inserted":1,"rejected":0}` (previously 500).
2. POST the exact same event a second time (same `event_id`) → **HTTP 200** again.
3. `SELECT count(*) FROM analytics_events WHERE event_id = '<id>'` → **1** (not 2) — confirms the upsert's `ignoreDuplicates` now actually dedupes, proving true idempotency, not just "didn't crash twice."
4. Row content inspected directly: `event_id` present, `session_id` present (`"qa-fix-verify-session"`), `user_id_hash` empty/null (none was sent), `metadata` is a valid `jsonb` object (`jsonb_typeof` → `object`), no name/email anywhere in the row.
5. Test rows deleted after verification (`DELETE ... WHERE metadata->>'qa_marker' LIKE 'browser-qa%'`) — table is back to 0 rows, ready for real traffic, not left polluted with synthetic data.

**tsc / tests:** `./node_modules/.bin/tsc --noEmit` clean (0 errors) in Tareeq-admin. Full suite `./node_modules/.bin/vitest run` — **288/288 passing** (286 pre-existing + 2 new, see fix #3 below). Consumer repo's shared analytics test copy (`lib/analytics`, 32 tests) also re-run: all passing (unaffected — the fix was DB-only).

### 2. 🟡 MEDIUM — export UX for missing `ANALYTICS_HASH_SALT` — FIXED

**Change:**
- `app/admin/(shell)/analytics/exports/page.tsx`: computes `saltConfigured = Boolean(process.env.ANALYTICS_HASH_SALT)` server-side, passes it to `ExportPanel`.
- `components/admin/analytics/ExportPanel.tsx`: now takes a `saltConfigured: boolean` prop. When `false`, renders an `InlineStatus` (the existing house error-banner component, same one used on the login page) reading **"Export unavailable: ANALYTICS_HASH_SALT is not configured."**, and renders the three export actions as `disabled` `<button>` elements instead of `<a href>` links — so there is no navigation to the raw JSON API response at all while the salt is missing. When `true`, behavior is unchanged (live links to the export route).

**Verified (browser):** with the salt still unset, reloaded `/admin/analytics/exports` — the warning banner renders with the exact copy above, all 3 buttons report as `disabled`, and there are **zero** `<a href="/api/admin/analytics/export...">` links on the page (confirmed via Playwright locator counts: `disabled buttons = 3`, `live links = 0`). Screenshot: `screenshots/exports-fixed.png`.

**Not verified (documented gap, see below):** the "salt configured → real export succeeds" happy path — see the `ANALYTICS_HASH_SALT` note below for why.

**Related, not fixed:** while reading `app/api/admin/analytics/export/route.ts` to scope this fix, found that its `exporters` object literal builds **all three** CSVs (`buildSummaryCsv`, `buildAnonymizedRowsCsv`, `buildFlaggedRowsCsv`) unconditionally before picking one by `type` — so today, *any* export type (including `summary`, which doesn't itself call `hashUserId`) fails if the salt is missing, because the other two branches throw during object construction. This is why the original QA pass saw `type=summary` itself 500. The new disabled-state UI in `ExportPanel` sidesteps this correctly (all three are disabled together while the salt is missing, which matches current reality), but the eager-evaluation itself is a small latent inefficiency worth a follow-up (make the three branches lazy, e.g. a `switch` instead of an object literal) — not fixed here since it's a performance/code-quality nit, not a behavior bug once the salt is set.

### 3. 🟢 LOW — Data Quality tile "No data yet" vs. real-0%-alarm — FIXED

**Root cause:** `comparePointsWithBaseline()` (`lib/admin/analytics/aggregate.ts`) decided "no data yet" vs. "new" purely from `current > 0` when there's no previous-period baseline. That's correct for count-shaped metrics (0 really does mean "nothing happened"), but wrong for a **score/percentage** metric that can be a real, meaningful 0% on real data — exactly the Data Quality Score case here (5/5 current-period records flagged → genuinely 0% clean, not "no data"). `completionRatePct` and `researchConsentRatePct` share the identical latent bug shape (just didn't happen to show it in this seed dataset, since both are non-zero this period).

**Change:**
- `comparePointsWithBaseline()` gained a 4th, optional parameter `hasCurrentSample` (defaults to `current > 0`, so every existing call site and test not touched here keeps its exact old behavior — non-breaking).
- `lib/admin/analytics/queries.ts` now computes `hasCurrentSample = currentPeriodRows.length > 0` once and passes it explicitly into the `completionRatePct`, `researchConsentRatePct`, and `qualityScorePct` comparisons — using the real current-period row count as the signal instead of inferring it from whether the computed percentage happens to be zero.
- Added two tests to `lib/admin/analytics/aggregate.test.ts` locking in the new behavior: a real 0% with a real sample now reports `"new"` (not `"none"`), and a genuinely empty current period (no sample at all) still correctly reports `"none"`. Did not touch or weaken the two pre-existing tests for the default (3-arg) behavior — both still pass unchanged.

**Verified (browser):** reloaded `/admin/analytics` — Data Quality Score tile now reads **"0% · New · vs previous period"** (previously "0% · No data yet"), while the Alerts panel below still correctly reads *"Data quality score is 0% — 5 records flagged for review."* No more contradiction between the two. Screenshot: `screenshots/overview-fixed.png`. `tsc` clean, full suite 288/288 (up from 286 — the 2 new tests).

### `ANALYTICS_HASH_SALT` — still not set (intentionally not changed here)

Per the original report: this is required only for the "Anonymized assessment rows" and "Flagged records" CSV exports (`lib/admin/analytics/csv.ts:37-43`). It is **still not set** in `.env.local` — I deliberately did not add it, because an earlier instruction in this same working session was explicit: `.env.local` in this repo (and the consumer repo) already has real Supabase + Gemini keys and **should not be modified**. Adding a new key crosses that line even though the key itself is low-risk (a local dev-only secret), so I documented the requirement precisely instead of setting it myself:

```
ANALYTICS_HASH_SALT=<any long random string, e.g. output of `openssl rand -hex 32`>
```

Add that line to `.env.local` (and later to whatever env the app deploys to) and restart the dev server to pick it up — Next.js reads `process.env` at server start for non-`NEXT_PUBLIC_` vars, so an env-only change needs a restart, not just a file save. Once set, the Exports tab will automatically show live, enabled export buttons again (the `saltConfigured` check re-evaluates on every page load) — no further code change needed. **This is the one verification gap left in this fix session**: I confirmed the "salt missing → safe disabled state" path but could not confirm the "salt present → CSV actually downloads correctly" path without modifying the protected `.env.local`. That's a 30-second manual check once the salt is added: reload `/admin/analytics/exports`, click all three buttons, confirm 3 CSVs download with `user_id_hash` values instead of names/emails.

### Remaining blockers before production (updated)

1. ~~Fix the `event_id` unique index / `ON CONFLICT` mismatch~~ — **done**, verified end-to-end (HTTP + DB + idempotency).
2. **Still open:** set `ANALYTICS_HASH_SALT` in `.env.local` (and deploy envs later) — not done here, see above for why and the exact line to add.
3. ~~Decide on UX for export failures~~ — **done**: friendly disabled state + inline message, no more raw JSON navigation.
4. ~~Re-verify the ingestion fix~~ — **done**, see section 1 above.
5. ~~Reconcile the Data Quality Score inconsistency~~ — **done**, see section 3 above.
6. Question-level events (`question_viewed`, etc.) and true abandonment tracking remain explicitly out of scope, per this task's instructions and the original Phase 2 deferral — not touched.
7. **New, low-priority follow-up found during this session:** the export API route (`app/api/admin/analytics/export/route.ts`) eagerly builds all three CSV variants regardless of the requested `type`, via an object literal that evaluates all three branches. Harmless once the salt is set (just wasted work), but worth making lazy at some point. Not fixed here — out of scope for "fix the reported bugs," flagged for a future pass.

Once `ANALYTICS_HASH_SALT` is set, this dashboard has no other known blockers ahead of it being considered functionally correct for what's built (Phase 1 + 1.5 + Phase 2's 9 wired call sites). Question-level analytics (Phase 2's deferred scope) is the next real feature work, not a bug fix.
