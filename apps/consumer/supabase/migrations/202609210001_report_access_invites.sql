-- Admin free-access invitation links for report unlocks.
--
-- Lets an admin grant premium/report access without Stripe: the admin mints a
-- single-use, expiring, revocable invite bound to one (user, assessment) pair.
-- The consumer redeems the token server-side, which inserts an active
-- `report_entitlements` row with source='admin_grant'. Existing access checks
-- (`findActiveEntitlement`, `hasPaidReportAccess`) only read `status`, so they
-- treat a free grant exactly like a paid unlock.
--
-- Token handling: only sha256(token) is stored (`token_hash`). The full token
-- is shown to the admin once at creation and never stored. Redemption hashes
-- the presented token and compares against `token_hash`.
--
-- Additive and idempotent: runs against a live shared database.

create extension if not exists pgcrypto;

-- Distinguish Stripe purchases from admin grants on the entitlement itself,
-- so payments history and future reporting can label them correctly.
alter table public.report_entitlements
  add column if not exists source text not null default 'stripe'
    constraint report_entitlements_source_check check (source in ('stripe', 'admin_grant'));

alter table public.report_entitlements
  add column if not exists granted_by uuid references auth.users(id) on delete set null;

alter table public.report_entitlements
  add column if not exists granted_invite_id uuid;

-- One-time invite links. Bound to the grantee AND the assessment so a leaked
-- link cannot be redeemed by another user or applied to another report.
-- Redemption additionally verifies assessments.user_id = invite.user_id.
create table if not exists public.report_access_invites (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null constraint report_access_invites_token_hash_unique unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  status text not null default 'pending'
    constraint report_access_invites_status_check check (status in ('pending', 'redeemed', 'revoked'))
);

create index if not exists report_access_invites_user_idx
  on public.report_access_invites(user_id);
create index if not exists report_access_invites_assessment_idx
  on public.report_access_invites(assessment_id);

-- Back-reference from the minted entitlement to the invite that created it.
-- Added after the invites table exists; the reverse FK is intentionally
-- `on delete set null` so invite cleanup never removes the granted access.
alter table public.report_entitlements
  add constraint report_access_invites_entitlement_fk
  foreign key (granted_invite_id) references public.report_access_invites(id)
  on delete set null not valid;

alter table public.report_access_invites enable row level security;

-- Service-role only: no read/write policies, so anon/authenticated cannot list
-- tokens, and writes go through the admin server action (service role).
drop policy if exists "report invite owner read" on public.report_access_invites;
revoke insert, update, delete on public.report_access_invites from anon, authenticated;

notify pgrst, 'reload schema';
