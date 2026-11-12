-- Security review, 12 Nov 2026 (finding 2).
--
-- "admin manage members" / "admin manage invitations" let anyone whose
-- profiles.role is 'admin' (every invited team member, whatever their role,
-- and suspended ones too) write these tables directly through the API: a
-- Viewer could make themselves Owner, skipping the role rules and the audit
-- log. The admin app reads and writes them only with the service role, so
-- the browser roles get no access at all. Idempotent.

drop policy if exists "admin manage members" on public.admin_members;
drop policy if exists "admin manage invitations" on public.admin_invitations;

revoke all on public.admin_members from anon, authenticated;
revoke all on public.admin_invitations from anon, authenticated;
revoke insert, update, delete, truncate on public.admin_audit_log from anon, authenticated;
