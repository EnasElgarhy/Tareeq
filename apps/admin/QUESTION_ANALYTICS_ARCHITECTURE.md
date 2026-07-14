# Question Analytics Architecture (Phase 3)

Backend/engine layer for "make every question measurable" — event
instrumentation, pure aggregation, a deterministic health score, rule-based
insights, answer→outcome correlation, and version-to-version comparison.
No UI yet (that's the next phase); this document describes what exists and
is tested today.

Builds directly on the Phase 1/1.5/2 analytics foundation — see
`ANALYTICS_PHASE_1_SUMMARY.md` and `ANALYTICS_INSTRUMENTATION.md` for the
dashboard and the shared `trackEvent()`/`analytics_events` pipeline this
phase reuses rather than replaces.

## Event flow

```
QuestionScreen.tsx (Tareeq, consumer)
        │  trackEvent(name, { assessmentId, assessmentVersion, questionId,
        │                     questionPosition, pillar, ...eventMetadata })
        ▼
   lib/analytics/track.ts            same shared library as Phase 2 — builds
        │                            the envelope, enqueues, flushes
        ▼
   /api/analytics/ingest             validates, upserts into analytics_events
        ▼
   analytics_events                  question_id is now a first-class column
        │
        ▼ (admin reads, service-role client)
   lib/admin/analytics/question-queries.ts     DB → QuestionEventRecord[]
        ▼
   lib/admin/analytics/question-events.ts      pure aggregation → QuestionMetrics
        ▼
   lib/admin/analytics/question-health.ts      → HealthScoreResult
        ▼
   lib/admin/analytics/question-insights.ts    → Insight[] (behavioral)

   (separate branch, different source table — see Correlation below)
   assessments.answers + assessments.result
        ▼
   lib/admin/analytics/question-correlation.ts → QuestionOutcomeCorrelation

   (comparing two versions' worth of the above)
   lib/admin/analytics/question-version-comparison.ts → QuestionVersionComparison
```

### New events (added to the existing taxonomy)

`lib/analytics/events.ts` (byte-identical copy in both `Tareeq` and
`Tareeq-admin` — see `ANALYTICS_INSTRUMENTATION.md`'s "two ingestion
endpoints, one table" note for why there are two copies):

| Event | Fires when (`QuestionScreen.tsx`) |
|---|---|
| `question_viewed` | *(existing, Phase 2, now wired)* first time this question is shown in this browser session |
| `question_revisited` | *(existing, Phase 2, now wired)* shown again — the mount effect already knew the answer, so it's a return visit, not a first view |
| `question_answered` | first time an answer is recorded for this question (auto-advance, dropdown select, or explicit Next) |
| `question_answer_changed` | *(existing, Phase 2, now wired)* the newly-saved value differs from what was already saved |
| `question_auto_advanced` | specifically the single/binary-kind path where picking an option immediately advances, no explicit "Next" click |
| `question_time_spent` | every time the question is actually left, forward or back — carries `timeSpentMs` |
| `question_completed` | only on a *forward* departure that has a recorded answer — the "did they finish this question" event completion rate is built from |
| `question_abandoned` | best-effort, via `pagehide` only (see Known Gaps) |
| `question_skipped` | **not wired** — see Known Gaps |

### Payload shape

Every question event calls the same `questionContext()` helper in
`QuestionScreen.tsx`:

```ts
{
  assessmentId: <client-local assessment id, same as assessment_started/etc.>,
  assessmentVersion: "v4",   // lib/content/seed.ts's contentVersion.label
  questionId: question.externalId,   // e.g. "Q5" — see DB fields below
  questionPosition: question.position,
  pillar: question.pillar,
  ...eventSpecificMetadata,          // selectedAnswer, previousAnswer, timeSpentMs, direction, isFirstVisit, attemptNumber
}
```

`assessmentId`/`assessmentVersion`/`questionId` are envelope fields (their
own DB columns); everything else rides in `metadata` (jsonb) — same
envelope-vs-metadata split Phase 2 established in
`lib/analytics/types.ts`'s `TrackEventPayload`.

`attempt_number` comes from a small new sessionStorage-backed counter,
`lib/assessment/question-attempts.ts` (`bumpQuestionAttempt`) — mirrors the
existing `lib/analytics/session.ts` storage pattern, resets per browser
session, resets a question's count to 1 the first time it's seen.

## DB fields

Migration `supabase/migrations/202607020001_question_analytics.sql`:

| Table | Column | Type | Notes |
|---|---|---|---|
| `analytics_events` | `question_id` | `text`, nullable, indexed | **`questions.external_id`** (e.g. "Q5"), **not** `questions.id` |
| `questions` | `is_archived` | `boolean not null default false`, indexed | soft-hide flag for the (not-yet-built) Archive admin action |

### Why `question_id` = `external_id`, not a DB uuid

The consumer app renders questions from a static seed file
(`lib/content/seed.ts` via `lib/assessment/questions.ts`) — the runtime
`Question` type (`lib/scoring/types.ts`) has `externalId`, `pillar`,
`position`, `kind`, `title`, `options`, but **no database uuid at all**.
The client cannot emit a `questions.id` it was never given. `external_id`
turns out to be the *better* key regardless:

- It's stable across versions — the same `(version_id, external_id)`
  question gets a new `questions.id` uuid every time a version is
  cloned-to-draft, but keeps the same `external_id`.
- `assessments.answers` (jsonb) is already keyed by `external_id` →
  chosen letter (e.g. `{"Q5": "D", ...}`), so correlation and behavioral
  metrics use the identical join key with zero translation.
- "How has Question 18 done over its whole lifetime, across every
  version" is the more natural default question than "how has this one
  version's row done" — grouping by `external_id` alone gives you that;
  grouping by a version-scoped uuid would require an extra join every time.

The admin UI's own route, `/admin/questions/[id]/analytics`, still uses the
version-scoped `questions.id` uuid — that's what the admin's question list
actually links to. `getQuestionById()` resolves uuid → row →
`external_id`; every metrics/correlation/comparison call from there on
uses `external_id`. One lookup, once, at the page boundary.

## Metric formulas (`lib/admin/analytics/question-events.ts`)

All pure functions over `QuestionEventRecord[]` (event_name, session_id,
timestamp, metadata) — no I/O, fully unit-tested without a database.

| Metric | Formula |
|---|---|
| Views | count of `question_viewed` events (fires once per session, first sight only — an approximate unique-viewer count by construction) |
| Revisits | count of `question_revisited` events |
| Answers | count of **distinct session_ids** across `question_answered` ∪ `question_answer_changed` (not raw event count — one session that changed its mind still counts once) |
| Changes | raw count of `question_answer_changed` |
| Completions | raw count of `question_completed` |
| Abandonments | raw count of `question_abandoned` |
| Completion rate | `completions / views` |
| Drop-off rate | `(views − completions) / views`, clamped to ≥0 — the exact complement of completion rate in this model (see Health Score below for why that matters) |
| Revisit rate | `revisits / views` |
| Skip rate | `skips / views` — always 0% today, see Known Gaps |
| Abandonment rate | `abandonments / views` |
| Answer change rate | `changes / answers` |
| Avg / median / fastest / slowest time | over every `question_time_spent` event's `timeSpentMs` (all samples, including repeats from revisits — "how long did people spend looking at this, each time") |
| Answer distribution | tally of each **session's final answer** — the *last* `question_answered`/`question_answer_changed` event per session by timestamp, so a changed answer counts once (as the new value), not twice |

## Health score formula (`lib/admin/analytics/question-health.ts`)

0–100, weighted average of five 0–100 sub-scores, each present-or-absent
(absent factors don't drag the score toward 0 — weights renormalize over
whatever's actually available):

| Factor | Weight | Formula |
|---|---|---|
| Completion | 35% | `completionRatePct` directly |
| Time | 20% | 100 at or under the assessment's own median question time, linearly down to 0 at 3x that baseline or slower |
| Answer entropy | 20% | Shannon entropy of the answer distribution ÷ max possible entropy for that option count, ×100 — even spread scores high, "everyone picks the same option" scores near 0. **Dropped entirely** (not zeroed) for free-text questions, which have no discrete answer set |
| Change rate | 15% | `100 − answerChangeRatePct × 2` (clamped) — a 50%+ change rate zeroes this factor |
| Abandonment | 10% | `100 − abandonmentRatePct × 4` (clamped) — a 25%+ abandonment rate zeroes this factor |

**`dropOffRatePct` is not its own weighted factor** — in this model it's
the exact arithmetic complement of `completionRatePct`
(`100 − completion`), so weighting both would double-count one signal
under two names. It still exists as its own reported metric because "40%
drop-off" reads more naturally in UI copy than "60% completion", but the
health score only weights the completion side once.

**Status bands:** ≥75 Healthy · 50–74 Needs Review · <50 Critical · below
`HEALTH_MIN_SAMPLE` (5) views → `Insufficient Data` (not a fake score from
1-2 respondents).

The weights themselves are a principled starting point, not something
tuned against real production data — there wasn't any real question-event
traffic to tune against at the time this was built (see Known Gaps). Easy
to retune once there is: every factor and its weight is named and
documented in `question-health.ts`'s own doc comment.

## Correlation method (`lib/admin/analytics/question-correlation.ts`)

**Reads `assessments.answers` + `assessments.result`, not
`analytics_events`.** This is the one place in Phase 3 that deliberately
does *not* go through the event pipeline:

- `analytics_events` only has behavioral data starting from this phase —
  it's empty today and will only ever cover respondents from here forward.
- `assessments.answers` (jsonb, `external_id → letter`) and
  `assessments.result` (jsonb, `topCluster`/`archetype`/`primaryDriver`
  for CORE-shaped results) already exist for every completed assessment
  ever taken, including historical/seed data — exactly the
  final-answer-to-final-outcome pairing correlation needs, with no reason
  to wait for new event traffic to answer a question the outcome-of-record
  table already answers today.

**Method — deterministic "lift", not ML:**

1. For one question (`external_id`) and one outcome field (`topCluster`,
   `archetype`, or `primaryDriver`), build `(answer, outcome)` pairs from
   every completed assessment that has both.
2. Compute the **baseline** distribution of the outcome field across *all*
   respondents to this question, regardless of answer.
3. For each distinct answer, find its most common ("dominant") outcome and
   that outcome's **share within respondents who picked this answer**.
4. **Lift** = that share ÷ the outcome's baseline share. `1.0` = this
   answer tells you nothing beyond the base rate. `>1` = predictive
   (`describeCorrelation` calls ≥1.5 "strongly predicts", ≤1.15 "almost no
   predictive value"). `<1` = this answer is *anti*-correlated with that
   outcome.
5. `strongestLift`/`strongestAnswer`/`strongestOutcome` = the single
   highest-lift answer, used for the one-line insight.

**Sample gating:** below `CORRELATION_MIN_SAMPLE` (10) total respondents,
no correlation is computed at all. An individual answer with fewer than
`MIN_ANSWER_SAMPLE` (5) respondents still appears in the per-answer
breakdown (so the UI can show "not enough data" for that specific answer)
but is excluded from `strongestLift` — a 100% result from 2 people isn't a
finding.

**Tie-breaking** (deterministic, documented in-code): a tie in an answer's
dominant outcome goes to whichever outcome value appears first in the
input pairs' order. A tie in `strongestLift` across answers goes to the
answer with the larger sample size (the per-answer list is sorted by
sample size first).

### CORE vs. Custom assessment compatibility

`buildAnswerOutcomePairs()` reads `row.result?.[outcomeField]` and simply
**skips** any row where that field is absent or not a string — it never
assumes a CORE-shaped result. A Custom assessment's result (See
`lib/scoring/spec-types.ts` / the hybrid-assessment system in the
`Tareeq-admin` project memory) uses a different shape (named result
profiles, not `topCluster`/`archetype`/`primaryDriver`), so Custom rows
are silently excluded from CORE-outcome correlation rather than crashing
or producing a nonsense pairing. Nothing in `question-events.ts`,
`question-health.ts`, or the event schema itself is CORE/Custom-aware at
all — events, metrics, and health scores are generic to any question in
any assessment type, since they never touch `result`.

## Version comparison method (`lib/admin/analytics/question-version-comparison.ts`)

Matches "the same question" across two `content_versions` by
`external_id` (the same stable-across-clone identity correlation and event
aggregation already use — see DB fields above). Given two
`QuestionVersionSnapshot`s (title, options, `QuestionMetrics`,
`HealthScoreResult` — one per version), produces:

- **Wording diff**: title changed? (locale-aware equality over every
  locale key present on either side), options changed? (letter + text,
  order-independent by letter, so reordering options without changing
  their text is *not* flagged as a change — only content differences are).
- **Metric deltas** (`completionRate`, `avgTime`, `dropOffRate`,
  `healthScore`): each reports `oldValue`/`newValue`/`delta`/`improved`.
  `improved` is direction-aware — a completion-rate *increase* or a
  time/drop-off *decrease* both count as "improved". Either side being
  `null` (e.g. a brand-new draft with zero respondents yet) makes
  `delta`/`improved` `null` rather than a misleading `0`/`false`.
- **Answer distribution shift**: per-answer share-point delta. An answer
  that only exists in one version (an added/removed option) still gets an
  entry — its share is a genuine `0%` on the side it didn't exist
  (respondents on that version literally couldn't have picked it), *unless*
  that whole side had zero respondents at all, in which case the share is
  `null` (no baseline to compare against, not "definitely zero").

`listSiblingQuestionVersions()` (in `question-queries.ts`) finds the
candidate "other versions of this question" to compare against, by
`external_id`, excluding the version currently being viewed.

## Known gaps

These are honest limitations of what's built, not bugs — the pattern
Phase 1/1.5/2 already established (see "Known data gaps" in
`ANALYTICS_PHASE_1_SUMMARY.md`).

1. **`question_skipped` is not wired.** The consumer app has no UI concept
   of skipping a required question today — every `kind` (single, binary,
   select, text) must be answered to advance
   (`goNextExplicit`/`chooseFromSelect`/`commitAndAdvance` all gate on
   having a value). The taxonomy and ingestion path are ready; there is
   simply no call site, matching exactly how Phase 2 documented
   `question_viewed`/`question_answered` as "taxonomy ready, not wired"
   before this phase wired them. Skip rate will report `0%` for every
   question until (if ever) a genuinely skippable/optional question type
   is introduced.

2. **`question_abandoned` is best-effort and under-counts, not over-counts,
   by design.** It fires only on a true `pagehide` (tab/browser close,
   navigating to a different site) — `visibilitychange` (ordinary tab
   switching) was considered and explicitly rejected, because it would
   fire on every momentary tab-away and massively *over*-count
   abandonment. The tradeoff: some real abandonment on browsers/platforms
   where `pagehide` is unreliable (notably some older mobile Safari
   versions) won't be captured. There's also a theoretical delivery race
   noted in `lib/analytics/flush.ts`'s design — an event enqueued inside a
   `pagehide` handler might not make it into that same `pagehide`'s
   keepalive flush if another `pagehide` listener (the flush scheduler's
   own) was registered first and runs first. In practice this degrades to
   "delivered on the next page load" (the queue is mirrored to
   localStorage synchronously on enqueue and retried later), not "lost" —
   but it means abandonment events can arrive later than the moment they
   actually happened, not instantly.

3. **No real event traffic yet.** Every metric/health/insight above is
   tested against synthetic data; nothing has been verified against a real
   respondent's click-through yet at the time of writing this doc (that's
   the Phase 3 final-verification step, done separately from this
   document). Health scores, insights, and version comparisons will all
   report `Insufficient Data` / stay silent / show `null` deltas until
   real `question_*` events accumulate past each module's minimum-sample
   gate.

4. **`assessmentVersion` on question events is a hardcoded literal**
   (`contentVersion.label`, `"v4"`, from `lib/content/seed.ts`), not a live
   value read from the DB's `content_versions.is_active` row — because the
   consumer app doesn't read from the DB at all (see the seed-vs-DB note
   above). If the seed's hardcoded version label and the DB's actual active
   version label ever diverge, version-scoped queries
   (`fetchQuestionEvents(id, { versionLabel })`) would silently return
   nothing for the real active version. Not observed today, but a
   structural risk worth knowing about — the deeper fix (wiring the
   consumer app to read live content) is out of scope for this phase and
   touches the same "public app still reads seed" gap tracked elsewhere.

5. **Health score weights are a documented starting point, not a tuned
   model** — see the Health Score section above.

6. **No admin-facing UI yet.** Everything in this document is
   engine/backend only — `/admin/questions/[id]/analytics`, the
   Assessment Health tab, and the admin actions (View Analytics, Archive,
   Duplicate, Compare Versions) are the next phase, deliberately sequenced
   after this engine layer per the brief ("do not jump to UI yet").

## Future — Gemini Assessment Optimizer (not built, architecture only)

The brief asks this engine layer be shaped so a later AI pass can consume
it without a rework. It already is, by construction:

- **Everything it would need is already a typed, serializable object**:
  `QuestionMetrics`, `HealthScoreResult`, `Insight[]`,
  `QuestionOutcomeCorrelation`, `QuestionVersionComparison`. A future
  `recommendAssessmentImprovements(input: {...})` function could take
  exactly these shapes and return recommendations — no new data plumbing.
- **The AI's role would be constrained to `shorten wording` /
  `split question` / `merge answers` / `improve scoring` /
  `improve translations`-style *recommendations*, surfaced for human
  review** — never applied automatically, and never allowed to touch
  scoring. This mirrors the existing hard invariant already enforced
  elsewhere in this codebase's scoring system (the hybrid-assessment
  engine's `spec-executor.ts`: "AI emits a scoring spec but never scores
  users — a deterministic backend executor scores"). The same boundary
  applies here: an AI can *suggest* "Question 7 is 2x slower than
  average, consider shortening the wording", but it cannot rewrite the
  question, change its `cluster_code`/`weight` mappings, or alter
  `computeQuestionMetrics`/`computeQuestionHealth`'s output.
- **Where it would plug in**: a new `lib/admin/analytics/question-ai-optimizer.ts`
  (naming to match the existing `lib/admin/ai-extract.ts` /
  `lib/admin/translate-actions.ts` Gemini-calling modules) that takes a
  question's `QuestionMetrics` + `HealthScoreResult` + `Insight[]` +
  `QuestionOutcomeCorrelation`, prompts Gemini for a structured
  recommendation object (proposed wording, rationale, expected impact —
  never a scoring change), and stores it for human review — publish/apply
  stays a manual admin action, exactly like the existing AI-import flow's
  "Coming soon" gating pattern in `components/admin/AiImportFlow.tsx`.
