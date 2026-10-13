-- CORE model: question set 5.1, scoring 2.0 (CORE_01_Developer_Specification_V1, §3.3, §5, §9, §10).
--
-- Additive and idempotent: this runs against a live shared database. Nothing
-- existing is dropped or rewritten. An "attempt" in the spec is a row in
-- public.assessments; legacy v4 rows are marked scoring_version '1.x' and are
-- never compared with 2.0 results.
--
-- Writes to every new table go through server routes using the service role.
-- Students may read their own rows; there are no client write policies.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- attempts (§3.3, §9)

-- Metadata-only on PG11+, but still a brief ACCESS EXCLUSIVE lock: fail fast instead of queueing.
set lock_timeout = '5s';

alter table public.assessments
  add column if not exists question_set text,
  add column if not exists scoring_version text not null default '1.x',
  add column if not exists report_wording_version text,
  add column if not exists bank_version text,
  add column if not exists question_order text
    constraint assessments_question_order_check check (question_order in ('shuffled', 'fixed')),
  add column if not exists is_testing boolean not null default false,
  add column if not exists flags_live_at_submit boolean,
  add column if not exists submitted_at timestamptz,
  -- The one free retake a flagged attempt earns (§5); it sits outside the six-month rule.
  add column if not exists is_free_retake boolean not null default false,
  add column if not exists age_band text
    constraint assessments_age_band_check check (age_band in ('13-17', '18+'));

reset lock_timeout;

-- ---------------------------------------------------------------- student background (§3.4, §9)

alter table public.profiles
  add column if not exists age_band text
    constraint profiles_age_band_check check (age_band in ('13-17', '18+')),
  add column if not exists is_citizen text
    constraint profiles_is_citizen_check check (is_citizen in ('yes', 'no', 'prefer_not')),
  add column if not exists study_stage text;

-- ---------------------------------------------------------------- responses (§3.2)

create table if not exists public.core_responses (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  part smallint not null constraint core_responses_part_check check (part between 1 and 4),
  question_id text not null,
  option_id text not null,
  code text not null,
  -- 1–4 (or 1–2) as shown on screen; drives the same-position flag.
  position_shown smallint not null constraint core_responses_position_check check (position_shown >= 1),
  -- Every option ID in the order it was shown, so the screen can be rebuilt exactly (§3.1).
  options_shown text[] not null,
  time_on_screen_ms integer not null constraint core_responses_time_check check (time_on_screen_ms >= 0),
  -- Order in which the question appeared within the attempt.
  order_shown smallint not null constraint core_responses_order_check check (order_shown >= 1),
  answered_at timestamptz not null,
  -- True when the answer comes from a redone (previously flagged) part.
  is_redo boolean not null default false,
  constraint core_responses_unique unique (assessment_id, question_id, is_redo)
);

-- core_responses_unique leads with assessment_id, so it already serves per-attempt lookups.

-- ---------------------------------------------------------------- results (§4.4)

create table if not exists public.core_results (
  assessment_id uuid primary key references public.assessments(id) on delete cascade,
  scoring_version text not null,
  -- Full CoreResult: counts, leaders, clarity, reading, axes (count + zone), motivators.
  result jsonb not null,
  direction_clarity text not null
    constraint core_results_clarity_check check (direction_clarity in ('clear', 'leaning', 'close', 'open')),
  leading_curiosities text[] not null,
  leading_motivators text[] not null,
  no_small_set boolean not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- flags (§5)

create table if not exists public.core_flags (
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  part smallint not null constraint core_flags_part_check check (part between 1 and 4),
  median_ms numeric not null,
  largest_same_position_share numeric not null
    constraint core_flags_share_check check (largest_same_position_share between 0 and 1),
  rushed boolean not null,
  same_position boolean not null,
  flagged boolean not null,
  is_redo boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (assessment_id, part, is_redo)
);

-- ---------------------------------------------------------------- report render (§6.8)

create table if not exists public.core_report_renders (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  locale text not null,
  -- Ordered list of { block_id, fills } actually shown.
  blocks jsonb not null,
  report_wording_version text not null,
  bank_version text not null,
  rendered_at timestamptz not null default now()
);

create index if not exists core_report_renders_assessment_idx
  on public.core_report_renders(assessment_id, rendered_at desc);

-- ---------------------------------------------------------------- Kai (§7)

alter table public.kai_threads
  add column if not exists entry_prompt text;

create table if not exists public.kai_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid references public.assessments(id) on delete set null,
  thread_id uuid references public.kai_threads(id) on delete set null,
  kind text not null
    constraint kai_events_kind_check check (kind in ('disagreement', 'shift_explanation', 'safeguarding_alert')),
  -- disagreement: { pillar, item, words }; shift_explanation: { shift, words }.
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists kai_events_user_idx on public.kai_events(user_id);
create index if not exists kai_events_assessment_idx on public.kai_events(assessment_id);
create index if not exists kai_events_thread_idx on public.kai_events(thread_id);
create index if not exists kai_events_kind_idx on public.kai_events(kind, created_at desc);

-- ---------------------------------------------------------------- consent (§10)

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null
    constraint consent_records_kind_check check (kind in ('assessment', 'guardian', 'research', 'parent_access', 'kai_parent_notice')),
  is_granted boolean not null,
  text_version text not null,
  given_by text not null
    constraint consent_records_given_by_check check (given_by in ('student', 'guardian')),
  given_at timestamptz not null default now(),
  withdrawn_at timestamptz
);

create index if not exists consent_records_user_idx on public.consent_records(user_id, kind);

-- ---------------------------------------------------------------- share card (§11, phase 2)

create table if not exists public.share_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  assessment_id uuid references public.assessments(id) on delete set null,
  format text not null constraint share_events_format_check check (format in ('story', 'square')),
  -- Which parts the student hid. No card content is stored.
  hidden_parts text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists share_events_user_idx on public.share_events(user_id);
create index if not exists share_events_assessment_idx on public.share_events(assessment_id);

-- ---------------------------------------------------------------- settings (§5 switch)

create table if not exists public.core_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Flags are calculated and stored, but shown to nobody until the founder switches this on.
insert into public.core_settings (key, value)
values ('flags_live', 'false'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------- row level security

alter table public.core_responses enable row level security;
alter table public.core_results enable row level security;
alter table public.core_flags enable row level security;
alter table public.core_report_renders enable row level security;
alter table public.kai_events enable row level security;
alter table public.consent_records enable row level security;
alter table public.share_events enable row level security;
alter table public.core_settings enable row level security;

-- Students read their own attempt data; flags, responses and Kai events stay internal.
drop policy if exists "core results owner read" on public.core_results;
create policy "core results owner read" on public.core_results for select to authenticated using (
  exists (
    select 1 from public.assessments a
    where a.id = core_results.assessment_id and a.user_id = (select auth.uid())
  )
);

drop policy if exists "core renders owner read" on public.core_report_renders;
create policy "core renders owner read" on public.core_report_renders for select to authenticated using (
  exists (
    select 1 from public.assessments a
    where a.id = core_report_renders.assessment_id and a.user_id = (select auth.uid())
  )
);

drop policy if exists "consent owner read" on public.consent_records;
create policy "consent owner read" on public.consent_records for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "core settings readable" on public.core_settings;
create policy "core settings readable" on public.core_settings for select to authenticated
  using (true);

-- No client writes anywhere (TRUNCATE would bypass RLS): only server routes
-- using the service role insert or update. Re-grant just the reads above.
revoke all on
  public.core_responses,
  public.core_results,
  public.core_flags,
  public.core_report_renders,
  public.kai_events,
  public.consent_records,
  public.share_events,
  public.core_settings
from anon, authenticated;

grant select on
  public.core_results,
  public.core_report_renders,
  public.consent_records,
  public.core_settings
to authenticated;

-- ---------------------------------------------------------------- guard server-managed attempt columns

-- assessments keeps its existing owner insert/update policies, so students
-- could otherwise set their own scoring version, testing tag or flags state.
create or replace function public.assessments_guard_core_cols() returns trigger
language plpgsql set search_path = '' as $$
begin
  if coalesce(auth.role(), 'service_role') in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.question_set := null;
      new.scoring_version := '1.x';
      new.report_wording_version := null;
      new.bank_version := null;
      new.question_order := null;
      new.is_testing := false;
      new.flags_live_at_submit := null;
      new.submitted_at := null;
      new.age_band := null;
      new.is_free_retake := false;
    elsif (new.question_set, new.scoring_version, new.report_wording_version, new.bank_version,
           new.question_order, new.is_testing, new.flags_live_at_submit, new.submitted_at, new.age_band, new.is_free_retake)
          is distinct from
          (old.question_set, old.scoring_version, old.report_wording_version, old.bank_version,
           old.question_order, old.is_testing, old.flags_live_at_submit, old.submitted_at, old.age_band, old.is_free_retake) then
      raise exception 'core attempt columns are server-managed' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists assessments_guard_core_cols on public.assessments;
create trigger assessments_guard_core_cols before insert or update on public.assessments
  for each row execute function public.assessments_guard_core_cols();

notify pgrst, 'reload schema';
