-- Security review, 12 Nov 2026 (finding 8).
--
-- "owner write" accepted rows with user_id null, so anyone holding the
-- public anon key could insert fake assessments (any name, any email) that
-- then show in the admin Responses and analytics. Every write to
-- assessments runs on the server with the service role (persist, share),
-- so the browser roles keep their read policies only: their own rows and
-- shared reports. Idempotent.

drop policy if exists "owner write" on public.assessments;
drop policy if exists "owner update" on public.assessments;

revoke insert, update, delete, truncate on public.assessments from anon, authenticated;
