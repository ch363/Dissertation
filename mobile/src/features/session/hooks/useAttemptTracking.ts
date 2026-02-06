import { useState, useCallback, useRef } from 'react';
import * as Haptics from 'expo-haptics';

import { getDeliveryMethodForCardKind } from '../delivery-methods';

import {
  validateAnswer,
  validatePronunciation,
  recordQuestionAttempt,
  completeTeaching,
  updateDeliveryMethodScore,
} from '@/services/api/progress';
import { createLogger } from '@/services/logging';
import * as SpeechRecognition from '@/services/speech-recognition';
import { AttemptLog, Card, CardKind, PronunciationResult } from '@/types/session';

const logger = createLogger('useAttemptTracking');

export interface UseAttemptTrackingParams {
  sessionId: string;
  onInvalidateCache?: () => void;
}

export interface UseAttemptTrackingReturn {
  attempts: AttemptLog[];
  recordedAttempts: Set<string>;
  awardedXpByCard: Map<string, number>;
  cardStartTime: number | null;
  incorrectAttemptCount: number;
  isPronunciationProcessing: boolean;
  pronunciationResult: PronunciationResult | null;
  // Actions
  setCardStartTime: (time: number | null) => void;
  resetCardStartTime: () => void;
  recordAttemptForCard: (
    card: Card,
    attemptData: {
      answer: string;
      isCorrect: boolean;
      elapsedMs: number;
      awardedXp?: number;
    },
  ) => void;
  validateAndRecordAnswer: (
    card: Card,
    userAnswerValue: string,
    deliveryMethod: string,
  ) => Promise<{
    isCorrect: boolean;
    grammaticalCorrectness: number | null;
    meaningCorrect: boolean;
    naturalPhrasing?: string;
    feedbackWhy?: string;
    acceptedVariants: string[];
    validationFeedback?: string;
  }>;
  validateAndRecordPronunciation: (
    card: Card,
    audioUri: string,
  ) => Promise<{
    isCorrect: boolean;
    pronunciationResult: PronunciationResult | null;
    transcription: string;
  }>;
  recordTeachingComplete: (teachingId: string, elapsedMs: number) => Promise<void>;
  recordFlashcardRating: (
    card: Card,
    rating: number,
    elapsedMs: number,
  ) => Promise<number | undefined>;
  incrementIncorrectAttemptCount: () => void;
  resetIncorrectAttemptCount: () => void;
}

function isHapticsUsable(): boolean {
  return !!(Haptics.ImpactFeedbackStyle && typeof Haptics.impactAsync === 'function');
}

async function triggerHaptic(style: 'light' | 'medium') {
  if (!isHapticsUsable()) return;
  try {
    const feedbackStyle =
      style === 'light' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium;
    await Haptics.impactAsync(feedbackStyle);
  } catch (error) {
    logger.debug('Haptic feedback failed', { error });
  }
}

export function useAttemptTracking(params: UseAttemptTrackingParams): UseAttemptTrackingReturn {
  const { onInvalidateCache } = params;

  const [attempts, setAttempts] = useState<AttemptLog[]>([]);
  const [recordedAttempts, setRecordedAttempts] = useState<Set<string>>(new Set());
  const [awardedXpByCard, setAwardedXpByCard] = useState<Map<string, number>>(new Map());
  const [cardStartTime, setCardStartTime] = useState<number | null>(null);
  const [incorrectAttemptCount, setIncorrectAttemptCount] = useState(0);
  const [isPronunciationProcessing, setIsPronunciationProcessing] = useState(false);
  const [pronunciationResult, setPronunciationResult] = useState<PronunciationResult | null>(null);

  const isValidatingRef = useRef(false);

  const resetCardStartTime = useCallback(() => {
    setCardStartTime(Date.now());
  }, []);

  const incrementIncorrectAttemptCount = useCallback(() => {
    setIncorrectAttemptCount((prev) => prev + 1);
  }, []);

  const resetIncorrectAttemptCount = useCallback(() => {
    setIncorrectAttemptCount(0);
  }, []);

  const recordAttemptForCard = useCallback(
    (
      card: Card,
      attemptData: {
        answer: string;
        isCorrect: boolean;
        elapsedMs: number;
        awardedXp?: number;
      },
    ) => {
      const attemptNumber = attempts.filter((a) => a.cardId === card.id).length + 1;
      const newAttempt: AttemptLog = {
        cardId: card.id,
        attemptNumber,
        answer: attemptData.answer,
        isCorrect: attemptData.isCorrect,
        elapsedMs: attemptData.elapsedMs,
        awardedXp: attemptData.awardedXp,
      };
      setAttempts((prev) => [...prev, newAttempt]);
    },
    [attempts],
  );

  const validateAndRecordAnswer = useCallback(
    async (card: Card, userAnswerValue: string, deliveryMethod: string) => {
      if (isValidatingRef.current) {
        throw new Error('Validation already in progress');
      }

      if (!card.id.startsWith('question-')) {
        throw new Error('Card ID does not start with "question-"');
      }

      const questionId = card.id.replace('question-', '');
      isValidatingRef.current = true;

      try {
        // Validate answer via backend
        const validationResult = await validateAnswer(questionId, userAnswerValue, deliveryMethod);

        // For MultipleChoice, use correctOptionId for effective correctness
        const effectiveCorrect =
          card.kind === CardKind.MultipleChoice && 'correctOptionId' in card
            ? userAnswerValue === card.correctOptionId
            : validationResult.isCorrect;

        // Haptic feedback
        triggerHaptic(effectiveCorrect ? 'light' : 'medium');

        // Calculate time to complete
        const timeToComplete = cardStartTime ? Date.now() - cardStartTime : undefined;
        const attemptNumber = attempts.filter((a) => a.cardId === card.id).length + 1;

        // Record question attempt
        let awardedXp: number | undefined;
        if (!recordedAttempts.has(card.id)) {
          try {
            const percentageAccuracy =
              validationResult.grammaticalCorrectness ?? (validationResult.isCorrect ? 100 : 0);
            const attemptResponse = await recordQuestionAttempt(questionId, {
              deliveryMethod,
              score: validationResult.score,
              timeToComplete,
              percentageAccuracy,
              attempts: attemptNumber,
            } as any);
            awardedXp = attemptResponse.awardedXp;

            onInvalidateCache?.();

            // Update delivery method score
            const delta = validationResult.isCorrect ? 0.1 : -0.05;
            try {
              await updateDeliveryMethodScore(deliveryMethod, { delta });
            } catch (error) {
              logger.error('Error updating delivery method score', error as Error);
            }

            setRecordedAttempts((prev) => new Set(prev).add(card.id));

            if (awardedXp !== undefined) {
              setAwardedXpByCard((prev) => new Map(prev).set(card.id, awardedXp!));
            }
          } catch (error) {
            logger.error('Error recording question attempt', error as Error);
          }
        }

        // Create attempt log
        recordAttemptForCard(card, {
          answer: userAnswerValue,
          isCorrect: validationResult.isCorrect,
          elapsedMs: timeToComplete || 0,
          awardedXp,
        });

        return {
          isCorrect: effectiveCorrect,
          grammaticalCorrectness: validationResult.grammaticalCorrectness ?? null,
          meaningCorrect: validationResult.meaningCorrect ?? false,
          naturalPhrasing: validationResult.naturalPhrasing,
          feedbackWhy: validationResult.feedbackWhy,
          acceptedVariants: validationResult.acceptedVariants ?? [],
          validationFeedback: validationResult.feedback,
        };
      } finally {
        isValidatingRef.current = false;
      }
    },
    [
      cardStartTime,
      attempts,
      recordedAttempts,
      onInvalidateCache,
      recordAttemptForCard,
      setRecordedAttempts,
      setAwardedXpByCard,
    ],
  );

  const validateAndRecordPronunciation = useCallback(
    async (card: Card, audioUri: string) => {
      if (!card.id.startsWith('question-')) {
        throw new Error('Card ID does not start with "question-"');
      }

      const questionId = card.id.replace('question-', '');
      const deliveryMethod = getDeliveryMethodForCardKind(
        card.kind,
        'isFlashcard' in card ? card.isFlashcard : false,
      );

      setIsPronunciationProcessing(true);

      try {
        const PRONUNCIATION_CLIENT_TIMEOUT_MS = 30_000;
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error('Pronunciation validation timed out')),
            PRONUNCIATION_CLIENT_TIMEOUT_MS,
          );
        });

        logger.info('Processing pronunciation recording', { audioUri, questionId });

        const audioFile = await Promise.race([
          SpeechRecognition.getAudioFile(audioUri),
          timeoutPromise,
        ]);

        if (!audioFile?.base64) {
          throw new Error('Failed to get audio file for pronunciation validation');
        }

        const normalizedUri = audioUri.toLowerCase();
        const audioFormat = normalizedUri.endsWith('.m4a')
          ? 'm4a'
          : normalizedUri.endsWith('.flac')
            ? 'flac'
            : 'wav';

        logger.info('Audio file loaded', {
          format: audioFormat,
          base64Length: audioFile.base64.length,
        });

        const pronunciationResponse = await Promise.race([
          validatePronunciation(questionId, audioFile.base64, audioFormat),
          timeoutPromise,
        ]);

        logger.info('Pronunciation response received', {
          isCorrect: pronunciationResponse.isCorrect,
          overallScore: pronunciationResponse.overallScore,
        });

        setPronunciationResult(pronunciationResponse);

        // Haptic feedback
        triggerHaptic(pronunciationResponse.isCorrect ? 'light' : 'medium');

        // Record attempt
        const timeToComplete = cardStartTime ? Date.now() - cardStartTime : undefined;
        const attemptNumber = attempts.filter((a) => a.cardId === card.id).length + 1;

        let awardedXp: number | undefined;
        if (!recordedAttempts.has(card.id)) {
          try {
            const attemptResponse = await recordQuestionAttempt(questionId, {
              deliveryMethod,
              score: pronunciationResponse.score,
              timeToComplete,
              percentageAccuracy: pronunciationResponse.overallScore,
              attempts: attemptNumber,
            } as any);
            awardedXp = attemptResponse.awardedXp;

            onInvalidateCache?.();

            const delta = pronunciationResponse.isCorrect ? 0.1 : -0.05;
            try {
              await updateDeliveryMethodScore(deliveryMethod, { delta });
            } catch (error) {
              logger.error('Error updating delivery method score', error as Error);
            }

            setRecordedAttempts((prev) => new Set(prev).add(card.id));
          } catch (error) {
            logger.error('Error recording question attempt', error as Error);
          }
        }

        recordAttemptForCard(card, {
          answer: pronunciationResponse.transcription,
          isCorrect: pronunciationResponse.isCorrect,
          elapsedMs: timeToComplete || 0,
          awardedXp,
        });

        return {
          isCorrect: pronunciationResponse.isCorrect,
          pronunciationResult: pronunciationResponse,
          transcription: pronunciationResponse.transcription ?? '',
        };
      } catch (error) {
        logger.error('Pronunciation validation failed', error as Error);
        setPronunciationResult(null);
        throw error;
      } finally {
        setIsPronunciationProcessing(false);
      }
    },
    [
      cardStartTime,
      attempts,
      recordedAttempts,
      onInvalidateCache,
      recordAttemptForCard,
      setRecordedAttempts,
    ],
  );

  const recordTeachingComplete = useCallback(
    async (teachingId: string, elapsedMs: number) => {
      try {
        await completeTeaching(teachingId, elapsedMs > 0 ? elapsedMs : undefined);
        onInvalidateCache?.();
      } catch (error) {
        logger.error('Error completing teaching', error as Error);
        throw error;
      }
    },
    [onInvalidateCache],
  );

  const recordFlashcardRating = useCallback(
    async (card: Card, rating: number, elapsedMs: number) => {
      if (!card.id.startsWith('question-')) {
        throw new Error('Card ID does not start with "question-"');
      }

      const questionId = card.id.replace('question-', '');
      const deliveryMethod = getDeliveryMethodForCardKind(
        card.kind,
        'isFlashcard' in card ? card.isFlashcard : false,
      );

      const isCorrect = rating >= 2.5;
      const score = rating === 0 ? 0 : rating === 2.5 ? 50 : 100;

      try {
        const attemptResponse = await recordQuestionAttempt(questionId, {
          deliveryMethod,
          score,
          timeToComplete: elapsedMs,
          percentageAccuracy: score,
          attempts: 1,
        } as any);

        onInvalidateCache?.();

        const delta = isCorrect ? 0.1 : -0.05;
        try {
          await updateDeliveryMethodScore(deliveryMethod, { delta });
        } catch (error) {
          logger.error('Error updating delivery method score', error as Error);
        }

        setRecordedAttempts((prev) => new Set(prev).add(card.id));

        return attemptResponse.awardedXp;
      } catch (error) {
        logger.error('Error recording flashcard rating', error as Error);
        throw error;
      }
    },
    [onInvalidateCache, setRecordedAttempts],
  );

  return {
    attempts,
    recordedAttempts,
    awardedXpByCard,
    cardStartTime,
    incorrectAttemptCount,
    isPronunciationProcessing,
    pronunciationResult,
    setCardStartTime,
    resetCardStartTime,
    recordAttemptForCard,
    validateAndRecordAnswer,
    validateAndRecordPronunciation,
    recordTeachingComplete,
    recordFlashcardRating,
    incrementIncorrectAttemptCount,
    resetIncorrectAttemptCount,
  };
}
