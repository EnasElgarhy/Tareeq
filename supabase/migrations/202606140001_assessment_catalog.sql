-- ════════════════════════════════════════════════════════════════════════════
-- Hybrid Assessment Creation System — catalog, scoring spec, profiles, rules,
-- source documents, and Supabase Storage for original uploads.
--
-- ADDITIVE ONLY. Existing tables and rows are untouched except for new nullable
-- columns with safe defaults. Re-runnable (IF NOT EXISTS + drop-policy-if-exists).
--
-- RLS: every new table is admin-only for ALL operations. The admin predicate is
-- inlined as: a `profiles` row for auth.uid() whose role = 'admin'.
-- Date: 2026-06-14
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. ASSESSMENTS CATALOG ──────────────────────────────────────────────────
-- The stable identity row for an assessment. Owns 1..N content_versions
-- snapshots (existing table). Questions stay version-scoped; ResultProfiles,
-- Rules, ScoringSpecs and SourceDocuments are catalog-scoped (identity-level).
create table if not exists assessments_catalog (
  id                   uuid primary key default gen_random_uuid(),
  name                 jsonb not null,                       -- {en, ar}
  description          jsonb,
  primary_language     text not null default 'en',
  supported_languages  jsonb not null default '["en"]'::jsonb,
  assessment_type      text not null default 'core'
                         check (assessment_type in ('core', 'custom')),
  creation_method      text not null default 'manual'
                         check (creation_method in ('manual', 'ai_import')),
  status               text not null default 'draft'
                         check (status in ('draft', 'published', 'archived')),
  published_locales    jsonb not null default '[]'::jsonb,   -- set at publish time
  created_by           uuid references auth.users(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists assessments_catalog_status_idx on assessments_catalog(status);
create index if not exists assessments_catalog_type_idx   on assessments_catalog(assessment_type);

-- ── 2. LINK content_versions TO CATALOG ─────────────────────────────────────
-- Nullable + ON DELETE SET NULL: existing rows keep catalog_id = NULL and stay
-- valid. New assessments create a catalog row first, then link their version(s).
alter table content_versions
  add column if not exists catalog_id uuid references assessments_catalog(id) on delete set null;
create index if not exists content_versions_catalog_idx on content_versions(catalog_id);

-- ── 3. WEIGHT ON QUESTION OPTIONS ───────────────────────────────────────────
-- Default 1 preserves current Core behaviour for every existing row.
alter table question_options
  add column if not exists weight numeric(5,2) not null default 1;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'question_options_weight_positive') then
    alter table question_options add constraint question_options_weight_positive check (weight > 0);
  end if;
end $$;

-- ── 4. CLUSTER LOCALIZATION ──────────────────────────────────────────────────
-- Add jsonb i18n columns alongside the existing flat text columns (kept for
-- backward compatibility). Backfill English from `name`/`description` and seed
-- Arabic names for the eight Core clusters.
alter table clusters add column if not exists name_i18n        jsonb;
alter table clusters add column if not exists description_i18n jsonb;

update clusters set
  name_i18n = jsonb_build_object('en', name, 'ar',
    case code
      when 'TECH' then 'التقنية'
      when 'ENG'  then 'الهندسة'
      when 'SCI'  then 'العلوم'
      when 'ART'  then 'الفنون والإعلام'
      when 'BUS'  then 'الأعمال'
      when 'LAW'  then 'القانون والسياسات'
      when 'PPL'  then 'الرعاية والعلاقات الإنسانية'
      when 'ENV'  then 'البيئة'
      else null
    end),
  description_i18n = jsonb_build_object('en', description, 'ar', null)
where name_i18n is null;

-- ── 5. RESULT PROFILES ───────────────────────────────────────────────────────
-- Named outcome buckets (e.g. "Engineering Explorer"). Catalog-scoped.
create table if not exists result_profiles (
  id            uuid primary key default gen_random_uuid(),
  catalog_id    uuid not null references assessments_catalog(id) on delete cascade,
  name          jsonb not null,                              -- {en, ar}
  description   jsonb,
  color         text,
  icon          text,
  is_fallback   boolean not null default false,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists result_profiles_catalog_idx on result_profiles(catalog_id);
-- At most one fallback profile per catalog, enforced atomically.
create unique index if not exists result_profiles_one_fallback_per_catalog
  on result_profiles(catalog_id) where is_fallback;

-- ── 6. RESULT RULES ──────────────────────────────────────────────────────────
-- Deterministic IF conditions THEN profile rows. conditions is a jsonb array of
-- {cluster, operator, value}. Lower priority fires first; first-match wins.
create table if not exists result_rules (
  id                uuid primary key default gen_random_uuid(),
  catalog_id        uuid not null references assessments_catalog(id) on delete cascade,
  result_profile_id uuid not null references result_profiles(id) on delete cascade,
  combinator        text not null default 'AND' check (combinator in ('AND', 'OR')),
  conditions        jsonb not null default '[]'::jsonb,
  priority          int not null default 0,
  created_at        timestamptz not null default now()
);
create index if not exists result_rules_catalog_idx on result_rules(catalog_id, priority);

-- ── 7. SCORING SPECS ─────────────────────────────────────────────────────────
-- The execution artifact. spec_json is the {clusters, profiles, rules} blob
-- assembled from the editing tables at publish time. Versioned by inserting a
-- new row; exactly one row per catalog may be current (partial unique index).
create table if not exists scoring_specs (
  id          uuid primary key default gen_random_uuid(),
  catalog_id  uuid not null references assessments_catalog(id) on delete cascade,
  source      text not null check (source in ('manual', 'ai_generated')),
  version     int not null default 1,
  spec_json   jsonb not null,
  is_current  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists scoring_specs_catalog_idx on scoring_specs(catalog_id);
-- Atomic "one current spec per catalog" guarantee (no app-level race window).
create unique index if not exists scoring_specs_one_current_per_catalog
  on scoring_specs(catalog_id) where is_current;

-- ── 8. SOURCE DOCUMENTS ──────────────────────────────────────────────────────
-- Original uploaded materials for AI Import. storage_path points at the original
-- file in the 'assessment-sources' bucket; extracted_text is the text fed to the
-- AI extractor. The AI extractor NEVER receives user answers — only this text.
create table if not exists source_documents (
  id              uuid primary key default gen_random_uuid(),
  catalog_id      uuid not null references assessments_catalog(id) on delete cascade,
  file_name       text not null,
  file_type       text not null check (file_type in ('csv', 'pdf', 'docx', 'md', 'txt')),
  category        text not null check (category in ('questions', 'scoring_logic')),
  storage_path    text,                                      -- bucket object path
  extracted_text  text,
  detected_language text,
  uploaded_by     uuid references auth.users(id),
  created_at      timestamptz not null default now()
);
create index if not exists source_documents_catalog_idx on source_documents(catalog_id);

-- ── 9. ROW LEVEL SECURITY — admin-only full CRUD on every new table ──────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'assessments_catalog', 'result_profiles', 'result_rules',
    'scoring_specs', 'source_documents'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_admin_select', t);
    execute format('drop policy if exists %I on %I', t || '_admin_insert', t);
    execute format('drop policy if exists %I on %I', t || '_admin_update', t);
    execute format('drop policy if exists %I on %I', t || '_admin_delete', t);

    execute format(
      'create policy %I on %I for select using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = ''admin''))',
      t || '_admin_select', t);
    execute format(
      'create policy %I on %I for insert with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = ''admin''))',
      t || '_admin_insert', t);
    execute format(
      'create policy %I on %I for update using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = ''admin'')) with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = ''admin''))',
      t || '_admin_update', t);
    execute format(
      'create policy %I on %I for delete using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = ''admin''))',
      t || '_admin_delete', t);
  end loop;
end $$;

-- ── 10. STORAGE BUCKET — original source documents (admin-only, private) ─────
insert into storage.buckets (id, name, public)
  values ('assessment-sources', 'assessment-sources', false)
  on conflict (id) do nothing;

drop policy if exists "assessment_sources_admin_select" on storage.objects;
drop policy if exists "assessment_sources_admin_insert" on storage.objects;
drop policy if exists "assessment_sources_admin_update" on storage.objects;
drop policy if exists "assessment_sources_admin_delete" on storage.objects;

create policy "assessment_sources_admin_select" on storage.objects
  for select using (
    bucket_id = 'assessment-sources'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy "assessment_sources_admin_insert" on storage.objects
  for insert with check (
    bucket_id = 'assessment-sources'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy "assessment_sources_admin_update" on storage.objects
  for update using (
    bucket_id = 'assessment-sources'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy "assessment_sources_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'assessment-sources'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
