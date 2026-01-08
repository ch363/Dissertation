-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.answers (
  id integer NOT NULL DEFAULT nextval('answers_id_seq'::regclass),
  question_id integer,
  answer_text text NOT NULL,
  is_correct boolean NOT NULL,
  CONSTRAINT answers_pkey PRIMARY KEY (id),
  CONSTRAINT answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.cloze_templates (
  id bigint NOT NULL DEFAULT nextval('cloze_templates_id_seq'::regclass),
  sentence_id bigint NOT NULL,
  blank_token_indices ARRAY NOT NULL,
  distractors ARRAY DEFAULT '{}'::text[],
  prompt text,
  explanation text,
  level integer DEFAULT 1,
  enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cloze_templates_pkey PRIMARY KEY (id),
  CONSTRAINT cloze_templates_sentence_id_fkey FOREIGN KEY (sentence_id) REFERENCES public.sentences(id)
);
CREATE TABLE public.content_admins (
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT content_admins_pkey PRIMARY KEY (user_id),
  CONSTRAINT content_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.languages (
  code text NOT NULL,
  name text NOT NULL,
  CONSTRAINT languages_pkey PRIMARY KEY (code)
);
CREATE TABLE public.lesson_attempts (
  id bigint NOT NULL DEFAULT nextval('lesson_attempts_id_seq'::regclass),
  user_id uuid NOT NULL,
  course_slug text NOT NULL,
  question_id text NOT NULL,
  choice text NOT NULL,
  correct boolean NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lesson_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.lessons (
  id integer NOT NULL DEFAULT nextval('lessons_id_seq'::regclass),
  name text NOT NULL,
  description text,
  cefr_level text,
  title text,
  display_order integer DEFAULT 0,
  CONSTRAINT lessons_pkey PRIMARY KEY (id)
);
CREATE TABLE public.media (
  id integer NOT NULL DEFAULT nextval('media_id_seq'::regclass),
  type text NOT NULL,
  url text NOT NULL,
  description text,
  CONSTRAINT media_pkey PRIMARY KEY (id)
);
CREATE TABLE public.onboarding_answers (
  user_id uuid NOT NULL,
  answers jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT onboarding_answers_pkey PRIMARY KEY (user_id),
  CONSTRAINT onboarding_answers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.questions (
  id integer NOT NULL DEFAULT nextval('questions_id_seq'::regclass),
  lesson_id integer,
  media_id integer,
  type text NOT NULL,
  question_text text,
  prompt text,
  media_url text,
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id),
  CONSTRAINT questions_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media(id)
);
CREATE TABLE public.sentence_tokens (
  id bigint NOT NULL DEFAULT nextval('sentence_tokens_id_seq'::regclass),
  sentence_id bigint NOT NULL,
  token_index integer NOT NULL,
  start_pos integer,
  end_pos integer,
  text text NOT NULL,
  lemma text,
  pos text,
  word_id bigint,
  CONSTRAINT sentence_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT sentence_tokens_sentence_id_fkey FOREIGN KEY (sentence_id) REFERENCES public.sentences(id),
  CONSTRAINT sentence_tokens_word_id_fkey FOREIGN KEY (word_id) REFERENCES public.words(id)
);
CREATE TABLE public.sentence_translations (
  id bigint NOT NULL DEFAULT nextval('sentence_translations_id_seq'::regclass),
  sentence_id bigint NOT NULL,
  target_language_code text NOT NULL,
  text text NOT NULL,
  literal_gloss text,
  is_machine boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sentence_translations_pkey PRIMARY KEY (id),
  CONSTRAINT sentence_translations_sentence_id_fkey FOREIGN KEY (sentence_id) REFERENCES public.sentences(id),
  CONSTRAINT sentence_translations_target_language_code_fkey FOREIGN KEY (target_language_code) REFERENCES public.languages(code)
);
CREATE TABLE public.sentences (
  id bigint NOT NULL DEFAULT nextval('sentences_id_seq'::regclass),
  language_code text NOT NULL,
  text text NOT NULL,
  source text,
  difficulty integer DEFAULT 1,
  audio_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sentences_pkey PRIMARY KEY (id),
  CONSTRAINT sentences_language_code_fkey FOREIGN KEY (language_code) REFERENCES public.languages(code)
);
CREATE TABLE public.user_progress (
  user_id integer NOT NULL,
  question_id integer NOT NULL,
  easiness numeric,
  interval integer,
  repetitions integer,
  last_review date,
  next_review date,
  CONSTRAINT user_progress_pkey PRIMARY KEY (user_id, question_id),
  CONSTRAINT user_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_progress_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.user_responses (
  id integer NOT NULL DEFAULT nextval('user_responses_id_seq'::regclass),
  user_id integer,
  question_id integer,
  accuracy boolean NOT NULL,
  time_to_respond integer,
  attempts integer,
  error_type text,
  answered_at timestamp with time zone,
  CONSTRAINT user_responses_pkey PRIMARY KEY (id),
  CONSTRAINT user_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_responses_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.users (
  id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  name text NOT NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.words (
  id bigint NOT NULL DEFAULT nextval('words_id_seq'::regclass),
  language_code text NOT NULL,
  text text NOT NULL,
  lemma text,
  pos text,
  ipa text,
  audio_url text,
  frequency integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT words_pkey PRIMARY KEY (id),
  CONSTRAINT words_language_code_fkey FOREIGN KEY (language_code) REFERENCES public.languages(code)
);