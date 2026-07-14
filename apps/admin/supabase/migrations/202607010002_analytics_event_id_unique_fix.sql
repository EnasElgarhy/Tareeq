-- Fixes the event ingestion pipeline: the previous migration created a
-- *partial* unique index on event_id (`where event_id is not null`), but
-- app/api/analytics/ingest/route.ts upserts with
-- `{ onConflict: "event_id", ignoreDuplicates: true }`, which Postgres
-- expands to `ON CONFLICT (event_id) DO NOTHING` — no WHERE predicate.
-- Postgres requires the ON CONFLICT target to exactly match an existing
-- unique constraint/index (a partial index only qualifies if the same
-- predicate is restated in the ON CONFLICT clause, which supabase-js's
-- .upsert() does not do). Result: every single insert failed with
-- "there is no unique or exclusion constraint matching the ON CONFLICT
-- specification", and because trackEvent() never surfaces errors to its
-- caller, this failed silently for every one of the 9 wired call sites.
--
-- Safe to tighten event_id to NOT NULL + a plain UNIQUE constraint: the
-- table has 0 rows today (verified), and the only two writers of this
-- table (this repo's and the Tareeq consumer repo's identical
-- app/api/analytics/ingest/route.ts) always populate event_id from the
-- validated request schema (analyticsEventSchema requires a uuid) before
-- ever reaching the database.

drop index if exists analytics_events_event_id_key;

alter table analytics_events alter column event_id set not null;

alter table analytics_events
  add constraint analytics_events_event_id_key unique (event_id);

notify pgrst, 'reload schema';
