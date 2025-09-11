-- Seed initial languages
insert into public.languages (code, name) values
  ('it', 'Italian'),
  ('en', 'English')
on conflict (code) do nothing;

-- Seed words (Italian)
insert into public.words (language_code, text, lemma, pos)
values
  ('it', 'Io', 'io', 'PRON'),
  ('it', 'Tu', 'tu', 'PRON'),
  ('it', 'sono', 'essere', 'VERB'),
  ('it', 'sei', 'essere', 'VERB'),
  ('it', 'uno', 'uno', 'DET'),
  ('it', 'una', 'una', 'DET'),
  ('it', 'studente', 'studente', 'NOUN'),
  ('it', 'insegnante', 'insegnante', 'NOUN')
on conflict (language_code, text) do nothing;

-- Seed sentences (Italian)
insert into public.sentences (language_code, text, source, difficulty)
values
  ('it', 'Io sono uno studente.', 'manual', 1),
  ('it', 'Tu sei un insegnante.', 'manual', 1)
on conflict do nothing;

-- Map sentence IDs for subsequent inserts
with s as (
  select id, text from public.sentences where language_code = 'it' and text in ('Io sono uno studente.', 'Tu sei un insegnante.')
)
-- Tokenize sentence 1: "Io sono uno studente."
insert into public.sentence_tokens (sentence_id, token_index, start_pos, end_pos, text, lemma, pos)
select s1.id, t.idx, t.start_pos, t.end_pos, t.text, t.lemma, t.pos
from (select id from s where text = 'Io sono uno studente.') s1
cross join lateral (
  values
    (0, 0, 2, 'Io', 'io', 'PRON'),
    (1, 3, 7, 'sono', 'essere', 'VERB'),
    (2, 8, 11, 'uno', 'uno', 'DET'),
    (3, 12, 20, 'studente', 'studente', 'NOUN')
) as t(idx, start_pos, end_pos, text, lemma, pos)
on conflict do nothing;

with s as (
  select id, text from public.sentences where language_code = 'it' and text in ('Io sono uno studente.', 'Tu sei un insegnante.')
)
-- Tokenize sentence 2: "Tu sei un insegnante."
insert into public.sentence_tokens (sentence_id, token_index, start_pos, end_pos, text, lemma, pos)
select s2.id, t.idx, t.start_pos, t.end_pos, t.text, t.lemma, t.pos
from (select id from s where text = 'Tu sei un insegnante.') s2
cross join lateral (
  values
    (0, 0, 2, 'Tu', 'tu', 'PRON'),
    (1, 3, 6, 'sei', 'essere', 'VERB'),
    (2, 7, 9, 'un', 'un', 'DET'),
    (3, 10, 21, 'insegnante', 'insegnante', 'NOUN')
) as t(idx, start_pos, end_pos, text, lemma, pos)
on conflict do nothing;

-- Translations to English
insert into public.sentence_translations (sentence_id, target_language_code, text, literal_gloss, is_machine)
select id, 'en',
  case text
    when 'Io sono uno studente.' then 'I am a student.'
    when 'Tu sei un insegnante.' then 'You are a teacher.'
  end,
  null,
  false
from public.sentences
where language_code = 'it' and text in ('Io sono uno studente.', 'Tu sei un insegnante.')
on conflict do nothing;

-- Cloze templates (blank the verb)
insert into public.cloze_templates (sentence_id, blank_token_indices, distractors, prompt, explanation, level, enabled)
select s.id,
  case s.text
    when 'Io sono uno studente.' then array[1]
    when 'Tu sei un insegnante.' then array[1]
  end,
  case s.text
    when 'Io sono uno studente.' then array['sei','è','siamo']
    when 'Tu sei un insegnante.' then array['sono','è','siamo']
  end,
  'Fill in the blank',
  null,
  1,
  true
from public.sentences s
where s.language_code = 'it' and s.text in ('Io sono uno studente.', 'Tu sei un insegnante.')
on conflict do nothing;
