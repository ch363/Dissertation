-- Profiles table to store user info (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by logged in users" on public.profiles;
create policy "Public profiles are viewable by logged in users"
  on public.profiles for select
  to authenticated
  using ( true );

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check ( auth.uid() = id );

Drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ( auth.uid() = id );

-- Track lesson attempts per user
create table if not exists public.lesson_attempts (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_slug text not null,
  question_id text not null,
  choice text not null,
  correct boolean not null,
  created_at timestamp with time zone default now()
);

alter table public.lesson_attempts enable row level security;

drop policy if exists "Users can view their own attempts" on public.lesson_attempts;
create policy "Users can view their own attempts"
  on public.lesson_attempts for select
  to authenticated
  using ( auth.uid() = user_id );

drop policy if exists "Users can insert their own attempts" on public.lesson_attempts;
create policy "Users can insert their own attempts"
  on public.lesson_attempts for insert
  to authenticated
  with check ( auth.uid() = user_id );

-- Onboarding answers storage
create table if not exists public.onboarding_answers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  answers jsonb not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.onboarding_answers enable row level security;

drop policy if exists "Users can view their own onboarding" on public.onboarding_answers;
create policy "Users can view their own onboarding"
  on public.onboarding_answers for select
  to authenticated
  using ( auth.uid() = user_id );

drop policy if exists "Users can upsert their own onboarding" on public.onboarding_answers;
create policy "Users can upsert their own onboarding"
  on public.onboarding_answers for insert
  to authenticated
  with check ( auth.uid() = user_id );

drop policy if exists "Users can update their own onboarding" on public.onboarding_answers;
create policy "Users can update their own onboarding"
  on public.onboarding_answers for update
  to authenticated
  using ( auth.uid() = user_id );
