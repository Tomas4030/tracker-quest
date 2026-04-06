-- Safe Supabase schema migration for EstagioTrack
-- This script is idempotent: it can be executed multiple times safely.

begin;

create extension if not exists pgcrypto;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text not null,
  group_code text not null,
  member_ids text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  description text,
  team_id uuid,
  color text not null default '#1a56db',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key,
  name text not null,
  email text not null,
  role text not null,
  active boolean not null default true,
  team_id uuid,
  company text,
  group_code text,
  project_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  project_id uuid,
  project_name text,
  title text not null,
  description text,
  date date not null,
  start_time time not null,
  end_time time not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users add column if not exists active boolean not null default true;
alter table public.users add column if not exists team_id uuid;
alter table public.users add column if not exists company text;
alter table public.users add column if not exists group_code text;
alter table public.users add column if not exists project_ids text[] not null default '{}';
alter table public.users add column if not exists created_at timestamptz not null default now();
alter table public.users add column if not exists updated_at timestamptz not null default now();

alter table public.teams add column if not exists member_ids text[] not null default '{}';
alter table public.teams add column if not exists active boolean not null default true;
alter table public.teams add column if not exists created_at timestamptz not null default now();
alter table public.teams add column if not exists updated_at timestamptz not null default now();

alter table public.projects add column if not exists description text;
alter table public.projects add column if not exists team_id uuid;
alter table public.projects add column if not exists color text not null default '#1a56db';
alter table public.projects add column if not exists active boolean not null default true;
alter table public.projects add column if not exists created_at timestamptz not null default now();
alter table public.projects add column if not exists updated_at timestamptz not null default now();

alter table public.activities add column if not exists project_id uuid;
alter table public.activities add column if not exists project_name text;
alter table public.activities add column if not exists created_at timestamptz not null default now();
alter table public.activities add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'users_email_unique'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users add constraint users_email_unique unique (email);
  end if;

  -- Allow custom roles (e.g. coordenador, gestor, etc.) while enforcing non-empty values.
  if exists (
    select 1 from pg_constraint
    where conname = 'users_role_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users drop constraint users_role_check;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'users_role_not_empty_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_role_not_empty_check
      check (length(trim(role)) > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'activities_status_check'
      and conrelid = 'public.activities'::regclass
  ) then
    alter table public.activities add constraint activities_status_check check (status in ('em-curso', 'concluido', 'pendente'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teams_group_code_unique'
      and conrelid = 'public.teams'::regclass
  ) then
    alter table public.teams add constraint teams_group_code_unique unique (group_code);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'projects_code_unique'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects add constraint projects_code_unique unique (code);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'projects_team_id_fkey'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
      add constraint projects_team_id_fkey
      foreign key (team_id) references public.teams(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'users_team_id_fkey'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_team_id_fkey
      foreign key (team_id) references public.teams(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'activities_user_id_fkey'
      and conrelid = 'public.activities'::regclass
  ) then
    alter table public.activities
      add constraint activities_user_id_fkey
      foreign key (user_id) references public.users(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'activities_project_id_fkey'
      and conrelid = 'public.activities'::regclass
  ) then
    alter table public.activities
      add constraint activities_project_id_fkey
      foreign key (project_id) references public.projects(id) on delete set null;
  end if;
end $$;

create index if not exists activities_user_id_idx on public.activities(user_id);
create index if not exists activities_date_idx on public.activities(date);
create index if not exists activities_project_id_idx on public.activities(project_id);
create index if not exists users_team_id_idx on public.users(team_id);
create index if not exists projects_team_id_idx on public.projects(team_id);

alter table public.users enable row level security;
alter table public.activities enable row level security;
alter table public.teams enable row level security;
alter table public.projects enable row level security;

-- Optional permissive policies for authenticated users.
-- Adjust these rules later for stricter access control.
drop policy if exists users_all_authenticated on public.users;
create policy users_all_authenticated
  on public.users
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists activities_all_authenticated on public.activities;
create policy activities_all_authenticated
  on public.activities
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists teams_all_authenticated on public.teams;
create policy teams_all_authenticated
  on public.teams
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists projects_all_authenticated on public.projects;
create policy projects_all_authenticated
  on public.projects
  for all
  to authenticated
  using (true)
  with check (true);

-- Bootstrap do perfil admin (requer que o utilizador exista em auth.users)
insert into public.users (
  id,
  name,
  email,
  role,
  active,
  created_at,
  updated_at
)
select
  au.id,
  coalesce(
    nullif(trim(au.raw_user_meta_data ->> 'name'), ''),
    'Administrador'
  ) as name,
  au.email,
  'admin' as role,
  true as active,
  now() as created_at,
  now() as updated_at
from auth.users au
where lower(au.email) = lower('admin@estagio.pt')
on conflict (id)
do update set
  role = 'admin',
  active = true,
  updated_at = now();

commit;
