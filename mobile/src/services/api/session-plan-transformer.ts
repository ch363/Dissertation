import { DELIVERY_METHOD, getCardKindForDeliveryMethod } from '@/features/session/delivery-methods';
import { createLogger } from '@/services/logging';
import { CardKind, Card, SessionPlan } from '@/types/session';

const logger = createLogger('SessionPlanTransformer');

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
  options?: { id: string; label: string }[];
  correctOptionId?: string;
  text?: string;
  answer?: string;
  hint?: string;
  audioUrl?: string;
  source?: string;
  sourceText?: string; // For translation MCQ
  translation?: string; // For TEXT_TO_SPEECH
  explanation?: string;
  emoji?: string; // For FLASHCARD – match teach card
  tip?: string; // For FLASHCARD – usage note
}

interface BackendRecapItem {
  type: 'recap';
  summary?: any;
}

export function transformSessionPlan(
  backendPlan: BackendSessionPlan,
  sessionId: string,
): SessionPlan {
  const cards: Card[] = [];
  /** Avoid showing the same question twice in one session (e.g. review loop bug). */
  const seenQuestionIds = new Set<string>();

  logger.info('Transforming session plan', {
    stepsCount: backendPlan.steps?.length || 0,
    steps: backendPlan.steps?.map((s) => ({ type: s.type, hasItem: !!s.item })) || [],
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
      if (seenQuestionIds.has(item.questionId)) {
        logger.info('Skipping duplicate practice step for question', {
          questionId: item.questionId,
        });
        continue;
      }
      seenQuestionIds.add(item.questionId);
      const deliveryMethod = item.deliveryMethod;

      logger.info('Processing practice step', {
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

      const deliveryMethodTyped =
        deliveryMethod as (typeof DELIVERY_METHOD)[keyof typeof DELIVERY_METHOD];

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
          logger.error('MULTIPLE_CHOICE question missing required data - creating fallback card', {
            questionId: item.questionId,
            hasOptions: !!item.options,
            optionsLength: item.options?.length,
            hasCorrectOptionId: !!item.correctOptionId,
            item: JSON.stringify(item, null, 2),
          });
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
            options: item.options?.map((opt) => ({
              id: opt.id || `opt-${opt.label}`,
              label: opt.label,
            })),
          });
        } else {
          logger.warn('FILL_BLANK question missing text or answer', {
            questionId: item.questionId,
            hasText: !!item.text,
            hasAnswer: !!item.answer,
          });
        }
      } else if (deliveryMethodTyped === DELIVERY_METHOD.TEXT_TRANSLATION) {
        if (item.source && item.answer) {
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
          logger.warn('TEXT_TRANSLATION question missing source or answer', {
            questionId: item.questionId,
            hasSource: !!item.source,
            hasAnswer: !!item.answer,
          });
        }
      } else if (
        deliveryMethodTyped === DELIVERY_METHOD.SPEECH_TO_TEXT ||
        deliveryMethodTyped === DELIVERY_METHOD.TEXT_TO_SPEECH
      ) {
        if (item.answer) {
          cards.push({
            id: `question-${item.questionId}`,
            kind: CardKind.Listening,
            prompt: item.prompt || 'Listen and type what you hear',
            audioUrl: item.audioUrl,
            expected: item.answer,
            translation: item.translation,
            mode: deliveryMethodTyped === DELIVERY_METHOD.TEXT_TO_SPEECH ? 'speak' : 'type',
          });
        } else {
          logger.warn('SPEECH_TO_TEXT/TEXT_TO_SPEECH question missing answer', {
            questionId: item.questionId,
            hasAnswer: !!item.answer,
          });
        }
      } else if (deliveryMethodTyped === DELIVERY_METHOD.FLASHCARD) {
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
            isFlashcard: true,
            emoji: item.emoji,
            usageNote: item.tip,
          });
        } else {
          logger.warn('FLASHCARD question missing source or answer', {
            questionId: item.questionId,
            hasSource: !!item.source,
            hasAnswer: !!item.answer,
          });
        }
      } else {
        logger.warn('Unknown delivery method', { deliveryMethod, questionId: item.questionId });
      }
    }
  }

  logger.info('Transformation complete. Cards created', {
    cardCount: cards.length,
    cardTypes: cards.map((c) => c.kind),
  });

  return {
    id: sessionId,
    kind: backendPlan.kind === 'review' ? 'review' : 'learn',
    lessonId: backendPlan.lessonId,
    title: backendPlan.title || 'Learning Session',
    cards,
  };
}
