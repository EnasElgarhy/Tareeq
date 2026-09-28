-- Admin Users (Student & Account Management) module — additive schema.
--
-- STATUS: NOT YET APPLIED. This file is prepared for review; applying it to the
-- shared Supabase project is a gated action pending explicit approval (it
-- touches a production database). It is fully additive and preserves all
-- existing data. Apply with the project's normal migration flow only after sign-off.
--
-- Adds the three internal admin tables the module needs (notes, flags, audit
-- log) plus a nullable `suspended_at` on user_accounts for soft suspension.
-- Everything else the Users module shows is derived from existing tables
-- (profiles, user_accounts, assessments, analytics_events) — no other schema
-- change is required. RLS mirrors the existing admin convention
-- (profiles.role = 'admin'); the app itself reads/writes via the service-role
-- client, so these policies are defense-in-depth.

-- ── Internal notes (admin-only, never visible to students) ──────────────────
create table if not exists admin_user_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists admin_user_notes_user_id_idx on admin_user_notes (user_id);
create index if not exists admin_user_notes_created_at_idx on admin_user_notes (created_at desc);

-- ── Internal flags (allowlisted taxonomy, open/resolved lifecycle) ──────────
create table if not exists admin_user_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  flag_type text not null check (flag_type in (
    'needs_support', 'follow_up', 'school_pilot', 'high_potential',
    'requested_deletion', 'technical_issue', 'content_issue', 'safeguarding_review'
  )),
  status text not null default 'open' check (status in ('open', 'resolved')),
  note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz
);
create index if not exists admin_user_flags_user_id_idx on admin_user_flags (user_id);
create index if not exists admin_user_flags_status_idx on admin_user_flags (status);

-- ── Audit log for sensitive admin actions ───────────────────────────────────
create table if not exists admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_user_id uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_log_target_idx on admin_audit_log (target_user_id, created_at desc);
create index if not exists admin_audit_log_actor_idx on admin_audit_log (actor_user_id, created_at desc);

-- ── Soft suspension (distinct from user_accounts.deleted_at) ────────────────
alter table user_accounts add column if not exists suspended_at timestamptz;

-- ── RLS: admin-only, mirroring the existing convention ──────────────────────
alter table admin_user_notes enable row level security;
alter table admin_user_flags enable row level security;
alter table admin_audit_log enable row level security;

create policy "admin manage user notes" on admin_user_notes for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
) with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "admin manage user flags" on admin_user_flags for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
) with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
-- Audit log: admins may read; inserts happen via the service-role client only
-- (no client-facing insert policy, so records can't be forged from the browser).
create policy "admin read audit log" on admin_audit_log for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
