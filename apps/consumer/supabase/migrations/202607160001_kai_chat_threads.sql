create table if not exists public.kai_threads (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid references public.assessments(id) on delete set null,
  goal text not null check (goal in (
    'explain_results',
    'find_majors',
    'compare_careers',
    'build_plan',
    'explain_to_parents',
    'challenge_result'
  )),
  title text,
  summary text not null default '',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kai_threads_user_updated_idx
  on public.kai_threads(user_id, updated_at desc);

create table if not exists public.kai_messages (
  id uuid primary key,
  thread_id uuid not null references public.kai_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  role text not null check (role in ('user', 'kai')),
  status text not null default 'pending' check (status in ('pending', 'complete', 'failed')),
  text text not null default '',
  blocks jsonb,
  quick_replies jsonb,
  intent text,
  error_code text,
  assistant_message_id uuid,
  response_meta jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (thread_id, request_id, role)
);

create index if not exists kai_messages_thread_created_idx
  on public.kai_messages(thread_id, created_at);

alter table public.kai_threads enable row level security;
alter table public.kai_messages enable row level security;

create policy "kai thread owner read" on public.kai_threads
  for select using (auth.uid() = user_id);
create policy "kai thread owner insert" on public.kai_threads
  for insert with check (auth.uid() = user_id);
create policy "kai thread owner update" on public.kai_threads
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "kai thread owner delete" on public.kai_threads
  for delete using (auth.uid() = user_id);

create policy "kai message owner read" on public.kai_messages
  for select using (auth.uid() = user_id);
create policy "kai message owner insert" on public.kai_messages
  for insert with check (
    auth.uid() = user_id and exists (
      select 1 from public.kai_threads owned_thread
      where owned_thread.id = kai_messages.thread_id
        and owned_thread.user_id = auth.uid()
    )
  );
create policy "kai message owner update" on public.kai_messages
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "kai message owner delete" on public.kai_messages
  for delete using (auth.uid() = user_id);
