-- ════════════════════════════════════════════════════════════════════════════
-- Phase 2: per-assessment scoring categories + per-answer category mapping for
-- CUSTOM assessments (the "category" in custom_points_v1: answer → category →
-- points; "points" reuse question_options.weight from Phase 0).
--
-- ADDITIVE ONLY. CORE is untouched: CORE answers keep using
-- question_options.cluster_code and its FK to the global `clusters` table.
-- Custom answers use the new, FK-free `category_code`, validated app-side.
-- Re-runnable. Date: 2026-06-14
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Per-assessment scoring categories (catalog-scoped vocabulary).
create table if not exists assessment_categories (
  id            uuid primary key default gen_random_uuid(),
  catalog_id    uuid not null references assessments_catalog(id) on delete cascade,
  code          text not null,
  name          jsonb not null,                 -- {en, ar}
  display_order int not null default 0,
  created_at    timestamptz not null default now(),
  unique (catalog_id, code)
);
create index if not exists assessment_categories_catalog_idx
  on assessment_categories(catalog_id);

-- 2. Per-answer category for Custom assessments. No FK to the global clusters
--    table — validated app-side against assessment_categories. CORE answers
--    continue to use cluster_code (FK intact).
alter table question_options add column if not exists category_code text;

-- 3. RLS — admin-only full CRUD (same pattern as the Phase 0 tables).
do $$
begin
  execute 'alter table assessment_categories enable row level security';
  execute 'drop policy if exists assessment_categories_admin_select on assessment_categories';
  execute 'drop policy if exists assessment_categories_admin_insert on assessment_categories';
  execute 'drop policy if exists assessment_categories_admin_update on assessment_categories';
  execute 'drop policy if exists assessment_categories_admin_delete on assessment_categories';
  execute 'create policy assessment_categories_admin_select on assessment_categories for select using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = ''admin''))';
  execute 'create policy assessment_categories_admin_insert on assessment_categories for insert with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = ''admin''))';
  execute 'create policy assessment_categories_admin_update on assessment_categories for update using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = ''admin'')) with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = ''admin''))';
  execute 'create policy assessment_categories_admin_delete on assessment_categories for delete using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = ''admin''))';
end $$;
