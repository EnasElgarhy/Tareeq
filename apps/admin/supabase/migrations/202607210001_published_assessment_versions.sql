-- Keep assessment attempts pinned to an immutable published version while
-- allowing the admin to atomically move the active pointer to a new version.

alter table content_versions
  add column if not exists published_at timestamptz;

-- The version that was live before this migration is already published.
update content_versions
set published_at = coalesce(published_at, created_at, now())
where is_active;

create unique index if not exists content_versions_single_active_idx
  on content_versions ((true))
  where is_active;

create or replace function public.publish_content_version(
  target_version_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from content_versions where id = target_version_id
  ) then
    raise exception 'Content version % does not exist', target_version_id;
  end if;

  update content_versions
  set is_active = false
  where is_active and id <> target_version_id;

  update content_versions
  set
    is_active = true,
    published_at = coalesce(published_at, now())
  where id = target_version_id;
end;
$$;

revoke all on function public.publish_content_version(uuid) from public;
grant execute on function public.publish_content_version(uuid) to service_role;

-- Published versions remain readable for attempts that began before a newer
-- version went live. Draft versions stay admin-only.
drop policy if exists "active version readable by all" on content_versions;
drop policy if exists "published versions readable by all" on content_versions;
create policy "published versions readable by all" on content_versions
  for select using (
    is_active
    or published_at is not null
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "questions in active version readable by all" on questions;
drop policy if exists "questions in published versions readable by all" on questions;
create policy "questions in published versions readable by all" on questions
  for select using (exists (
    select 1 from content_versions v
    where v.id = questions.version_id
      and (
        v.is_active
        or v.published_at is not null
        or exists (
          select 1 from profiles p
          where p.id = auth.uid() and p.role = 'admin'
        )
      )
  ));
