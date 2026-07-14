# Analytics Instrumentation

This app's `lib/analytics/*` and `app/api/analytics/ingest/route.ts` are a
**copy** of the same files in the Tareeq-admin repo — both write to the same
shared `analytics_events` table (same Supabase project), but there's no
shared package between the two repos today, so a change here needs to be
ported by hand to the other copy (and vice versa).

The full taxonomy, architecture, privacy model, batch lifecycle, and future
PostHog/Mixpanel/GA4 integration notes live in Tareeq-admin's
`ANALYTICS_INSTRUMENTATION.md` — that's the canonical doc. This file only
covers what's specific to this repo.

## What's wired here

- `assessment_started` / `assessment_retaken` / `assessment_resumed` —
  `components/assessment/AssessmentStart.tsx`
- `assessment_completed` — `app/api/assessments/persist/route.ts`, after the
  DB insert succeeds. Uses the newly-inserted row's own `id` as
  `assessment_id` (not the client-local `localStorage` id — they're
  different identifiers; the server one is what the admin dashboard already
  keys everything else on).
- `results_generated` (`source: "claude" | "fallback"`) and
  `ai_generation_started/completed/failed` —
  `app/api/results/generate/route.ts`, around the Anthropic call.
- `results_viewed` / `results_downloaded` / `results_shared` —
  `components/assessment/ResultsScreen.tsx`.

## What's deliberately not wired yet

- Per-question events (`question_viewed`, `question_answered`,
  `question_answer_changed`, `question_skipped`) — would mean instrumenting
  `QuestionScreen.tsx`, the live quiz interaction component. Skipped this
  pass rather than rush changes into the most failure-sensitive part of the
  flow without being able to visually verify in a browser.
- `assessment_abandoned` — no "user left mid-quiz" signal exists anywhere in
  this codebase today. Needs either a `pagehide` handler in the quiz flow or
  a server-side staleness heuristic.

## Repo-local setup note

`vitest.config.ts` gained a `resolve.alias` mapping `@` → repo root (mirrors
Tareeq-admin's existing config) — nothing in this repo's test suite used the
`@/` import alias before `lib/analytics/*`'s tests needed it.
