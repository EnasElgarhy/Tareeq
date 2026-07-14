# Admin Analytics — Phase 1 MVP

`/admin/analytics` — Overview, completion funnel, data quality, demographics,
and results distribution for platform owners. Read-only, admin-gated,
server-side aggregation only.

## What was built

| Layer | Files |
|---|---|
| Migration (additive) | `supabase/migrations/202606300001_analytics_phase1.sql` |
| Types | `lib/admin/analytics/types.ts` |
| Pure aggregation (tested) | `lib/admin/analytics/aggregate.ts`, `aggregate.test.ts` |
| Filters (tested) | `lib/admin/analytics/filters.ts`, `filters.test.ts` |
| Data access | `lib/admin/analytics/queries.ts` |
| CSV export | `lib/admin/analytics/csv.ts` |
| Page + sections | `app/admin/(shell)/analytics/{page,loading,error}.tsx`, `components/admin/analytics/*` |
| Export route | `app/api/admin/analytics/export/route.ts` |

**Not built (explicitly out of scope):** Research Dashboard, B2B Partner
Dashboard, individual student detail, advanced statistics (chi-square,
confidence intervals), PDF/PPT export.

### Sections on the page

1. **Overview** — total users, new users (week/month), started/completed
   counts, completion rate, avg. completion time, retake rate, research
   consent rate.
2. **Completion funnel** — started → completed → viewed results →
   downloaded/shared.
3. **Data quality** — rushed (<4 min), very long (>30 min), all-same-answer,
   missing answers, suspicious vs. clean counts.
4. **Demographics** — country, age band, gender, education level.
5. **Results distribution** — primary cluster, archetype, primary driver,
   ecosystem fit (CORE-shaped results only).
6. **Filters** — date range, country, age band, gender, assessment/catalog
   (including a "Legacy CORE" bucket for versions with no catalog link),
   flagged-record include/only/exclude. Plain GET form, no client JS.
7. **Export** — three CSVs (summary, anonymized rows, flagged rows), all
   server-rendered through `/api/admin/analytics/export`, admin-gated.

### Privacy

- Anonymized exports key rows by a SHA-256 `user_id_hash`
  (`ANALYTICS_HASH_SALT` env var + user id), never the raw id, name, or
  email. The export route throws a clear error if the salt isn't set rather
  than falling back to a guessable default.
- No respondent name/email is rendered or exported anywhere on this page.
- `analytics_events` (new table) has a SELECT policy for admins only and
  **no INSERT policy** — only the service-role client can write to it. Any
  future consumer-side instrumentation must go through a server route, never
  a direct client insert.

### Data access pattern

Mirrors the existing `lib/admin/responses.ts` convention: service-role
client (`createSupabaseAdminClient()`), `select("*")` so an unapplied
migration degrades to "unknown" instead of crashing, aggregation done in JS
over a capped row set (`ANALYTICS_ROW_LIMIT = 5000`, most-recent-completed
first) rather than pushed into SQL. The page surfaces a truncation notice
when the cap is hit. This is the same trade-off the existing Responses page
makes, not a new pattern.

## Verified

- `pnpm typecheck`, `pnpm lint` (no new errors/warnings — the one
  pre-existing `RuleBuilder.tsx` lint error and five warnings are unrelated
  to this change), `pnpm test` (206/206 passing, 64 new).
- Ran `getAnalyticsViewModel()` directly against the live dev Supabase
  project (read-only) to confirm the joins and aggregation work against
  real data — correctly distinguished a genuinely incomplete seeded row
  (`completedAt: null`, 11/54 answered) from completed ones, and correctly
  extracted CompassResult fields (cluster/archetype/driver/ecosystem) from
  the legacy CORE rows.
- Did not apply the migration, deploy, or commit, per instructions.

## Known data gaps (found during this build, not fixed — by design)

These are real limitations in what's currently instrumented, not bugs in
this page. The dashboard reports them honestly (zeros / "not collected yet")
rather than fabricating numbers.

1. **No view/download/share instrumentation.** Nothing in the consumer app
   writes to the new `analytics_events` table yet, so "Viewed results" and
   "Downloaded/shared" always read 0. Next step: add a small server route
   (e.g. `POST /api/analytics/event`) the results page calls at those three
   moments, writing via the service-role client.
2. **No true start-vs-abandonment tracking.** `/api/assessments/persist`
   (consumer app) only writes a row at submission — there's no row for
   someone who opened the assessment and never finished. "Started" today
   means "reached submission," so it will track very close to "Completed."
   Fixing this needs a row written at true session start (separate from
   completion) or a `assessment_started` event.
3. **Retake rate is an approximation.** The persist route does
   `delete().eq("user_id", ...).eq("version_id", ...)` then inserts — a
   retake of the *same* assessment overwrites the prior row rather than
   adding a new one, so same-assessment retakes aren't observable. The
   Overview's "Retake rate" instead measures "this person has completed
   more than one assessment" (any version), which is the closest honest
   proxy available today. To measure true retakes: stop deleting on
   resubmit (add a `superseded_at` column) or log a `retaken` event.
4. **No research consent capture.** `assessments.consent_research` (new,
   nullable) has no UI writing to it yet — every row is `null`("not asked").
   The Overview shows "not collected yet" rather than a fake 0%.
5. **No education level capture.** `profiles.education_level` (new,
   nullable) has no onboarding step populating it. Demographics shows 100%
   "Unknown" until one exists.
6. **Country/gender are sparse.** They come from `profiles`, which is only
   populated for authenticated users — anonymous/guest completions
   (`user_id IS NULL`) show as "Unknown" for every demographic field.
7. **Pre-existing, unrelated:** the main `/admin` overview dashboard's
   "Registered users" stat reads from `user_accounts`, a table nothing
   currently writes to — likely always reads 0 in production. Noticed while
   scoping "Total users" for this page (which reads `profiles` instead,
   since that table is actually populated via the `handle_new_user` auth
   trigger). Not fixed here — out of scope for this page.

## Next steps (suggested order)

1. Apply `supabase/migrations/202606300001_analytics_phase1.sql`.
2. Set `ANALYTICS_HASH_SALT` in the environment (required only for exports).
3. Wire a server-side event-logging route + 3 call sites in the consumer
   results flow (viewed / downloaded / shared) to populate the funnel's
   bottom two stages.
4. Decide on a real session-start signal if true abandonment tracking
   matters before Phase 2.
5. Add an education-level question (and, if desired, a consent step) to the
   onboarding/profile flow so those demographics stop showing "Unknown."

---

## Phase 1.5 — Premium Redesign

The original single-page CRUD-style dashboard was replaced with a tabbed,
hierarchy-first IA (Stripe/Vercel/Linear-style), reusing the Phase 1 data
layer unchanged.

**Navigation:** `/admin/analytics` is now 6 routes sharing one layout
(`layout.tsx` renders `PageHeader` + `TabNav`, persists across tabs):
Overview, `assessments/`, `audience/`, `quality/`, `research/`, `exports/`.
Filters moved into a per-tab `FilterToolbar` (compact top toolbar, plain GET
form) and a `TabNav` client component that preserves the active filters in
the query string across tab switches.

**New data-layer additions (incremental, not a rewrite):**
- `AnalyticsFilters` gained `completedOnly` / `researchOnly` toggles.
- `trends.ts` — pure time-series bucketing (`buildCountSeries`,
  `buildRatioSeries`, `buildAverageSeries`) for 7d/30d/90d/12m ranges.
- `insights.ts` — 8 deterministic "what changed" rules (cluster mover,
  completion time/rate change, top-country change, consent/retake/quality
  score change, an abandonment-hotspot heuristic), each gated by a minimum
  sample size so a near-empty dataset produces silence, not noise.
- `alerts.ts` — 4 deterministic "needs attention" rules (high abandonment,
  missing demographics, low consent, low quality score).
- `comparePointsWithBaseline` — a `previous period had zero rows` guard so
  rate-shaped KPIs report "New" instead of a misleading "+100 pts" when
  there's no real baseline (caught by smoke-testing against live data).
- `heroSparklines` — a fixed 30-day daily series per headline KPI, separate
  from the Growth tab's own range-able series.

**New components:** `KpiHero`/`ExecutiveOverview` (large metric + trend chip
+ sparkline), `GrowthSection` (hand-rolled SVG `TrendChart`, no charting
library — matches the existing house convention), `InsightsFeed`,
`FunnelVisual` (biggest-leak highlight), `HealthPanel` (`RadialScore` donut),
`AlertsPanel`, redesigned `AudienceSection` (Unknown excluded from ranked
bars, shown as a quiet footnote instead, plus a banner when a dimension is
mostly missing), redesigned `ResultsDistributionSection` (real cluster brand
colors via `clusterByCode`, lucide icons, driver codes resolved to names via
the new `labels.ts`).

**Verified:** full `pnpm typecheck` / `pnpm test` (254 passing) clean;
re-ran the data layer against live data after the redesign and caught the
"+100 pts from a zero baseline" bug above before it shipped; manually
audited every new file for the exact RSC "function passed across a
server/client boundary" class of bug that surfaced once during this work
(only `FilterToolbar.tsx` and `TabNav.tsx` are client components, and
neither leaks a function prop into a server component). Could not get a
real authenticated browser/HTTP render in this session — replicating the
`@supabase/ssr` session cookie by hand was correctly blocked as credential
handling, and Playwright isn't installed in this environment. **This is the
one verification gap on the redesign: confirm visually in a real
browser session before treating it as fully signed off.**

**Not built (explicitly deferred by the prompt):** no new aggregations
beyond what's listed above; the Research tab's consent card and results
distribution still inherit the same data gaps from Phase 1 (no consent
capture, no per-question event log).
