-- Ask-a-parent payment links.
--
-- A student who cannot pay sends a parent a private link (`/pay/<token>`).
-- The parent opens a short page about CORE, ticks the guardian confirmation
-- and pays through Stripe. The Stripe session carries the student's
-- `user_id` / `assessment_id`, so the existing webhook grants the
-- entitlement to the student exactly as for a self-paid unlock; this table
-- only tracks the link itself (sent, opened, paid) and the consent record.
--
-- Token handling matches `report_access_invites`: only sha256(token) is
-- stored. The page shows no name, answers or results, so a forwarded link
-- leaks nothing beyond "someone can pay for a report".
--
-- Additive and idempotent: runs against a live shared database.

create extension if not exists pgcrypto;

create table if not exists public.parent_pay_links (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null constraint parent_pay_links_token_hash_unique unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  opened_at timestamptz,
  paid_at timestamptz,
  status text not null default 'pending'
    constraint parent_pay_links_status_check check (status in ('pending', 'paid', 'revoked')),
  -- First-touch `src` / `post` of the student, so a parent payment is still
  -- credited to the post that brought the student in.
  attribution jsonb not null default '{}'::jsonb,
  -- { consented_at, wording_version } from the guardian tick box.
  consent jsonb,
  stripe_session_id text
);

create index if not exists parent_pay_links_user_assessment_idx
  on public.parent_pay_links(user_id, assessment_id, created_at desc);

alter table public.parent_pay_links enable row level security;

-- Service-role only: no policies, so anon/authenticated can neither list
-- tokens nor write. Every read and write goes through the consumer API.
revoke all on public.parent_pay_links from anon, authenticated;

notify pgrst, 'reload schema';
