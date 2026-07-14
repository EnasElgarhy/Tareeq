-- ════════════════════════════════════════════════════════════════════════════
-- Phase 3: Result Profiles (rich fields) + per-assessment scoring strategy.
--
-- ADDITIVE ONLY. `result_profiles` + `result_rules` already exist (Phase 0);
-- this extends `result_profiles` with the Phase 3 fields and adds a scoring
-- strategy to `assessments_catalog`. `result_rules` already carries the rule
-- shape (result_profile_id, combinator, conditions jsonb, priority) — the
-- "profile_rules" concept — so no new rules table is created.
-- CORE assessments are untouched. Re-runnable. Date: 2026-06-16
-- ════════════════════════════════════════════════════════════════════════════

-- Result profile rich fields. name/description (jsonb {en,ar}) already exist and
-- hold title_en/title_ar + description_en/description_ar. The list fields are
-- localised: { "en": [...], "ar": [...] }.
alter table result_profiles add column if not exists code text;
alter table result_profiles add column if not exists category_code text;
alter table result_profiles add column if not exists recommended_majors  jsonb not null default '{}'::jsonb;
alter table result_profiles add column if not exists recommended_careers jsonb not null default '{}'::jsonb;
alter table result_profiles add column if not exists strengths           jsonb not null default '{}'::jsonb;
alter table result_profiles add column if not exists development_areas   jsonb not null default '{}'::jsonb;

-- Profile code unique per assessment (where set).
create unique index if not exists result_profiles_code_per_catalog
  on result_profiles(catalog_id, code) where code is not null;

-- Per-assessment scoring strategy.
alter table assessments_catalog
  add column if not exists scoring_strategy text not null default 'first_match';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'assessments_catalog_scoring_strategy_chk') then
    alter table assessments_catalog
      add constraint assessments_catalog_scoring_strategy_chk
      check (scoring_strategy in ('first_match', 'highest_score_wins'));
  end if;
end $$;
