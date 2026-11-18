-- Kai reference documents (developer note of 17 Nov 2026): files Kai reads
-- that the client replaces without code, starting with the subject guide
-- (key 'subject_guide'). Written by the admin and read by the student site,
-- both with the service role only; the browser roles get no access.

create table if not exists public.kai_reference_documents (
  key text primary key,
  version text not null,
  document jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.kai_reference_documents enable row level security;
revoke all on public.kai_reference_documents from anon, authenticated;
