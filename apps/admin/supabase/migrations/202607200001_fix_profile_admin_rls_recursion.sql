-- The original profiles admin policy queried profiles from inside a profiles
-- policy, which makes PostgreSQL re-enter RLS and fail with:
--   infinite recursion detected in policy for relation "profiles"
--
-- Keep the same authorization rule, but evaluate it through a tightly scoped
-- security-definer helper so the lookup does not recursively apply RLS.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "admin read all" on public.profiles;
create policy "admin read all" on public.profiles
  for select
  using (public.is_admin());
