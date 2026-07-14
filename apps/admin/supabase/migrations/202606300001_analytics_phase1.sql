-- ════════════════════════════════════════════════════════════════════════════
-- Admin Analytics Phase 1 — minimal additive schema for /admin/analytics.
--
-- ADDITIVE ONLY. No existing column is modified or dropped; every new column
-- is nullable so current rows and the live consumer flow are unaffected.
-- Date: 2026-06-30
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. EDUCATION LEVEL ON PROFILES ──────────────────────────────────────────
-- Demographics breakdown needs this; nothing captures it yet (no onboarding
-- step asks for it). Added now so a future profile/onboarding screen has a
-- column to write to — the analytics page reports "Unknown" until it does.
alter table profiles add column if not exists education_level text;

-- ── 2. RESEARCH CONSENT ON ASSESSMENTS ──────────────────────────────────────
-- Nullable, no default: null means "not asked" (true for every row today),
-- distinct from an explicit decline. The "Research consent rate" stat reports
-- "no consent data collected yet" until a consent step writes to this column.
alter table assessments add column if not exists consent_research boolean;

-- ── 3. ANALYTICS EVENTS ─────────────────────────────────────────────────────
-- Generic lifecycle event log for funnel stages the `assessments` row alone
-- can't tell us: a result being viewed, downloaded, or shared after
-- completion. Intentionally NOT given an insert policy — only the service-role
-- client (which bypasses RLS) can write, so any future consumer-side
-- instrumentation must go through a server route, never a direct client
-- insert. The funnel reports 0 for these stages until that route exists.
create table if not exists analytics_events (
  id            uuid primary key default gen_random_uuid(),
  event_type    text not null check (event_type in (
                  'results_viewed', 'result_downloaded', 'result_shared'
                )),
  assessment_id uuid references assessments(id) on delete cascade,
  occurred_at   timestamptz not null default now(),
  metadata      jsonb not null default '{}'::jsonb
);

create index if not exists analytics_events_type_idx on analytics_events(event_type);
create index if not exists analytics_events_assessment_idx on analytics_events(assessment_id);
create index if not exists analytics_events_occurred_idx on analytics_events(occurred_at);

alter table analytics_events enable row level security;

drop policy if exists "admin read analytics events" on analytics_events;
create policy "admin read analytics events" on analytics_events for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
