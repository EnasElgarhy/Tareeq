-- Admin team management — roles + invitations. Additive schema.
--
-- STATUS: NOT YET APPLIED. Gated pending explicit approval (touches the shared
-- production DB). Fully additive, preserves existing data. Apply TOGETHER with
-- 202607150001 (this reuses admin_audit_log; a defensive create-if-not-exists
-- is included so ordering can't break it). Also requires SMTP configured in the
-- Supabase project for invite emails to actually send.
--
-- Model: `admin_members` is the source of truth for who is on the admin team
-- and their role. Existing binary admins (profiles.role='admin') keep full
-- access — the app treats a legacy admin with no admin_members row as 'owner'.

-- ── Team members ────────────────────────────────────────────────────────────
create table if not exists admin_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'analyst', 'viewer')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists admin_members_role_idx on admin_members (role);

-- ── Pending invitations ─────────────────────────────────────────────────────
create table if not exists admin_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('owner', 'admin', 'editor', 'analyst', 'viewer')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
create index if not exists admin_invitations_email_idx on admin_invitations (lower(email));
create index if not exists admin_invitations_status_idx on admin_invitations (status);

-- ── Audit log (defensive — also created by 202607150001) ────────────────────
create table if not exists admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_user_id uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ── RLS: admin-only, mirroring the existing profiles.role='admin' convention ──
alter table admin_members enable row level security;
alter table admin_invitations enable row level security;
alter table admin_audit_log enable row level security;

create policy "admin manage members" on admin_members for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
) with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "admin manage invitations" on admin_invitations for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
) with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'admin_audit_log' and policyname = 'admin read audit log') then
    create policy "admin read audit log" on admin_audit_log for select using (
      exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
    );
  end if;
end $$;

-- ── Seed: promote existing binary admins to Owner (idempotent) ──────────────
-- So current admins appear on the team with full rights the moment this applies.
insert into admin_members (user_id, role)
select p.id, 'owner' from profiles p
where p.role = 'admin'
on conflict (user_id) do nothing;
