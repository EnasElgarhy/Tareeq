-- Backfill the version columns on CORE 2.0 attempts. DATA CHANGE: needs
-- explicit approval before it is applied to the live database.
--
-- The consumer's persist route stores CORE attempts under the content_versions
-- row 'core-5.1-interim-2026-10-15' with result.scoringVersion = '2.0' and
-- result.contentVersions, but does not set the columns added by
-- 202610040001_core_v2_model.sql, so they keep their defaults
-- (scoring_version = '1.x'). This marks those rows from their own stored
-- result. v4 rows are not touched. The admin CMS already classifies attempts
-- from the version row and the result, so it is correct with or without this.
--
-- Idempotent, and a no-op when 202610040001 has not been applied.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'assessments' and column_name = 'scoring_version'
  ) then
    raise notice 'assessments.scoring_version missing; apply 202610040001_core_v2_model.sql first';
    return;
  end if;

  update public.assessments a
  set
    scoring_version = '2.0',
    question_set = coalesce(a.question_set, a.result->'contentVersions'->>'questionSet'),
    report_wording_version = coalesce(a.report_wording_version, a.result->'contentVersions'->>'reportWording'),
    bank_version = coalesce(a.bank_version, a.result->'contentVersions'->>'bank')
  from public.content_versions v
  where v.id = a.version_id
    and v.label = 'core-5.1-interim-2026-10-15'
    and a.result->>'scoringVersion' = '2.0'
    and a.scoring_version is distinct from '2.0';
end $$;
