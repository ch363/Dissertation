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

-- =============================================
-- Teaching content scaffolding
-- =============================================

-- Content admins: allow selected users to write content via RLS
create table if not exists public.content_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.content_admins enable row level security;

drop policy if exists "Admins can read content_admins" on public.content_admins;
create policy "Admins can read content_admins"
  on public.content_admins for select
  to authenticated
  using ( exists (select 1 from public.content_admins ca where ca.user_id = auth.uid()) );

drop policy if exists "Admins can upsert content_admins" on public.content_admins;
create policy "Admins can upsert content_admins"
  on public.content_admins for insert
  to authenticated
  with check ( exists (select 1 from public.content_admins ca where ca.user_id = auth.uid()) );

-- Languages catalog
create table if not exists public.languages (
  code text primary key, -- ISO 639-1 preferred (e.g., 'en', 'it')
  name text not null
);

alter table public.languages enable row level security;

drop policy if exists "Authenticated can read languages" on public.languages;
create policy "Authenticated can read languages" on public.languages for select to authenticated using (true);

drop policy if exists "Admins can write languages" on public.languages;
create policy "Admins can write languages" on public.languages for all to authenticated using (
  exists (select 1 from public.content_admins ca where ca.user_id = auth.uid())
) with check (
  exists (select 1 from public.content_admins ca where ca.user_id = auth.uid())
);

-- Words/lemmas dictionary
create table if not exists public.words (
  id bigserial primary key,
  language_code text not null references public.languages(code) on delete restrict,
  text text not null,
  lemma text,
  pos text, -- e.g., NOUN, VERB, ADJ
  ipa text,
  audio_url text,
  frequency int,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(language_code, text)
);

drop trigger if exists words_set_updated_at on public.words;
create trigger words_set_updated_at before update on public.words for each row execute function public.set_updated_at();

alter table public.words enable row level security;

drop policy if exists "Authenticated can read words" on public.words;
create policy "Authenticated can read words" on public.words for select to authenticated using (true);

drop policy if exists "Admins can write words" on public.words;
create policy "Admins can write words" on public.words for all to authenticated using (
  exists (select 1 from public.content_admins ca where ca.user_id = auth.uid())
) with check (
  exists (select 1 from public.content_admins ca where ca.user_id = auth.uid())
);

-- Sentences repository
create table if not exists public.sentences (
  id bigserial primary key,
  language_code text not null references public.languages(code) on delete restrict,
  text text not null,
  source text, -- e.g., 'corpus', 'manual'
  difficulty int default 1,
  audio_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists sentences_set_updated_at on public.sentences;
create trigger sentences_set_updated_at before update on public.sentences for each row execute function public.set_updated_at();

alter table public.sentences enable row level security;

drop policy if exists "Authenticated can read sentences" on public.sentences;
create policy "Authenticated can read sentences" on public.sentences for select to authenticated using (true);

drop policy if exists "Admins can write sentences" on public.sentences;
create policy "Admins can write sentences" on public.sentences for all to authenticated using (
  exists (select 1 from public.content_admins ca where ca.user_id = auth.uid())
) with check (
  exists (select 1 from public.content_admins ca where ca.user_id = auth.uid())
);

-- Tokenization of sentences for cloze or analysis
create table if not exists public.sentence_tokens (
  id bigserial primary key,
  sentence_id bigint not null references public.sentences(id) on delete cascade,
  token_index int not null, -- 0-based index
  start_pos int,
  end_pos int,
  text text not null,
  lemma text,
  pos text,
  word_id bigint references public.words(id) on delete set null,
  unique(sentence_id, token_index)
);

alter table public.sentence_tokens enable row level security;

drop policy if exists "Authenticated can read sentence_tokens" on public.sentence_tokens;
create policy "Authenticated can read sentence_tokens" on public.sentence_tokens for select to authenticated using (true);

drop policy if exists "Admins can write sentence_tokens" on public.sentence_tokens;
create policy "Admins can write sentence_tokens" on public.sentence_tokens for all to authenticated using (
  exists (select 1 from public.content_admins ca where ca.user_id = auth.uid())
) with check (
  exists (select 1 from public.content_admins ca where ca.user_id = auth.uid())
);

-- Translations of sentences to target languages
create table if not exists public.sentence_translations (
  id bigserial primary key,
  sentence_id bigint not null references public.sentences(id) on delete cascade,
  target_language_code text not null references public.languages(code) on delete restrict,
  text text not null,
  literal_gloss text,
  is_machine boolean default false,
  created_at timestamptz default now(),
  unique(sentence_id, target_language_code)
);

alter table public.sentence_translations enable row level security;

drop policy if exists "Authenticated can read sentence_translations" on public.sentence_translations;
create policy "Authenticated can read sentence_translations" on public.sentence_translations for select to authenticated using (true);

drop policy if exists "Admins can write sentence_translations" on public.sentence_translations;
create policy "Admins can write sentence_translations" on public.sentence_translations for all to authenticated using (
  exists (select 1 from public.content_admins ca where ca.user_id = auth.uid())
) with check (
  exists (select 1 from public.content_admins ca where ca.user_id = auth.uid())
);

-- Cloze templates derived from sentences
create table if not exists public.cloze_templates (
  id bigserial primary key,
  sentence_id bigint not null references public.sentences(id) on delete cascade,
  blank_token_indices int[] not null, -- which tokens are blanked
  distractors text[] default '{}', -- optional distractor words
  prompt text,
  explanation text,
  level int default 1,
  enabled boolean default true,
  created_at timestamptz default now()
);

alter table public.cloze_templates enable row level security;

drop policy if exists "Authenticated can read cloze_templates" on public.cloze_templates;
create policy "Authenticated can read cloze_templates" on public.cloze_templates for select to authenticated using (true);

drop policy if exists "Admins can write cloze_templates" on public.cloze_templates;
create policy "Admins can write cloze_templates" on public.cloze_templates for all to authenticated using (
  exists (select 1 from public.content_admins ca where ca.user_id = auth.uid())
) with check (
  exists (select 1 from public.content_admins ca where ca.user_id = auth.uid())
);

-- Useful indexes
create index if not exists idx_words_lang_text on public.words(language_code, text);
create index if not exists idx_sentences_lang_diff on public.sentences(language_code, difficulty);
create index if not exists idx_sentence_translations_sentence_lang on public.sentence_translations(sentence_id, target_language_code);
create index if not exists idx_sentence_tokens_sentence_idx on public.sentence_tokens(sentence_id, token_index);
create index if not exists idx_cloze_templates_sentence on public.cloze_templates(sentence_id);

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
