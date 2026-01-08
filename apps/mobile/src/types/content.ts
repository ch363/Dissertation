import { z } from 'zod';

export const sentenceSchema = z.object({
  id: z.number(),
  language_code: z.string(),
  text: z.string(),
  source: z.string().nullable(),
  difficulty: z.number().nullable(),
  audio_url: z.string().nullable(),
});

export const sentenceTranslationSchema = z.object({
  id: z.number(),
  sentence_id: z.number(),
  target_language_code: z.string(),
  text: z.string(),
  literal_gloss: z.string().nullable(),
});

export const clozeTemplateSchema = z.object({
  id: z.number(),
  sentence_id: z.number(),
  blank_token_indices: z.array(z.number()),
  distractors: z.array(z.string()).nullable(),
  prompt: z.string().nullable(),
  explanation: z.string().nullable(),
  level: z.number().nullable(),
  enabled: z.boolean(),
});

export const sentenceWithTranslationSchema = sentenceSchema.extend({
  sentence_translations: z.array(
    sentenceTranslationSchema.pick({ text: true, target_language_code: true }),
  ),
});

export const clozeTemplateExpandedSchema = clozeTemplateSchema.extend({
  sentences: sentenceSchema.pick({ id: true, language_code: true, text: true }),
  sentence_translations: z.array(
    sentenceTranslationSchema.pick({ id: true, target_language_code: true, text: true }),
  ),
});

export type SentenceDto = z.infer<typeof sentenceSchema>;
export type SentenceTranslationDto = z.infer<typeof sentenceTranslationSchema>;
export type ClozeTemplateDto = z.infer<typeof clozeTemplateSchema>;
export type SentenceWithTranslationDto = z.infer<typeof sentenceWithTranslationSchema>;
export type ClozeTemplateExpandedDto = z.infer<typeof clozeTemplateExpandedSchema>;
