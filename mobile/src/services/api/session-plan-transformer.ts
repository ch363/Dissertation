import { CardKind, Card, SessionPlan } from '@/types/session';
import { DELIVERY_METHOD, getCardKindForDeliveryMethod } from '@/features/session/delivery-methods';

/**
 * Backend session plan DTO (what the API returns)
 */
interface BackendSessionPlan {
  id: string;
  kind: 'learn' | 'review' | 'mixed';
  lessonId?: string;
  title?: string;
  steps: BackendSessionStep[];
  metadata?: any;
  createdAt?: string;
}

interface BackendSessionStep {
  stepNumber: number;
  type: 'teach' | 'practice' | 'recap';
  item: BackendStepItem;
  estimatedTimeSec?: number;
  deliveryMethod?: string;
}

type BackendStepItem = BackendTeachItem | BackendPracticeItem | BackendRecapItem;

interface BackendTeachItem {
  type: 'teach';
  teachingId: string;
  lessonId: string;
  phrase: string;
  translation: string;
  audioUrl?: string;
  emoji?: string;
  tip?: string;
  knowledgeLevel?: string;
}

interface BackendPracticeItem {
  type: 'practice';
  questionId: string;
  teachingId: string;
  lessonId: string;
  prompt?: string;
  deliveryMethod: string;
  options?: Array<{ id: string; label: string }>;
  correctOptionId?: string;
  text?: string;
  answer?: string;
  hint?: string;
  audioUrl?: string;
  source?: string;
  sourceText?: string; // For translation MCQ
  explanation?: string;
}

interface BackendRecapItem {
  type: 'recap';
  summary?: any;
}

/**
 * Transform backend session plan to frontend format
 */
export function transformSessionPlan(
  backendPlan: BackendSessionPlan,
  sessionId: string,
): SessionPlan {
  const cards: Card[] = [];

  console.log('Transforming session plan:', {
    stepsCount: backendPlan.steps?.length || 0,
    steps: backendPlan.steps?.map(s => ({ type: s.type, hasItem: !!s.item })) || [],
  });

  for (const step of backendPlan.steps || []) {
    if (step.type === 'teach') {
      const item = step.item as BackendTeachItem;
      cards.push({
        id: `teach-${item.teachingId}`,
        kind: CardKind.Teach,
        prompt: 'New phrase',
        content: {
          phrase: item.phrase,
          translation: item.translation,
          mediaUrl: item.audioUrl,
          usageNote: item.tip,
          emoji: item.emoji,
        },
      });
    } else if (step.type === 'practice') {
      const item = step.item as BackendPracticeItem;
      const deliveryMethod = item.deliveryMethod;

      console.log('Processing practice step:', {
        questionId: item.questionId,
        deliveryMethod,
        hasOptions: !!item.options,
        optionsLength: item.options?.length,
        hasText: !!item.text,
        hasSource: !!item.source,
        hasAudioUrl: !!item.audioUrl,
        hasAnswer: !!item.answer,
        hasCorrectOptionId: !!item.correctOptionId,
      });

      // Transform based on delivery method using centralized mapping
      const deliveryMethodTyped = deliveryMethod as typeof DELIVERY_METHOD[keyof typeof DELIVERY_METHOD];
      
      if (deliveryMethodTyped === DELIVERY_METHOD.MULTIPLE_CHOICE) {
        if (item.options && item.options.length > 0 && item.correctOptionId) {
          cards.push({
            id: `question-${item.questionId}`,
            kind: CardKind.MultipleChoice,
            prompt: item.prompt || 'Select the correct answer',
            options: item.options,
            correctOptionId: item.correctOptionId,
            explanation: item.explanation,
            audioUrl: item.audioUrl,
            sourceText: item.sourceText || item.source, // For translation MCQ (prefer sourceText, fallback to source)
          });
        } else {
          console.error('MULTIPLE_CHOICE question missing required data - creating fallback card:', {
            questionId: item.questionId,
            hasOptions: !!item.options,
            optionsLength: item.options?.length,
            hasCorrectOptionId: !!item.correctOptionId,
            item: JSON.stringify(item, null, 2),
          });
          // Create a fallback card with minimal options to prevent the question from disappearing
          // This should not happen if backend is working correctly, but prevents UI breakage
          cards.push({
            id: `question-${item.questionId}`,
            kind: CardKind.MultipleChoice,
            prompt: item.prompt || 'Select the correct answer',
            options: [
              { id: 'opt1', label: 'Option 1' },
              { id: 'opt2', label: 'Option 2' },
              { id: 'opt3', label: 'Option 3' },
              { id: 'opt4', label: 'Option 4' },
            ],
            correctOptionId: 'opt1',
            sourceText: item.sourceText || item.source,
          });
        }
      } else if (deliveryMethodTyped === DELIVERY_METHOD.FILL_BLANK) {
        if (item.text && item.answer) {
          cards.push({
            id: `question-${item.questionId}`,
            kind: CardKind.FillBlank,
            prompt: item.prompt || 'Fill in the blank',
            text: item.text,
            answer: item.answer,
            hint: item.hint,
            audioUrl: item.audioUrl,
            // Options for tap-to-fill (if provided by backend)
            options: item.options?.map(opt => ({
              id: opt.id || `opt-${opt.label}`,
              label: opt.label,
            })),
          });
        } else {
          console.warn('FILL_BLANK question missing text or answer:', {
            questionId: item.questionId,
            hasText: !!item.text,
            hasAnswer: !!item.answer,
          });
        }
      } else if (deliveryMethodTyped === DELIVERY_METHOD.TEXT_TRANSLATION) {
        if (item.source && item.answer) {
          // Determine translation direction based on source language
          const isItalianToEnglish = /^[A-Za-zàèéìíîòóùú]/.test(item.source);
          const cardKind = getCardKindForDeliveryMethod(
            DELIVERY_METHOD.TEXT_TRANSLATION,
            isItalianToEnglish,
          );
          cards.push({
            id: `question-${item.questionId}`,
            kind: cardKind,
            prompt: item.prompt || 'Translate',
            source: item.source,
            targetLanguage: isItalianToEnglish ? 'en' : 'it',
            expected: item.answer,
            hint: item.hint,
            audioUrl: item.audioUrl,
            isFlashcard: false,
          });
        } else {
          console.warn('TEXT_TRANSLATION question missing source or answer:', {
            questionId: item.questionId,
            hasSource: !!item.source,
            hasAnswer: !!item.answer,
          });
        }
      } else if (
        deliveryMethodTyped === DELIVERY_METHOD.SPEECH_TO_TEXT ||
        deliveryMethodTyped === DELIVERY_METHOD.TEXT_TO_SPEECH
      ) {
        if (item.audioUrl && item.answer) {
          cards.push({
            id: `question-${item.questionId}`,
            kind: CardKind.Listening,
            prompt: item.prompt || 'Listen and type what you hear',
            audioUrl: item.audioUrl,
            expected: item.answer,
            mode: deliveryMethodTyped === DELIVERY_METHOD.TEXT_TO_SPEECH ? 'speak' : 'type',
          });
        } else {
          console.warn('SPEECH_TO_TEXT/TEXT_TO_SPEECH question missing audioUrl or answer:', {
            questionId: item.questionId,
            hasAudioUrl: !!item.audioUrl,
            hasAnswer: !!item.answer,
          });
        }
      } else if (deliveryMethodTyped === DELIVERY_METHOD.FLASHCARD) {
        // Flashcard uses translation format
        if (item.source && item.answer) {
          cards.push({
            id: `question-${item.questionId}`,
            kind: CardKind.TranslateToEn,
            prompt: item.prompt || 'What does this mean?',
            source: item.source,
            targetLanguage: 'en',
            expected: item.answer,
            hint: item.hint,
            audioUrl: item.audioUrl,
            isFlashcard: true, // Enable flip card interaction
          });
        } else {
          console.warn('FLASHCARD question missing source or answer:', {
            questionId: item.questionId,
            hasSource: !!item.source,
            hasAnswer: !!item.answer,
          });
        }
      } else {
        console.warn('Unknown delivery method:', deliveryMethod, { questionId: item.questionId });
      }
      // Skip recap steps - frontend handles completion separately
    }
  }

  console.log('Transformation complete. Cards created:', cards.length, {
    cardTypes: cards.map(c => c.kind),
  });

  return {
    id: sessionId,
    kind: backendPlan.kind === 'review' ? 'review' : 'learn',
    lessonId: backendPlan.lessonId,
    title: backendPlan.title || 'Learning Session',
    cards,
  };
}
