# Analytics Instrumentation (Phase 2)

The shared analytics foundation behind `/admin/analytics`. Every producer —
this admin CMS, the consumer app, and eventually a Partner/Research portal —
calls one function, `trackEvent(name, payload)`, and nothing else.

```ts
import { trackEvent } from "@/lib/analytics/track";

trackEvent("assessment_started", { assessmentId });
```

No page or component talks to a database, a queue, or a network endpoint
directly. Everything between that call and a row landing in
`analytics_events` is this library's job.

## Architecture

```
trackEvent(name, payload)        ← the only public API
        │
        ▼
   track.ts                      builds the envelope (ids, timestamp,
        │                        session, hashed user, device, locale),
        │                        enqueues, decides when to flush
        ▼
   queue.ts                      pure in-memory FIFO + attempt tracking
        │                        (no I/O — fully unit-testable)
        ▼
   flush.ts                      drains the queue, calls the provider,
        │                        requeues/drops based on the result;
        │                        schedules interval + pagehide flushes
        ▼
   provider.ts                   transport abstraction — createHttpProvider
        │                        posts to /api/analytics/ingest today
        ▼
   /api/analytics/ingest         validates per-event, writes to Supabase
        │                        via the service-role client
        ▼
   analytics_events              source of truth (see Database below)
```

`session.ts` and `storage.ts` are the two browser-only concerns: a
sessionStorage-backed session id (30-minute inactivity window) and a
localStorage mirror of the queue so a hard page close before a flush doesn't
silently lose events — they're picked back up and retried on the next load.

`events.ts` is the taxonomy and the zod validation schema. `types.ts` is the
plain structural types everything else is built from.

### Two ingestion endpoints, one table

Tareeq (consumer) and Tareeq-admin are separate repos with separate
deployments, so `lib/analytics/*` is **copied**, not imported, into both —
there's no shared package boundary between them today. Each app has its own
`/api/analytics/ingest` route using its own service-role key, but both write
to the **same** `analytics_events` table because both apps share one
Supabase project. That's the actual integration point, not a network call
between the two apps.

**Known limitation:** this is real duplication — the 8 library files are
byte-identical in both repos right now. The honest fix is either (a) publish
`lib/analytics` as a versioned internal package once there's a build
pipeline that supports it, or (b) merge these repos. Neither is in scope
here; until then, a change to one copy needs to be ported to the other by
hand.

## Event taxonomy

30 events across 5 domains (`lib/analytics/events.ts`):

| Domain | Events |
|---|---|
| Assessment | `assessment_started`, `question_viewed`, `question_answered`, `question_answer_changed`, `question_skipped`, `assessment_completed`, `assessment_abandoned`, `assessment_resumed`, `assessment_retaken` |
| Results | `results_generated`, `results_viewed`, `results_downloaded`, `results_shared`, `recommendations_opened`, `career_profile_opened` |
| AI | `ai_generation_started`, `ai_generation_completed`, `ai_generation_failed`, `translation_generated`, `assessment_import_generated` |
| Admin | `assessment_created`, `assessment_updated`, `assessment_published`, `assessment_archived`, `rule_updated`, `profile_updated` |
| Session | `session_started`, `session_ended`, `page_view`, `navigation` |

### What's actually wired vs. defined-but-unused

The full taxonomy exists in the schema and the type system today — that was
the point of building the foundation first. Real call sites exist for:

**Tareeq-admin** (`lib/admin/*-actions.ts`):
- `assessment_created` — `assessment-actions.ts: createAssessment()`
- `assessment_updated` — `assessment-actions.ts: updateAssessmentSetup()`
- `assessment_published` — `publish-actions.ts: publishAssessment()`
- `rule_updated` — `profile-actions.ts: saveProfileRule()`
- `profile_updated` — `profile-actions.ts: saveResultProfile()`
- `ai_generation_started/completed/failed` — `ai-import-actions.ts: runExtraction()`, `translate-actions.ts: autoTranslateAssessment()`
- `translation_generated` — `translate-actions.ts: autoTranslateAssessment()`
- `assessment_import_generated` — `ai-import-actions.ts: applyExtractedDraft()`

**Tareeq (consumer)**:
- `assessment_started` / `assessment_retaken` / `assessment_resumed` — `components/assessment/AssessmentStart.tsx`
- `assessment_completed` — `app/api/assessments/persist/route.ts` (after the DB insert succeeds; uses the new row's own `id` as `assessment_id`, not the client-local one — see Privacy note below)
- `results_generated` (both `source: "claude"` and `source: "fallback"` paths) + `ai_generation_started/completed/failed` — `app/api/results/generate/route.ts`
- `results_viewed` / `results_downloaded` / `results_shared` — `components/assessment/ResultsScreen.tsx`

**Not wired — explicitly deferred, not silently dropped:**
- `question_viewed` / `question_answered` / `question_answer_changed` / `question_skipped` — would require instrumenting the live quiz interaction component (`QuestionScreen.tsx`) per-question. Skipped this pass to avoid rushing changes into the most failure-sensitive part of the consumer flow without the ability to visually verify in a browser (see Verification below). The taxonomy and ingestion path are ready; this is wiring, not architecture.
- `assessment_abandoned` — there's no signal for this today (no "user left mid-quiz" event exists anywhere in the codebase). A real implementation needs either a `pagehide` handler in the quiz flow or a server-side "session went stale" heuristic — neither exists yet.
- `assessment_archived` — confirmed via direct code search: there is no archive flow in the admin CMS at all (`AssessmentStatus` includes `"archived"` in the type, but no action ever sets it). Nothing to instrument.
- `recommendations_opened`, `career_profile_opened`, `session_started`, `session_ended`, `page_view`, `navigation` — no existing UI concept maps to these yet (no separate "recommendations" or "career profile" view exists outside the results page itself; session/page-view tracking wasn't requested as a priority for this pass).

## Event shape

```ts
interface AnalyticsEvent {
  event_id: string;            // client-generated UUID — see idempotency below
  timestamp: string;           // ISO 8601
  event_name: string;          // one of the 30 above
  session_id: string;
  user_id_hash: string | null; // see Privacy
  assessment_id: string | null;
  assessment_version: string | null;
  locale: string | null;
  device: { type: "mobile"|"tablet"|"desktop"|"unknown"; userAgent?: string } | null;
  country: string | null;
  metadata: Record<string, unknown>; // event-specific, arbitrary
}
```

No names, no emails, no raw user ids — anywhere in this shape, by
construction (`trackEvent`'s payload type doesn't even have a `name`/`email`
field to accidentally pass).

## Privacy model

- **`user_id_hash`** is SHA-256 of the raw id, computed in `track.ts` before
  the event is ever enqueued. This is a **different security property** from
  the export hash in `lib/admin/analytics/csv.ts` (Phase 1): that one runs
  server-side with a secret salt (`ANALYTICS_HASH_SALT`) specifically so a
  CSV recipient can't reverse it. This one runs in public client code with
  no secret — anyone with the original id could compute the same hash. It's
  a **pseudonym for correlation** ("same person across events"), not
  protection against re-identification. Don't conflate the two.
- `assessment_id` on `assessment_completed` is the server-assigned
  `assessments.id` (the row Postgres just created), not the client-local
  `assessmentId` from `localStorage` — those are different identifiers, and
  the server-side one is what the rest of the admin dashboard already keys
  on, so this is the more useful correlation point downstream.
- Server-triggered events (every Admin/AI event, all of which fire from
  Server Actions) get a `session_id` that's a per-process placeholder, not a
  real browser session — there's no browser session to attach to from
  inside a Server Action. This is fine for what those events are used for
  (audit-style "this admin did X"), but don't expect `session_id` to be
  meaningful for funnel analysis on Admin-domain events.
- The ingestion endpoint is **not** admin-gated (it has to accept anonymous
  consumer-app traffic) but the table itself only grants `SELECT` to admins
  via RLS, and has **no INSERT policy** — only the service-role client used
  by the ingestion route can write. A malicious POST to `/api/analytics/ingest`
  can add junk rows but can't read anything back.

## Batch lifecycle

1. `trackEvent()` builds the envelope and calls `queue.enqueue()`.
2. The event is immediately mirrored to `localStorage` (`storage.ts`) so a
   crash/close before the next flush doesn't lose it.
3. **Browser context:** a scheduler (`flush.ts: startFlushScheduler`) flushes
   on a 10s interval, on `pagehide` (via `fetch(..., { keepalive: true })`
   so the request survives unload), or immediately once the queue hits 20
   events — whichever comes first.
4. **Server context** (a Server Action calling `trackEvent`): there's no
   long-lived page to schedule against, so every call flushes immediately
   after enqueueing exactly that one event. No batching benefit applies to a
   single discrete server action invocation anyway.
5. On a successful send, every event in the batch is forgotten (removed from
   retry bookkeeping) and storage is cleared/updated to match.
6. On failure: the provider classifies the response — 4xx (malformed,
   server explicitly rejected) is **not** retried and the event is dropped;
   5xx/network errors **are** retried, up to `maxAttempts` (default 5), with
   the event requeued at the front of the queue each time. Once an event
   exceeds `maxAttempts` it's dropped and reported via the `onDrop` callback.
7. The server validates **per-event**, not per-batch — one malformed event
   in a batch of 20 doesn't sink the other 19. The response reports
   `{inserted, rejected}` so a well-behaved client can tell the difference.
8. **Idempotency:** `event_id` has a unique index; the ingestion route
   `upsert`s with `ignoreDuplicates: true`, so a client retrying a flush it
   never got a 200 for can't double-count.

## Database

`analytics_events` (additive migration:
`supabase/migrations/202607010001_analytics_instrumentation.sql`) widened
from Phase 1's 3-value funnel-stage log into the full taxonomy:

- `event_type` (legacy, nullable, CHECK-constrained to the original 3
  values) is kept for backward compatibility — nothing currently writes it
  except the ingestion route's `LEGACY_EVENT_TYPE` mapping, which dual-writes
  it for the 3 events that have a Phase 1 equivalent.
- `assessment_id` changed from a `uuid` FK on `assessments(id)` to plain
  `text`, no constraint. Most of the new taxonomy (`assessment_started`,
  `question_viewed`, ...) fires **before** any `assessments` row exists —
  the consumer flow only persists a row at completion — so a strict FK would
  reject the majority of real events.
- New columns: `event_id` (unique), `event_name`, `session_id`,
  `user_id_hash`, `assessment_version`, `locale`, `device` (jsonb),
  `country`.

Per the brief: **assessments describe outcomes, events describe
behaviour.** No new behavioral columns were added to `assessments` in this
pass — `consent_research` and the demographic columns from Phase 1 are the
last outcome-shaped additions; everything new lives in `analytics_events`.

**Not applied.** Like Phase 1's migration, this is a SQL file only — it
needs to be run against the real database before any of this produces real
rows. Until then, every read path (the dashboard's funnel query) already
degrades to zero/empty rather than crashing, verified by re-running the
dashboard's data layer against the live (unmigrated) database.

## Testing

64 new unit tests (32 in each repo, identical):
- `queue.test.ts` — enqueue/drain ordering, requeue, attempt tracking, that
  `peekAll()` doesn't leak a mutable reference.
- `flush.test.ts` — success, transient-failure retry, permanent rejection,
  max-attempts exhaustion, mixed batches (some retryable, some not) — using
  a fake provider, no real network.
- `events.test.ts` — schema acceptance/rejection per field, and
  `partitionValidEvents` keeping the valid events in a batch when others are
  malformed.

Not unit-tested: the ingestion route handler itself (thin wrapper over
already-tested `partitionValidEvents` + a Supabase upsert — there's not much
logic left to test in isolation without a running Next.js + Supabase
instance) and `track.ts` (composes browser globals — `crypto.subtle`,
`navigator`, `window` — and a module-level singleton in a way that's
integration-shaped rather than unit-shaped; its pieces — queue, flush,
events — are each tested directly instead).

## Verification performed

- `pnpm typecheck` / `pnpm test` clean in **both** repos (Tareeq-admin:
  286 tests; Tareeq: 42 tests, including the 32 shared analytics tests).
- `pnpm lint` clean of new errors in both repos. (Tareeq's lint run surfaces
  ~2800 pre-existing warnings and 18 errors from a stale `.vercel/output`
  build directory being linted — confirmed none are in any file this work
  touched; this is a pre-existing eslint-config gap, not addressed here.)
- Re-ran the dashboard's data layer against the live (unmigrated) Supabase
  project to confirm the updated `fetchFunnelEventCounts` (now reading
  `event_name` as well as `event_type`) still degrades gracefully when the
  new columns don't exist yet, rather than crashing the page.
- Did **not** apply the migration, deploy, or commit, per instructions.
- **Could not** verify the actual instrumented user flows (start → complete
  → view results → share/download) in a real browser this session — same
  constraint as the Phase 1.5 redesign: no Playwright available, and
  replicating the Supabase session cookie by hand to drive an authenticated
  fetch was correctly blocked as credential handling. The call sites were
  matched against the exact current file contents (read directly, not
  guessed), and every piece up to the network boundary is unit-tested, but
  **a real click-through in a browser is the one verification step still
  outstanding before treating this as production-ready.**

## Future integrations

The whole point of `provider.ts` is that none of the above changes when the
backing store does. `AnalyticsProvider` is a two-method interface:

```ts
interface AnalyticsProvider {
  name: string;
  send(events: AnalyticsEvent[]): Promise<FlushResult>;
}
```

- **PostHog:** wrap `posthog.capture()` per event (or PostHog's own batching
  if preferred) in a `createPostHogProvider()` factory; swap it in where
  `createHttpProvider(DEFAULT_ENDPOINT)` is constructed in `track.ts`.
- **Mixpanel:** same shape — `mixpanel.track()` per event.
- **GA4:** map `event_name` → GA4's `gtag('event', ...)` call; GA4's own
  parameter-naming rules (40-char limits, reserved names) would need a small
  translation layer inside the provider, not in `trackEvent` call sites.
- **Fan-out to multiple providers at once** (e.g. Supabase + PostHog during
  a migration window): `provider.ts` would need a `combineProviders(...)`
  helper that calls `send()` on each and merges the `FlushResult`s — not
  built here since nothing needs it yet, but the interface doesn't block it.

No application code — none of the 9 real call sites above — would change
for any of this. They all call `trackEvent(name, payload)` and nothing else.
