-- ════════════════════════════════════════════════════════════════════════════
-- Analytics Instrumentation — widens `analytics_events` from a 3-value
-- funnel-stage log into the full event taxonomy (lib/analytics/events.ts).
--
-- ADDITIVE + BACKWARD COMPATIBLE. The old `event_type` column and its CHECK
-- constraint stay valid (now nullable) for any caller still writing the
-- Phase 1 shape; new code should write `event_name` instead. The dashboard's
-- funnel query checks both columns (see queries.ts).
--
-- `assessment_id` changes from a uuid FK to `assessments(id)` to a plain
-- text column: the new taxonomy fires events (assessment_started,
-- question_viewed, ...) before any `assessments` row exists — the consumer
-- flow only persists a row at completion — so a strict FK would reject the
-- majority of behavioral events.
-- Date: 2026-07-01
-- ════════════════════════════════════════════════════════════════════════════

alter table analytics_events alter column event_type drop not null;
alter table analytics_events drop constraint if exists analytics_events_event_type_check;
alter table analytics_events add constraint analytics_events_event_type_check
  check (event_type is null or event_type in (
    'results_viewed', 'result_downloaded', 'result_shared'
  ));

alter table analytics_events drop constraint if exists analytics_events_assessment_id_fkey;
alter table analytics_events alter column assessment_id type text using assessment_id::text;

alter table analytics_events add column if not exists event_id uuid;
alter table analytics_events add column if not exists event_name text;
alter table analytics_events add column if not exists session_id text;
alter table analytics_events add column if not exists user_id_hash text;
alter table analytics_events add column if not exists assessment_version text;
alter table analytics_events add column if not exists locale text;
alter table analytics_events add column if not exists device jsonb;
alter table analytics_events add column if not exists country text;

-- Idempotency: a retried flush (client never saw the 200) must not double-count.
create unique index if not exists analytics_events_event_id_key
  on analytics_events(event_id) where event_id is not null;

create index if not exists analytics_events_event_name_idx on analytics_events(event_name);
create index if not exists analytics_events_session_idx on analytics_events(session_id);
-- analytics_events_assessment_idx (on assessment_id) already exists from Phase 1.
