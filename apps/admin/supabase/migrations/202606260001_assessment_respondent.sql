-- Capture respondent identity inline on each assessment submission, so admins
-- can see WHO took each assessment (the consumer flow is anonymous — there is
-- usually no auth user_id). Additive + nullable + idempotent: the live consumer
-- flow is unaffected until persistence is wired (see docs/RESPONSES_FEATURE.md).
alter table assessments add column if not exists respondent_name text;
alter table assessments add column if not exists respondent_email text;

create index if not exists assessments_respondent_email_idx
  on assessments(respondent_email);
