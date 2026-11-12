-- Security review, 12 Nov 2026 (finding 1).
--
-- The "self write" policy let a signed-in student update their own profiles
-- row with no column limit, including `role`. role = 'admin' opens every
-- "admin read all" policy (is_admin()), so a student could read every
-- student's assessments, and the admin app used to treat it as an Owner.
--
-- Every legitimate write to profiles runs on the server with the service
-- role (assessments/persist, admin team actions), so the browser roles keep
-- read access only. Idempotent: safe to run more than once.

drop policy if exists "self write" on public.profiles;

revoke insert, update, delete, truncate on public.profiles from anon, authenticated;
