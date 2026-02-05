import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';

import { getDeliveryMethodForCardKind } from '../../delivery-methods';
import { CardRenderer } from '../card-renderer/CardRenderer';
import { LessonProgressHeader } from '../lesson-progress-header/LessonProgressHeader';

import { ContentContinueButton } from '@/components/ui';
import { makeSessionId } from '@/features/session/sessionBuilder';
import { getDashboard } from '@/services/api/profile';
import {
  validateAnswer,
  validatePronunciation,
  recordQuestionAttempt,
  completeTeaching,
  updateDeliveryMethodScore,
} from '@/services/api/progress';
import { clearCachedSessionPlan } from '@/services/api/session-plan-cache';
import { createLogger } from '@/services/logging';
import { routeBuilders, routes } from '@/services/navigation/routes';
import * as SpeechRecognition from '@/services/speech-recognition';
import { theme } from '@/services/theme/tokens';
import {
  AttemptLog,
  Card,
  CardKind,
  SessionPlan,
  SessionKind,
  PronunciationResult,
} from '@/types/session';

const logger = createLogger('SessionRunner');

/** Get the canonical phrase string for a card (used to match attempts to summary list items). */
function getPhraseFromCard(card: Card): string | null {
  if (card.kind === CardKind.Teach) return card.content.phrase ?? null;
  if (card.kind === CardKind.MultipleChoice) return card.sourceText ?? null;
  if (card.kind === CardKind.FillBlank) return card.text ?? null;
  if (card.kind === CardKind.TranslateToEn || card.kind === CardKind.TranslateFromEn)
    return card.source ?? null;
  if (card.kind === CardKind.Listening) return card.expected ?? null;
  return null;
}

/** Build map of phrase -> max attempt number from attempt logs and plan cards. */
function buildAttemptCountsByPhrase(attempts: AttemptLog[], cards: Card[]): Record<string, number> {
  const byPhrase: Record<string, number> = {};
  const cardById = new Map(cards.map((c) => [c.id, c]));
  for (const a of attempts) {
    const card = cardById.get(a.cardId);
    const phrase = card ? getPhraseFromCard(card) : null;
    if (phrase) {
      byPhrase[phrase] = Math.max(byPhrase[phrase] ?? 0, a.attemptNumber);
    }
  }
  return byPhrase;
}

/** Extract phrase + translation from review session cards for the summary screen. Dedupes by phrase. */
function getReviewedTeachingsFromPlan(
  cards: Card[],
): { phrase: string; translation?: string; emoji?: string }[] {
  const seen = new Set<string>();
  const out: { phrase: string; translation?: string; emoji?: string }[] = [];
  for (const card of cards) {
    let phrase = '';
    let translation: string | undefined;
    let emoji: string | undefined;
    if (card.kind === CardKind.Teach) {
      phrase = card.content.phrase;
      translation = card.content.translation;
      emoji = card.content.emoji;
    } else if (card.kind === CardKind.MultipleChoice) {
      phrase = card.sourceText ?? '';
      translation = card.options?.find((o) => o.id === card.correctOptionId)?.label;
    } else if (card.kind === CardKind.FillBlank) {
      phrase = card.text;
      translation = card.answer;
    } else if (card.kind === CardKind.TranslateToEn || card.kind === CardKind.TranslateFromEn) {
      phrase = card.source;
      translation = card.expected;
    } else if (card.kind === CardKind.Listening) {
      phrase = card.expected;
      translation = card.translation;
    }
    if (phrase && !seen.has(phrase)) {
      seen.add(phrase);
      out.push({ phrase, translation, emoji });
    }
  }
  return out;
}

function isHapticsUsable(): boolean {
  return !!(Haptics.ImpactFeedbackStyle && typeof Haptics.impactAsync === 'function');
}

/**
 * Trigger haptic feedback if available
 */
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

const INCORRECT_ATTEMPTS_BEFORE_SHOWING_ANSWER = 3;

/** Per-card state we persist when navigating back/forward so answers remain visible */
interface SavedCardState {
  selectedOptionId: string | undefined;
  selectedAnswer: string | undefined;
  userAnswer: string;
  showResult: boolean;
  isCorrect: boolean;
  flashcardRating: number | undefined;
  grammaticalCorrectness: number | null;
  meaningCorrect: boolean;
  naturalPhrasing: string | undefined;
  feedbackWhy: string | undefined;
  acceptedVariants: string[];
  validationFeedback: string | undefined;
  pronunciationResult: PronunciationResult | null;
  incorrectAttemptCount: number;
}

type Props = {
  plan: SessionPlan;
  sessionId: string;
  kind: SessionKind;
  lessonId?: string;
  planMode?: 'learn' | 'review' | 'mixed';
  timeBudgetSec?: number | null;
  returnTo?: string;
  onComplete: (attempts: AttemptLog[]) => void;
};

export function SessionRunner({
  plan,
  sessionId,
  kind,
  lessonId,
  planMode,
  timeBudgetSec,
  returnTo,
  onComplete,
}: Props) {
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState<AttemptLog[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | undefined>(undefined);
  const [selectedAnswer, setSelectedAnswer] = useState<string | undefined>(undefined);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [flashcardRating, setFlashcardRating] = useState<number | undefined>(undefined);
  const [cardStartTime, setCardStartTime] = useState<number | null>(null);
  const [recordedAttempts, setRecordedAttempts] = useState<Set<string>>(new Set());
  const [pronunciationResult, setPronunciationResult] = useState<PronunciationResult | null>(null);
  const [_audioRecordingUri, setAudioRecordingUri] = useState<string | null>(null);
  const [isPronunciationProcessing, setIsPronunciationProcessing] = useState(false);
  const [awardedXpByCard, setAwardedXpByCard] = useState<Map<string, number>>(new Map());
  const [grammaticalCorrectness, setGrammaticalCorrectness] = useState<number | null>(null);
  const [meaningCorrect, setMeaningCorrect] = useState(false);
  const [naturalPhrasing, setNaturalPhrasing] = useState<string | undefined>(undefined);
  const [feedbackWhy, setFeedbackWhy] = useState<string | undefined>(undefined);
  const [acceptedVariants, setAcceptedVariants] = useState<string[]>([]);
  const [validationFeedback, setValidationFeedback] = useState<string | undefined>(undefined);
  const [incorrectAttemptCount, setIncorrectAttemptCount] = useState(0);
  const currentCard = plan.cards[index];
  const total = useMemo(() => plan.cards.length, [plan.cards]);
  const isSpeakListening =
    currentCard?.kind === CardKind.Listening &&
    'mode' in currentCard &&
    currentCard.mode === 'speak';

  /** Persist per-card state so answers remain when navigating back to a previous question */
  const cardStateByIndexRef = useRef<Record<number, SavedCardState>>({});

  const saveCurrentCardState = (atIndex: number) => {
    cardStateByIndexRef.current[atIndex] = {
      selectedOptionId,
      selectedAnswer,
      userAnswer,
      showResult,
      isCorrect,
      flashcardRating,
      grammaticalCorrectness,
      meaningCorrect,
      naturalPhrasing,
      feedbackWhy,
      acceptedVariants,
      validationFeedback,
      pronunciationResult,
      incorrectAttemptCount,
    };
  };

  const invalidateLessonPlanCache = () => {
    // Only applicable to learn sessions with a real lessonId.
    // This prevents reuse of a cached/preloaded plan after progress writes.
    if (kind !== 'learn') return;
    if (!lessonId || lessonId === 'demo') return;
    clearCachedSessionPlan(lessonId);
  };

  // When index changes: restore saved state for that card so answers remain when going back
  useEffect(() => {
    if (currentCard) {
      setCardStartTime(Date.now());
    } else {
      setCardStartTime(null);
    }

    const saved = cardStateByIndexRef.current[index];
    if (saved) {
      setSelectedOptionId(saved.selectedOptionId);
      setSelectedAnswer(saved.selectedAnswer);
      setUserAnswer(saved.userAnswer);
      setShowResult(saved.showResult);
      setIsCorrect(saved.isCorrect);
      setFlashcardRating(saved.flashcardRating);
      setGrammaticalCorrectness(saved.grammaticalCorrectness);
      setMeaningCorrect(saved.meaningCorrect);
      setNaturalPhrasing(saved.naturalPhrasing);
      setFeedbackWhy(saved.feedbackWhy);
      setAcceptedVariants(saved.acceptedVariants);
      setValidationFeedback(saved.validationFeedback);
      setPronunciationResult(saved.pronunciationResult);
      setIncorrectAttemptCount(saved.incorrectAttemptCount ?? 0);
      setAudioRecordingUri(null);
    } else {
      setSelectedOptionId(undefined);
      setSelectedAnswer(undefined);
      setUserAnswer('');
      setShowResult(false);
      setIsCorrect(false);
      setFlashcardRating(undefined);
      setPronunciationResult(null);
      setAudioRecordingUri(null);
      setGrammaticalCorrectness(null);
      setMeaningCorrect(false);
      setNaturalPhrasing(undefined);
      setFeedbackWhy(undefined);
      setAcceptedVariants([]);
      setValidationFeedback(undefined);
      setIncorrectAttemptCount(0);
    }
  }, [index, currentCard]);

  const isLast = index >= total - 1;

  // Determine if we can proceed based on card type
  // For type-based cards, must check answer first (showResult must be true)
  const isTranslationMCQ =
    currentCard.kind === CardKind.MultipleChoice &&
    'sourceText' in currentCard &&
    !!currentCard.sourceText;

  // Check if current card is a flashcard
  const isFlashcard = 'isFlashcard' in currentCard && currentCard.isFlashcard;

  const canProceed =
    currentCard.kind === CardKind.Teach ||
    (currentCard.kind === CardKind.MultipleChoice
      ? isTranslationMCQ
        ? showResult &&
          selectedOptionId !== undefined &&
          (isCorrect || incorrectAttemptCount >= INCORRECT_ATTEMPTS_BEFORE_SHOWING_ANSWER)
        : showResult &&
          selectedOptionId !== undefined &&
          (isCorrect || incorrectAttemptCount >= INCORRECT_ATTEMPTS_BEFORE_SHOWING_ANSWER)
      : currentCard.kind === CardKind.FillBlank
        ? showResult && isCorrect && selectedAnswer !== undefined // Must have correct answer selected
        : currentCard.kind === CardKind.TranslateToEn ||
            currentCard.kind === CardKind.TranslateFromEn
          ? isFlashcard
            ? flashcardRating !== undefined // Flashcard: need rating
            : showResult &&
              userAnswer.trim().length > 0 &&
              (isCorrect ||
                meaningCorrect ||
                incorrectAttemptCount >= INCORRECT_ATTEMPTS_BEFORE_SHOWING_ANSWER) // Text translation: proceed only when correct, meaning-correct, or 3rd attempt
          : currentCard.kind === CardKind.Listening
            ? isSpeakListening
              ? showResult // Speech practice: proceed after attempt (result may be unavailable on error)
              : showResult && userAnswer.trim().length > 0 // Type listening: must check answer first
            : true);

  const handleSelectOption = async (optionId: string) => {
    if (currentCard.kind === CardKind.MultipleChoice) {
      setSelectedOptionId(optionId);

      // For translation MCQ (with sourceText), automatically check answer
      const isTranslationMCQ = 'sourceText' in currentCard && !!currentCard.sourceText;
      if (isTranslationMCQ) {
        // Check if the selected option is correct before validation
        const isCorrectOption = optionId === currentCard.correctOptionId;

        // Haptic feedback immediately based on whether the option is correct
        // This provides instant feedback when user selects an option
        if (isCorrectOption) {
          triggerHaptic('light');
        } else {
          triggerHaptic('medium');
        }

        // Pass optionId directly to avoid state timing issues
        await handleCheckAnswer(optionId);
      }
      // For regular MCQ, wait for "Check Answer" button
    }
  };

  const handleCheckAnswer = async (optionIdOverride?: string, audioUri?: string) => {
    // Prevent concurrent validations
    if (isValidatingRef.current) {
      return;
    }

    // Only validate practice cards (not teach cards)
    if (currentCard.kind === CardKind.Teach) {
      return;
    }

    isValidatingRef.current = true;

    // Extract questionId from cardId (format: "question-${questionId}")
    if (!currentCard.id.startsWith('question-')) {
      logger.warn('Card ID does not start with "question-"', { cardId: currentCard.id });
      return;
    }

    const questionId = currentCard.id.replace('question-', '');
    const deliveryMethod = getDeliveryMethodForCardKind(
      currentCard.kind,
      'isFlashcard' in currentCard ? currentCard.isFlashcard : false,
    );

    try {
      // Check if this is a pronunciation validation (TEXT_TO_SPEECH mode)
      const isPronunciationMode =
        currentCard.kind === CardKind.Listening &&
        'mode' in currentCard &&
        currentCard.mode === 'speak' &&
        audioUri;

      if (isPronunciationMode && audioUri) {
        // Handle pronunciation validation (with timeout so UI never stays stuck)
        const PRONUNCIATION_CLIENT_TIMEOUT_MS = 30_000;
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error('Pronunciation validation timed out')),
            PRONUNCIATION_CLIENT_TIMEOUT_MS,
          );
        });

        logger.info('Processing pronunciation recording', { audioUri, questionId });
        setAudioRecordingUri(audioUri);
        setIsPronunciationProcessing(true);
        try {
          const audioFile = await Promise.race([
            SpeechRecognition.getAudioFile(audioUri),
            timeoutPromise,
          ]);
          if (!audioFile?.base64) {
            logger.error('Failed to get audio file for pronunciation validation');
            setIsCorrect(false);
            setShowResult(true);
            return;
          }

          // IMPORTANT: use the local `audioUri` (state updates are async)
          const normalizedUri = audioUri.toLowerCase();
          const audioFormat = normalizedUri.endsWith('.m4a')
            ? 'm4a'
            : normalizedUri.endsWith('.flac')
              ? 'flac'
              : 'wav';

          logger.info('Audio file loaded', {
            format: audioFormat,
            base64Length: audioFile.base64.length,
            uri: audioFile.uri,
          });

          const pronunciationResponse = await Promise.race([
            validatePronunciation(questionId, audioFile.base64, audioFormat),
            timeoutPromise,
          ]);
          logger.info('Pronunciation response received', {
            isCorrect: pronunciationResponse.isCorrect,
            overallScore: pronunciationResponse.overallScore,
            transcription: pronunciationResponse.transcription,
          });
          setPronunciationResult(pronunciationResponse);
          // Populate `userAnswer` so the app has a consistent "answer" string for attempts/analytics.
          setUserAnswer(pronunciationResponse.transcription ?? '');
          setIsCorrect(pronunciationResponse.isCorrect);
          setShowResult(true);

          // Haptic feedback based on correctness
          if (pronunciationResponse.isCorrect) {
            triggerHaptic('light');
          } else {
            triggerHaptic('medium');
          }

          // Record attempt
          const timeToComplete = cardStartTime ? Date.now() - cardStartTime : undefined;
          const attemptNumber = attempts.filter((a) => a.cardId === currentCard.id).length + 1;

          let awardedXp: number | undefined;
          if (!recordedAttempts.has(currentCard.id)) {
            try {
              const attemptResponse = await recordQuestionAttempt(questionId, {
                deliveryMethod,
                score: pronunciationResponse.score,
                timeToComplete,
                percentageAccuracy: pronunciationResponse.overallScore,
                attempts: attemptNumber,
              } as any);
              awardedXp = attemptResponse.awardedXp;
              invalidateLessonPlanCache();

              const delta = pronunciationResponse.isCorrect ? 0.1 : -0.05;
              try {
                await updateDeliveryMethodScore(deliveryMethod, { delta });
              } catch (error) {
                logger.error('Error updating delivery method score', error as Error);
              }

              setRecordedAttempts((prev) => new Set(prev).add(currentCard.id));
            } catch (error) {
              logger.error('Error recording question attempt', error as Error);
            }
          }

          const newAttempt: AttemptLog = {
            cardId: currentCard.id,
            attemptNumber,
            answer: pronunciationResponse.transcription,
            isCorrect: pronunciationResponse.isCorrect,
            elapsedMs: timeToComplete || 0,
            awardedXp,
          };
          setAttempts((prev) => [...prev, newAttempt]);
        } catch (pronunciationError) {
          logger.error('Pronunciation validation failed or timed out', pronunciationError as Error);
          setIsCorrect(false);
          setShowResult(true);
          setUserAnswer('');
          setPronunciationResult(null);
        } finally {
          setIsPronunciationProcessing(false);
        }
        return;
      }

      // Regular text-based validation
      let userAnswerValue: string;

      if (currentCard.kind === CardKind.MultipleChoice) {
        const optionId = optionIdOverride ?? selectedOptionId;
        if (optionId === undefined) return;
        userAnswerValue = optionId;
      } else if (
        currentCard.kind === CardKind.TranslateToEn ||
        currentCard.kind === CardKind.TranslateFromEn ||
        currentCard.kind === CardKind.Listening
      ) {
        if (userAnswer.trim().length === 0) return;
        userAnswerValue = userAnswer;
      } else if (currentCard.kind === CardKind.FillBlank) {
        if (selectedAnswer === undefined) return;
        userAnswerValue = selectedAnswer;
      } else {
        return;
      }

      // Validate answer via backend
      const validationResult = await validateAnswer(questionId, userAnswerValue, deliveryMethod);

      // For MultipleChoice we have correctOptionId on the card – use it for UI correctness
      // so the feedback banner and haptics match the option styling (green/red).
      const effectiveCorrect =
        currentCard.kind === CardKind.MultipleChoice && 'correctOptionId' in currentCard
          ? userAnswerValue === currentCard.correctOptionId
          : validationResult.isCorrect;

      setIsCorrect(effectiveCorrect);
      setShowResult(true);
      setGrammaticalCorrectness(validationResult.grammaticalCorrectness ?? null);
      setMeaningCorrect(validationResult.meaningCorrect ?? false);
      setNaturalPhrasing(validationResult.naturalPhrasing);
      setFeedbackWhy(validationResult.feedbackWhy);
      setAcceptedVariants(validationResult.acceptedVariants ?? []);
      setValidationFeedback(validationResult.feedback);

      if (
        !effectiveCorrect &&
        (currentCard.kind === CardKind.TranslateToEn ||
          currentCard.kind === CardKind.TranslateFromEn ||
          currentCard.kind === CardKind.MultipleChoice)
      ) {
        setIncorrectAttemptCount((prev) => prev + 1);
      }

      // Haptic feedback based on correctness
      if (effectiveCorrect) {
        triggerHaptic('light');
      } else {
        triggerHaptic('medium');
      }

      // Calculate time to complete
      const timeToComplete = cardStartTime ? Date.now() - cardStartTime : undefined;
      const attemptNumber = attempts.filter((a) => a.cardId === currentCard.id).length + 1;

      // Record question attempt immediately after validation
      let awardedXp: number | undefined;
      if (!recordedAttempts.has(currentCard.id)) {
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
          invalidateLessonPlanCache();
          // Update delivery method score based on performance
          const delta = validationResult.isCorrect ? 0.1 : -0.05;
          try {
            await updateDeliveryMethodScore(deliveryMethod, { delta });
          } catch (error) {
            logger.error('Error updating delivery method score', error as Error);
            // Continue even if this fails
          }

          setRecordedAttempts((prev) => new Set(prev).add(currentCard.id));
        } catch (error) {
          logger.error('Error recording question attempt', error as Error);
          // Continue even if API call fails
        }
      }

      // Create attempt log with validated score
      const newAttempt: AttemptLog = {
        cardId: currentCard.id,
        attemptNumber,
        answer: userAnswerValue,
        isCorrect: validationResult.isCorrect,
        elapsedMs: timeToComplete || 0,
        awardedXp,
      };
      setAttempts((prev) => [...prev, newAttempt]);
    } catch (error) {
      logger.error('Error validating answer', error as Error);
      // Fallback: mark as incorrect if validation fails
      setIsCorrect(false);
      setShowResult(true);
      triggerHaptic('medium');
    } finally {
      setIsPronunciationProcessing(false);
      isValidatingRef.current = false;
    }
  };

  const handleSelectAnswer = async (answer: string) => {
    if (currentCard.kind === CardKind.FillBlank) {
      setSelectedAnswer(answer);

      // Immediately validate the answer when option is selected
      if (currentCard.id.startsWith('question-')) {
        const questionId = currentCard.id.replace('question-', '');
        const deliveryMethod = getDeliveryMethodForCardKind(currentCard.kind);

        try {
          const validationResult = await validateAnswer(questionId, answer, deliveryMethod);
          setIsCorrect(validationResult.isCorrect);
          setShowResult(true);
          setGrammaticalCorrectness(validationResult.grammaticalCorrectness ?? null);

          // Haptic feedback immediately based on correctness
          if (validationResult.isCorrect) {
            triggerHaptic('light');
          } else {
            triggerHaptic('medium');
          }

          // Calculate time to complete
          const timeToComplete = cardStartTime ? Date.now() - cardStartTime : undefined;
          const attemptNumber = attempts.filter((a) => a.cardId === currentCard.id).length + 1;

          // Record question attempt immediately after validation
          let awardedXp: number | undefined;
          if (!recordedAttempts.has(currentCard.id)) {
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
              invalidateLessonPlanCache();

              // Store awardedXp for this card
              if (awardedXp !== undefined) {
                setAwardedXpByCard((prev) => new Map(prev).set(currentCard.id, awardedXp!));
              }

              // Update delivery method score based on performance
              const delta = validationResult.isCorrect ? 0.1 : -0.05;
              try {
                await updateDeliveryMethodScore(deliveryMethod, { delta });
              } catch (error) {
                logger.error('Error updating delivery method score', error as Error);
                // Continue even if this fails
              }

              setRecordedAttempts((prev) => new Set(prev).add(currentCard.id));
            } catch (error) {
              logger.error('Error recording question attempt', error as Error);
              // Continue even if API call fails
            }
          }

          // If correct, we can proceed immediately
          // If incorrect, user must select correct answer
        } catch (error) {
          logger.error('Error validating FillBlank answer', error as Error);
          setIsCorrect(false);
          setShowResult(true);
          triggerHaptic('medium');
        }
      }
    }
  };

  const handleAnswerChange = (answer: string) => {
    setUserAnswer(answer);
    // Don't validate on change - wait for "Check Answer" button
    // This keeps UI responsive while user types
  };

  const handleCheckAnswerWrapper = async (audioUri?: string) => {
    await handleCheckAnswer(undefined, audioUri);
  };

  const handleNext = async () => {
    if (!canProceed) return;

    // For cards that don't need result screen, validate and create attempt
    let nextAttempts = attempts;

    // Flashcard cards: save rating as attempt and send to backend
    const isFlashcard = 'isFlashcard' in currentCard && currentCard.isFlashcard;
    if (
      isFlashcard &&
      flashcardRating !== undefined &&
      !attempts.some((a) => a.cardId === currentCard.id)
    ) {
      // For flashcards, rating determines correctness: 0 = wrong, 2.5 = mid, 5 = correct
      const isCorrect = flashcardRating >= 2.5; // 2.5 and 5 are considered correct

      // Send rating to backend API for scoring
      let awardedXp: number | undefined;
      if (currentCard.id.startsWith('question-')) {
        const questionId = currentCard.id.replace('question-', '');
        const deliveryMethod = getDeliveryMethodForCardKind(
          currentCard.kind,
          currentCard.isFlashcard,
        );

        try {
          // Record the attempt with the rating as the score
          // Rating: 0 = 0% (wrong), 2.5 = 50% (mid), 5 = 100% (correct)
          const score = flashcardRating === 0 ? 0 : flashcardRating === 2.5 ? 50 : 100;
          const timeToComplete = cardStartTime ? Date.now() - cardStartTime : undefined;

          const attemptResponse = await recordQuestionAttempt(questionId, {
            deliveryMethod,
            score,
            timeToComplete,
            percentageAccuracy: score,
            attempts: 1,
          } as any);
          awardedXp = attemptResponse.awardedXp;
          invalidateLessonPlanCache();
          // Update delivery method score based on performance
          const delta = isCorrect ? 0.1 : -0.05;
          try {
            await updateDeliveryMethodScore(deliveryMethod, { delta });
          } catch (error) {
            logger.error('Error updating delivery method score', error as Error);
            // Continue even if this fails
          }

          setRecordedAttempts((prev) => new Set(prev).add(currentCard.id));
        } catch (error) {
          logger.error('Error recording flashcard rating', error as Error);
          // Continue even if API call fails
        }
      }

      const newAttempt: AttemptLog = {
        cardId: currentCard.id,
        attemptNumber: 1,
        answer: `rating:${flashcardRating}`,
        isCorrect,
        elapsedMs: 0,
        awardedXp,
      };
      nextAttempts = [...attempts, newAttempt];
      setAttempts(nextAttempts);
    }
    // FillBlank cards: validation happens immediately on selection in handleSelectAnswer
    // Just save the attempt if correct and not already saved
    else if (
      currentCard.kind === CardKind.FillBlank &&
      selectedAnswer &&
      showResult &&
      isCorrect &&
      !attempts.some((a) => a.cardId === currentCard.id)
    ) {
      // Save the attempt (validation already happened in handleSelectAnswer)
      // Get awardedXp from state if available
      const awardedXp = awardedXpByCard.get(currentCard.id);
      const newAttempt: AttemptLog = {
        cardId: currentCard.id,
        attemptNumber: 1,
        answer: selectedAnswer,
        isCorrect: true,
        elapsedMs: 0,
        awardedXp,
      };
      nextAttempts = [...attempts, newAttempt];
      setAttempts(nextAttempts);
    } else if (
      currentCard.kind === CardKind.Teach &&
      !attempts.some((a) => a.cardId === currentCard.id)
    ) {
      // Extract teachingId from cardId (format: "teach-${teachingId}") and send time spent for study time
      const elapsedMs = cardStartTime ? Date.now() - cardStartTime : 0;
      if (currentCard.id.startsWith('teach-')) {
        const teachingId = currentCard.id.replace('teach-', '');
        try {
          await completeTeaching(teachingId, elapsedMs > 0 ? elapsedMs : undefined);
          invalidateLessonPlanCache();
        } catch (error) {
          logger.error('Error completing teaching', error as Error);
          // Continue even if API call fails
        }
      }

      const newAttempt: AttemptLog = {
        cardId: currentCard.id,
        attemptNumber: 1,
        answer: 'viewed',
        isCorrect: true,
        elapsedMs,
      };
      nextAttempts = [...attempts, newAttempt];
      setAttempts(nextAttempts);
    }

    if (isLast) {
      // Calculate XP and teachings mastered for summary screen
      const totalXp = nextAttempts
        .filter((a) => a.awardedXp !== undefined)
        .reduce((sum, attempt) => sum + (attempt.awardedXp || 0), 0);
      const teachingsMastered = plan.cards.filter((card) => card.kind === CardKind.Teach).length;

      // Review sessions: only show the summary when there are zero due reviews.
      // If more are due, start the next session so the user continues without seeing the summary.
      if (kind === 'review') {
        try {
          const dashboard = await getDashboard();
          const dueCount = dashboard?.dueReviewCount ?? 0;
          if (dueCount > 0) {
            const nextSessionId = makeSessionId('review');
            router.replace({
              pathname: routeBuilders.sessionDetail(nextSessionId),
              params: { kind: 'review', returnTo: returnTo ?? routes.tabs.learn },
            });
            onComplete(nextAttempts);
            return;
          }
        } catch (e) {
          logger.error('Failed to get due count after review session', e as Error);
          // On error, show summary so user isn't stuck
        }
      }

      const attemptCountsByPhrase = buildAttemptCountsByPhrase(nextAttempts, plan.cards);

      // For review, extract teachings from cards so summary can show "phrases you reviewed" with attempt counts
      const reviewedTeachingsJson =
        kind === 'review'
          ? JSON.stringify(
              getReviewedTeachingsFromPlan(plan.cards).map((t) => ({
                ...t,
                attempts: attemptCountsByPhrase[t.phrase] ?? 1,
              })),
            )
          : undefined;

      // Navigate to standard session summary (one screen for all completion flows)
      router.replace({
        pathname: routeBuilders.sessionSummary(sessionId),
        params: {
          kind,
          lessonId,
          planMode: planMode ?? '',
          timeBudgetSec: timeBudgetSec ? String(timeBudgetSec) : '',
          ...(returnTo ? { returnTo } : {}),
          totalXp: totalXp.toString(),
          teachingsMastered: teachingsMastered.toString(),
          ...(reviewedTeachingsJson ? { reviewedTeachings: reviewedTeachingsJson } : {}),
          attemptCountsByPhrase: JSON.stringify(attemptCountsByPhrase),
        },
      });

      // Still call onComplete for backwards compatibility (though it may not be used)
      onComplete(nextAttempts);
    } else {
      saveCurrentCardState(index);
      setIndex((i) => i + 1);
    }
  };

  const handleTryAgain = () => {
    setShowResult(false);
    setIsCorrect(false);
    setMeaningCorrect(false);
    setNaturalPhrasing(undefined);
    setFeedbackWhy(undefined);
    setAcceptedVariants([]);
    setValidationFeedback(undefined);
    setGrammaticalCorrectness(null);
    // Don't reset userAnswer or selectedOptionId - let user see/edit their previous answer
    // But do reset these if they want a completely fresh start:
    // setUserAnswer('');
    // setSelectedOptionId(undefined);
  };

  const handleBack = () => {
    if (index > 0) {
      saveCurrentCardState(index);
      setIndex((i) => Math.max(0, i - 1));
      return;
    }

    // First card: exit session
    router.back();
  };

  // Figma / Professional App Redesign: full-screen gradient (slate-50 → blue-50 → indigo-50)
  const sessionBgGradient = ['#f8fafc', '#eff6ff', '#eef2ff'] as const;

  const footerLabel = isLast ? 'Finish' : 'Continue';

  const isTranslateTextInput =
    (currentCard.kind === CardKind.TranslateToEn ||
      currentCard.kind === CardKind.TranslateFromEn) &&
    !('isFlashcard' in currentCard && currentCard.isFlashcard);
  const showSuggestedAnswer =
    isTranslateTextInput && incorrectAttemptCount >= INCORRECT_ATTEMPTS_BEFORE_SHOWING_ANSWER;
  const showCorrectAnswer =
    currentCard.kind === CardKind.MultipleChoice &&
    incorrectAttemptCount >= INCORRECT_ATTEMPTS_BEFORE_SHOWING_ANSWER;

  return (
    <View style={styles.container} testID="session-runner-container">
      <LinearGradient colors={sessionBgGradient} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <LessonProgressHeader
          title={plan.title ?? 'Course'}
          current={index + 1}
          total={total}
          onBackPress={handleBack}
          returnTo={returnTo}
        />
      </View>

      <ScrollView
        style={styles.cardArea}
        contentContainerStyle={styles.cardAreaContent}
        showsVerticalScrollIndicator={false}
        testID="session-card-scroll"
      >
        <CardRenderer
          card={currentCard}
          selectedOptionId={selectedOptionId}
          onSelectOption={handleSelectOption}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={handleSelectAnswer}
          userAnswer={userAnswer}
          onAnswerChange={handleAnswerChange}
          showResult={showResult}
          isCorrect={isCorrect}
          grammaticalCorrectness={grammaticalCorrectness}
          meaningCorrect={meaningCorrect}
          naturalPhrasing={naturalPhrasing}
          feedbackWhy={feedbackWhy}
          acceptedVariants={acceptedVariants}
          validationFeedback={validationFeedback}
          showSuggestedAnswer={showSuggestedAnswer}
          showCorrectAnswer={showCorrectAnswer}
          onCheckAnswer={handleCheckAnswerWrapper}
          onContinue={isSpeakListening ? handleNext : undefined}
          onTryAgain={handleTryAgain}
          onRating={(rating) => {
            logger.info('Rating received', { rating });
            setFlashcardRating(rating);
            logger.debug('flashcardRating state updated', { rating });
          }}
          selectedRating={flashcardRating}
          pronunciationResult={pronunciationResult}
          isPronunciationProcessing={isPronunciationProcessing}
          onPracticeAgain={
            isSpeakListening
              ? () => {
                  setShowResult(false);
                  setPronunciationResult(null);
                }
              : undefined
          }
          incorrectAttemptCount={incorrectAttemptCount}
        />
      </ScrollView>

      {!isSpeakListening ? (
        <View style={styles.footer}>
          <ContentContinueButton
            title={footerLabel}
            onPress={handleNext}
            disabled={!canProceed}
            accessibilityLabel={footerLabel}
            accessibilityHint={isLast ? 'Ends the session' : 'Goes to next question'}
            testID="session-continue-button"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    overflow: 'hidden',
  },
  header: {
    paddingBottom: theme.spacing.md,
  },
  cardArea: {
    flex: 1,
    minHeight: 0, // critical: allow children to shrink instead of pushing footer off-screen
  },
  cardAreaContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xs, // Minimal padding to fit everything on screen
  },
  footer: {
    paddingTop: theme.spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'stretch',
  },
  secondaryButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.card,
  },
  secondaryButtonLabel: {
    color: theme.colors.primary,
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
  },
});
