
create table public.marketing_videos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.marketing_projects(id) on delete cascade,
  user_id uuid not null,
  title text not null default 'Untitled video',
  duration_seconds int not null default 30,
  voice_id text not null,
  voice_name text not null,
  prompt text default '',
  script text default '',
  scenes jsonb not null default '[]'::jsonb,
  audio_url text,
  video_url text,
  thumbnail_url text,
  status text not null default 'ready',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.marketing_videos enable row level security;

create policy "Users can view their own marketing videos"
  on public.marketing_videos for select
  using (auth.uid() = user_id);

create policy "Users can create their own marketing videos"
  on public.marketing_videos for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own marketing videos"
  on public.marketing_videos for update
  using (auth.uid() = user_id);

create policy "Users can delete their own marketing videos"
  on public.marketing_videos for delete
  using (auth.uid() = user_id);

create index marketing_videos_project_id_idx on public.marketing_videos(project_id);
