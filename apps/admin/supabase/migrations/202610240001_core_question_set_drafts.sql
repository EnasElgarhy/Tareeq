-- CORE 2.0 question set drafts for the admin CMS.
--
-- Additive and idempotent; touches no existing table or row. A draft is a
-- complete copy of the client's question-set file (same JSON shape as
-- questions-5.2.json) whose wording admins edit. Ids, codes, axes and order are
-- locked by the server action, so scoring 2.0 still applies. A finished draft
-- is downloaded and shipped as the next question-set file; the consumer keeps
-- reading its packaged file, so nothing here changes what students see.
--
-- Only the admin app's service role reads or writes this table.

create table if not exists public.core_question_set_drafts (
  id uuid primary key default gen_random_uuid(),
  -- The question set the draft was copied from, e.g. '5.2'.
  base_version text not null,
  -- The version the draft will ship as, e.g. '5.3'.
  target_version text not null,
  body jsonb not null,
  status text not null default 'draft'
    constraint core_question_set_drafts_status_check check (status in ('draft', 'handed_off')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists core_question_set_drafts_updated_idx
  on public.core_question_set_drafts(updated_at desc);

alter table public.core_question_set_drafts enable row level security;
revoke all on public.core_question_set_drafts from anon, authenticated;

notify pgrst, 'reload schema';
