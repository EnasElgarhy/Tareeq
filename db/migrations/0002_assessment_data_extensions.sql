create table user_accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  user_id_hash text not null unique,
  name text not null,
  email text not null unique,
  email_verified boolean not null default false,
  email_verified_at timestamptz,
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index user_accounts_hash_idx on user_accounts(user_id_hash);
create index user_accounts_email_idx on user_accounts(email);

create table assessment_data (
  id uuid primary key default gen_random_uuid(),
  user_id_hash text,
  completed_at timestamptz not null,
  assessment_version text not null default 'v4',
  questions_version text not null default 'q4',
  scoring_algorithm_version text not null default 's2026-05-21',
  age_at_completion int,
  country_code text,
  gender text,
  education_level text,
  school_type text,
  responses jsonb not null default '{}'::jsonb,
  cluster_raw_scores jsonb not null,
  cluster_bonus_scores jsonb not null,
  cluster_final_scores jsonb not null,
  cluster_rankings jsonb not null,
  operations_archetype text,
  operations_processing text,
  operations_focus text,
  operations_scores jsonb not null,
  rewards_primary_drivers jsonb not null,
  rewards_secondary_drivers jsonb not null,
  rewards_scores jsonb not null,
  ecosystems_fit text,
  ecosystems_social text,
  ecosystems_pulse text,
  ecosystems_scores jsonb not null,
  final_cluster text not null,
  final_cluster_score numeric(5, 2),
  confidence_percentage int,
  confidence_label text,
  is_multi_curious boolean not null default false,
  multi_curious_clusters jsonb not null default '[]'::jsonb,
  time_spent_seconds int,
  completion_rate numeric(5, 2),
  device_type text,
  browser text,
  consent_general_research boolean not null default false,
  consent_longitudinal_followup boolean not null default false,
  consent_university_sharing boolean not null default false,
  consent_recorded_at timestamptz,
  consent_language text,
  consent_version text,
  consent_withdrawn boolean not null default false,
  consent_withdrawn_at timestamptz,
  riasec_scores jsonb default null,
  riasec_code text default null,
  riasec_calculated boolean not null default false,
  functional_cluster text default null,
  onet_soc_codes jsonb default null,
  functional_calculated boolean not null default false,
  language text not null default 'en'
);

create index assessment_data_country_idx on assessment_data(country_code);
create index assessment_data_completed_idx on assessment_data(completed_at);
create index assessment_data_cluster_idx on assessment_data(final_cluster);
create index assessment_data_research_consent_idx
  on assessment_data(consent_general_research);
create index assessment_data_version_idx on assessment_data(assessment_version);

create table user_outcomes (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references assessment_data(id) on delete cascade,
  followup_date timestamptz not null,
  months_since_assessment int,
  actual_university text,
  actual_major text,
  actual_career text,
  chosen_cluster text,
  alignment_with_prediction boolean,
  satisfaction_rating int,
  would_recommend boolean,
  feedback_text text,
  survey_method text,
  created_at timestamptz not null default now()
);

create index user_outcomes_assessment_idx on user_outcomes(assessment_id);

alter table user_accounts enable row level security;
alter table assessment_data enable row level security;
alter table user_outcomes enable row level security;

create policy "admin read user accounts" on user_accounts for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "admin read assessment data" on assessment_data for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "admin read user outcomes" on user_outcomes for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
