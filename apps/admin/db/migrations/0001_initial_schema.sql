create extension if not exists pgcrypto;

create table clusters (
  code text primary key,
  name text not null,
  description text not null,
  display_order int not null
);

create table content_versions (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  notes text
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references content_versions(id) on delete cascade,
  external_id text not null,
  pillar int not null,
  position int not null,
  kind text not null,
  title jsonb not null,
  axis text,
  unique (version_id, external_id)
);

create table question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  letter text not null,
  position int not null,
  text jsonb not null,
  cluster_code text references clusters(code),
  driver_code text,
  axis_value text,
  unique (question_id, letter)
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  country text,
  birth_year int,
  gender text,
  locale text not null default 'en',
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

create table assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anon_session_id text,
  version_id uuid not null references content_versions(id),
  locale text not null default 'en',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  answers jsonb not null default '{}'::jsonb,
  result jsonb,
  client_result jsonb,
  user_agent text,
  ip_country text,
  share_token text unique
);

create index assessments_user_idx on assessments(user_id);
create index assessments_completed_idx on assessments(completed_at);
create index assessments_version_idx on assessments(version_id);

create table audio_clips (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade,
  kind text not null,
  locale text not null,
  voice text not null,
  storage_path text not null,
  bytes int not null,
  duration_ms int,
  generated_at timestamptz not null default now(),
  generated_by uuid references auth.users(id)
);

create index audio_clips_q_idx on audio_clips(question_id, locale);

-- Reference data: anyone can read.
alter table clusters enable row level security;
create policy "clusters readable by all" on clusters for select using (true);

alter table content_versions enable row level security;
create policy "active version readable by all" on content_versions
  for select using (is_active = true or exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

alter table questions enable row level security;
create policy "questions in active version readable by all" on questions
  for select using (exists (
    select 1 from content_versions v
    where v.id = questions.version_id and (v.is_active or exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
    ))
  ));

alter table question_options enable row level security;
create policy "options of readable questions are readable" on question_options
  for select using (exists (
    select 1 from questions q where q.id = question_options.question_id
  ));

-- Profiles: users see/edit their own; admins see all.
alter table profiles enable row level security;
create policy "self read" on profiles for select using (auth.uid() = id);
create policy "self write" on profiles for update using (auth.uid() = id);
create policy "admin read all" on profiles for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Assessments: users see/edit their own; admins see all.
alter table assessments enable row level security;
create policy "owner read" on assessments for select
  using (auth.uid() = user_id);
create policy "owner write" on assessments for insert
  with check (auth.uid() = user_id or user_id is null);
create policy "owner update" on assessments for update
  using (auth.uid() = user_id);
create policy "admin read all" on assessments for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "public read by share_token" on assessments for select
  using (share_token is not null and current_setting('request.jwt.claims', true)::jsonb->>'share_token' = share_token);

-- Audio clips: anyone can read metadata.
alter table audio_clips enable row level security;
create policy "audio readable" on audio_clips for select using (true);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, locale)
  values (new.id, coalesce(new.raw_user_meta_data->>'locale', 'en'));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
