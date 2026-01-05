import {
  clozeTemplateExpandedSchema,
  sentenceSchema,
  sentenceWithTranslationSchema,
  type ClozeTemplateExpandedDto,
  type SentenceDto,
  type SentenceWithTranslationDto,
} from './schemas/content';
import { getSupabaseClient } from './supabase';

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
  return (data ?? []).map((row) => sentenceSchema.parse(row)) as SentenceDto[];
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
  return (data ?? []).map((row) =>
    sentenceWithTranslationSchema.parse(row)
  ) as SentenceWithTranslationDto[];
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
  return (data ?? []).map((row) =>
    clozeTemplateExpandedSchema.parse(row)
  ) as ClozeTemplateExpandedDto[];
}
