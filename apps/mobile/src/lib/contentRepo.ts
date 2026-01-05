import { getSupabaseClient } from './supabase';

export type SentenceRow = {
  id: number;
  language_code: string;
  text: string;
  source: string | null;
  difficulty: number | null;
  audio_url: string | null;
};

export type SentenceTranslationRow = {
  id: number;
  sentence_id: number;
  target_language_code: string;
  text: string;
  literal_gloss: string | null;
};

export type ClozeTemplateRow = {
  id: number;
  sentence_id: number;
  blank_token_indices: number[];
  distractors: string[] | null;
  prompt: string | null;
  explanation: string | null;
  level: number | null;
  enabled: boolean;
};

export async function fetchSentences(
  languageCode: string,
  opts?: { limit?: number; difficulty?: number }
) {
  const supabase = getSupabaseClient();
  const q = supabase
    .from('sentences')
    .select('*')
    .eq('language_code', languageCode)
    .order('id', { ascending: true });
  if (opts?.difficulty != null) q.eq('difficulty', opts.difficulty);
  if (opts?.limit != null) q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return data as SentenceRow[];
}

export async function fetchSentenceWithTranslation(
  languageCode: string,
  targetLanguageCode: string,
  opts?: { limit?: number; difficulty?: number }
) {
  const supabase = getSupabaseClient();
  const q = supabase
    .from('sentences')
    .select('*, sentence_translations!inner(text, target_language_code)')
    .eq('language_code', languageCode)
    .eq('sentence_translations.target_language_code', targetLanguageCode)
    .order('id', { ascending: true });
  if (opts?.difficulty != null) q.eq('difficulty', opts.difficulty);
  if (opts?.limit != null) q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return data as (SentenceRow & {
    sentence_translations: Pick<SentenceTranslationRow, 'text' | 'target_language_code'>[];
  })[];
}

export async function fetchClozeTemplates(
  languageCode: string,
  targetLanguageCode?: string,
  opts?: { limit?: number; level?: number }
) {
  const supabase = getSupabaseClient();
  const q = supabase
    .from('cloze_templates')
    .select(
      `
      *,
      sentences:sentence_id(id, language_code, text),
      sentence_translations:sentence_id(id, target_language_code, text)
    `
    )
    .eq('sentences.language_code', languageCode)
    .eq('enabled', true)
    .order('id', { ascending: true });
  if (opts?.level != null) q.eq('level', opts.level);
  if (opts?.limit != null) q.limit(opts.limit);
  if (targetLanguageCode) q.eq('sentence_translations.target_language_code', targetLanguageCode);
  const { data, error } = await q;
  if (error) throw error;
  return data as (ClozeTemplateRow & {
    sentences: Pick<SentenceRow, 'id' | 'language_code' | 'text'>;
    sentence_translations: Pick<SentenceTranslationRow, 'id' | 'target_language_code' | 'text'>[];
  })[];
}
