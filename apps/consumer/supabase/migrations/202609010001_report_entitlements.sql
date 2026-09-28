-- Paid report unlocks. One row per (user, assessment) that has been paid for.
--
-- This is the only server-side source of truth for whether a report is
-- unlocked: the browser's localStorage cache never decides access. The
-- entitlement key is (user_id, assessment_id) where assessment_id is
-- public.assessments.id — reportIdFromGeneratedAt() is display/local-cache only
-- and must never reach the server as an identity.
--
-- Additive and idempotent: this runs against a live shared database.

create extension if not exists pgcrypto;

create table if not exists public.report_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  status text not null default 'active'
    constraint report_entitlements_status_check check (status in ('active', 'revoked')),
  -- Webhook idempotency key: checkout.session.completed upserts on conflict here.
  stripe_session_id text
    constraint report_entitlements_stripe_session_unique unique,
  stripe_payment_intent_id text,
  amount_minor integer,
  currency text,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint report_entitlements_user_assessment_unique unique (user_id, assessment_id)
);

-- stripe_session_id already has a unique constraint, which provides its index.
create index if not exists report_entitlements_assessment_idx
  on public.report_entitlements(assessment_id);

alter table public.report_entitlements enable row level security;

-- Owners may read their own entitlements. There is deliberately no insert or
-- update policy: with RLS on and no write policy, anon/authenticated writes are
-- denied, and only the service role (which bypasses RLS) may mint or revoke an
-- entitlement from the Stripe webhook.
drop policy if exists "entitlement owner read" on public.report_entitlements;
create policy "entitlement owner read" on public.report_entitlements
  for select using (auth.uid() = user_id);

-- Belt and braces on a revenue table: strip write privileges as well, so the
-- service-role-only rule does not rest on RLS policy absence alone.
revoke insert, update, delete on public.report_entitlements from anon, authenticated;

notify pgrst, 'reload schema';
