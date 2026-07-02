-- Phase 3 — Question Intelligence & Assessment Optimization.
--
-- Adds `question_id` to analytics_events as its own indexed column (not
-- just a metadata key) because every question-analytics aggregation groups
-- by it — the same rationale `assessment_id`/`assessment_version` already
-- got their own columns for in the Phase 2 migration. Stores
-- `questions.external_id` (e.g. "Q5"), NOT `questions.id` — the consumer
-- app renders from a static seed file with no DB UUID available at all, and
-- external_id is the better key anyway since it's stable across versions
-- (same key `assessments.answers` and version-comparison already use).
-- Nullable: only question-scoped events (question_viewed, question_answered,
-- ...) set it; assessment/session/admin/AI events leave it null.
--
-- No new tracking table — reuses analytics_events per the Phase 3 brief
-- ("Reuse analytics_events. Do not create separate tracking tables unless
-- absolutely necessary"). Question-level metrics are aggregated from this
-- column in JS (lib/admin/analytics/question-metrics.ts), mirroring the
-- existing Phase 1/2 pattern of reading `select("*")` and computing in the
-- app rather than pushing aggregation into SQL.
--
-- Also adds `is_archived` to `questions`: the Phase 3 admin-actions brief
-- asks for a per-question Archive action, and none existed before this
-- (confirmed by code search during Phase 2 — see ANALYTICS_INSTRUMENTATION.md
-- and ANALYTICS_BROWSER_QA_REPORT.md). A soft-hide flag, not a delete —
-- archived questions keep their history/metrics but drop out of the live
-- editor's default question list.

alter table analytics_events add column if not exists question_id text;

create index if not exists analytics_events_question_idx
  on analytics_events(question_id);

alter table questions add column if not exists is_archived boolean not null default false;

create index if not exists questions_is_archived_idx on questions(is_archived);

notify pgrst, 'reload schema';
