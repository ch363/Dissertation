import { z } from 'zod';

// Enums matching Prisma schema
export const KnowledgeLevelSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

export const DeliveryMethodSchema = z.enum([
  'FILL_BLANK',
  'FLASHCARD',
  'MULTIPLE_CHOICE',
  'SPEECH_TO_TEXT',
  'TEXT_TO_SPEECH',
  'TEXT_TRANSLATION',
]);

// Multiple choice option schema
const MultipleChoiceOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  isCorrect: z.boolean(),
});

// Multiple choice question schema
const MultipleChoiceQuestionSchema = z.object({
  prompt: z.string().optional(),
  options: z.array(MultipleChoiceOptionSchema).min(2),
  explanation: z.string().optional(),
});

// Translation question schema
const TranslationQuestionSchema = z.object({
  prompt: z.string().optional(),
  source: z.string().min(1),
  answer: z.string().min(1),
  hint: z.string().optional(),
});

// Fill blank question schema
const FillBlankQuestionSchema = z.object({
  prompt: z.string().optional(),
  text: z.string().min(1),
  answer: z.string().min(1),
  hint: z.string().optional(),
});

// Listening question schema
const ListeningQuestionSchema = z.object({
  prompt: z.string().optional(),
  answer: z.string().min(1),
});

// Question schema - supports different question types
const QuestionSchema = z.object({
  slug: z.string().min(1),
  teachingSlug: z.string().min(1),
  deliveryMethods: z.array(DeliveryMethodSchema).min(1),
  multipleChoice: MultipleChoiceQuestionSchema.optional(),
  translation: TranslationQuestionSchema.optional(),
  fillBlank: FillBlankQuestionSchema.optional(),
  listening: ListeningQuestionSchema.optional(),
}).refine(
  (data) => {
    // Validate that question type matches delivery methods
    const hasMultipleChoice = data.multipleChoice !== undefined;
    const hasTranslation = data.translation !== undefined;
    const hasFillBlank = data.fillBlank !== undefined;
    const hasListening = data.listening !== undefined;

    // Check if delivery methods match question types
    const hasMultipleChoiceMethod = data.deliveryMethods.includes('MULTIPLE_CHOICE');
    const hasTranslationMethod = 
      data.deliveryMethods.includes('TEXT_TRANSLATION') ||
      data.deliveryMethods.includes('FLASHCARD'); // FLASHCARD uses translation structure
    const hasFillBlankMethod = data.deliveryMethods.includes('FILL_BLANK');
    const hasListeningMethod =
      data.deliveryMethods.includes('SPEECH_TO_TEXT') ||
      data.deliveryMethods.includes('TEXT_TO_SPEECH');

    // At least one question type must be provided
    if (!hasMultipleChoice && !hasTranslation && !hasFillBlank && !hasListening) {
      return false;
    }

    // If multiple choice is provided, MULTIPLE_CHOICE method must be present
    if (hasMultipleChoice && !hasMultipleChoiceMethod) {
      return false;
    }

    // If translation is provided, TEXT_TRANSLATION method must be present
    if (hasTranslation && !hasTranslationMethod) {
      return false;
    }

    // If fill blank is provided, FILL_BLANK method must be present
    if (hasFillBlank && !hasFillBlankMethod) {
      return false;
    }

    // If listening is provided, SPEECH_TO_TEXT or TEXT_TO_SPEECH must be present
    if (hasListening && !hasListeningMethod) {
      return false;
    }

    return true;
  },
  {
    message:
      'Question type (multipleChoice, translation, fillBlank, listening) must match delivery methods',
  },
);

// Teaching schema
const TeachingSchema = z.object({
  slug: z.string().min(1),
  knowledgeLevel: KnowledgeLevelSchema,
  emoji: z.string().optional(),
  userLanguageString: z.string().min(1),
  learningLanguageString: z.string().min(1),
  tip: z.string().optional(),
});

// Lesson schema
export const LessonContentSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  teachings: z.array(TeachingSchema).min(1),
  questions: z.array(QuestionSchema).min(1),
});

// Module schema
export const ModuleContentSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

// Export types
export type KnowledgeLevel = z.infer<typeof KnowledgeLevelSchema>;
export type DeliveryMethod = z.infer<typeof DeliveryMethodSchema>;
export type ModuleContent = z.infer<typeof ModuleContentSchema>;
export type LessonContent = z.infer<typeof LessonContentSchema>;
export type TeachingContent = z.infer<typeof TeachingSchema>;
export type QuestionContent = z.infer<typeof QuestionSchema>;
