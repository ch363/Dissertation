import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { router } from 'expo-router';

import { routeBuilders, routes } from '@/services/navigation/routes';
import { getDashboard } from '@/services/api/profile';
import { clearCachedSessionPlan } from '@/services/api/session-plan-cache';
import { createLogger } from '@/services/logging';
import { Card, CardKind, AttemptLog, SessionKind } from '@/types/session';

const logger = createLogger('useCardNavigation');

const INCORRECT_ATTEMPTS_BEFORE_SHOWING_ANSWER = 3;

/** Per-card state we persist when navigating back/forward so answers remain visible */
export interface SavedCardState {
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
  pronunciationResult: any | null;
  incorrectAttemptCount: number;
}

export interface UseCardNavigationParams {
  cards: Card[];
  sessionId: string;
  kind: SessionKind;
  lessonId?: string;
  planMode?: 'learn' | 'review' | 'mixed';
  timeBudgetSec?: number | null;
  returnTo?: string;
  onSessionComplete: (attempts: AttemptLog[]) => void;
  // Current card state
  showResult: boolean;
  isCorrect: boolean;
  selectedOptionId?: string;
  selectedAnswer?: string;
  userAnswer: string;
  flashcardRating?: number;
  incorrectAttemptCount: number;
  meaningCorrect: boolean;
}

export interface UseCardNavigationReturn {
  index: number;
  total: number;
  currentCard: Card;
  isLast: boolean;
  canProceed: boolean;
  handleNext: (attempts: AttemptLog[]) => Promise<void>;
  handleBack: () => void;
  saveCurrentCardState: (state: Partial<SavedCardState>) => void;
  getSavedCardState: (index: number) => SavedCardState | undefined;
  invalidateLessonPlanCache: () => void;
}

/** Get phrase from card for attempt count tracking */
function getPhraseFromCard(card: Card): string | null {
  if (card.kind === CardKind.Teach) return card.content.phrase ?? null;
  if (card.kind === CardKind.MultipleChoice) return card.sourceText ?? null;
  if (card.kind === CardKind.FillBlank) return card.text ?? null;
  if (card.kind === CardKind.TranslateToEn || card.kind === CardKind.TranslateFromEn)
    return card.source ?? null;
  if (card.kind === CardKind.Listening) return card.expected ?? null;
  return null;
}

/** Build map of phrase -> max attempt number from attempt logs and plan cards */
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

/** Extract phrase + translation from review session cards for the summary screen */
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

export function useCardNavigation(params: UseCardNavigationParams): UseCardNavigationReturn {
  const {
    cards,
    sessionId,
    kind,
    lessonId,
    planMode,
    timeBudgetSec,
    returnTo,
    onSessionComplete,
    showResult,
    isCorrect,
    selectedOptionId,
    selectedAnswer,
    userAnswer,
    flashcardRating,
    incorrectAttemptCount,
    meaningCorrect,
  } = params;

  const [index, setIndex] = useState(0);
  const cardStateByIndexRef = useRef<Record<number, SavedCardState>>({});

  const total = useMemo(() => cards.length, [cards]);
  const currentCard = cards[index];
  const isLast = index >= total - 1;

  const invalidateLessonPlanCache = useCallback(() => {
    // Only applicable to learn sessions with a real lessonId
    if (kind !== 'learn') return;
    if (!lessonId || lessonId === 'demo') return;
    clearCachedSessionPlan(lessonId);
  }, [kind, lessonId]);

  const saveCurrentCardState = useCallback(
    (state: Partial<SavedCardState>) => {
      cardStateByIndexRef.current[index] = {
        ...cardStateByIndexRef.current[index],
        selectedOptionId: state.selectedOptionId,
        selectedAnswer: state.selectedAnswer,
        userAnswer: state.userAnswer ?? '',
        showResult: state.showResult ?? false,
        isCorrect: state.isCorrect ?? false,
        flashcardRating: state.flashcardRating,
        grammaticalCorrectness: state.grammaticalCorrectness ?? null,
        meaningCorrect: state.meaningCorrect ?? false,
        naturalPhrasing: state.naturalPhrasing,
        feedbackWhy: state.feedbackWhy,
        acceptedVariants: state.acceptedVariants ?? [],
        validationFeedback: state.validationFeedback,
        pronunciationResult: state.pronunciationResult ?? null,
        incorrectAttemptCount: state.incorrectAttemptCount ?? 0,
      };
    },
    [index],
  );

  const getSavedCardState = useCallback((idx: number) => {
    return cardStateByIndexRef.current[idx];
  }, []);

  // Determine if we can proceed based on card type
  const canProceed = useMemo(() => {
    if (!currentCard) return false;

    const isTranslationMCQ =
      currentCard.kind === CardKind.MultipleChoice &&
      'sourceText' in currentCard &&
      !!currentCard.sourceText;

    const isFlashcard = 'isFlashcard' in currentCard && currentCard.isFlashcard;

    const isSpeakListening =
      currentCard.kind === CardKind.Listening &&
      'mode' in currentCard &&
      currentCard.mode === 'speak';

    if (currentCard.kind === CardKind.Teach) return true;

    if (currentCard.kind === CardKind.MultipleChoice) {
      return (
        isTranslationMCQ &&
        showResult &&
        selectedOptionId !== undefined &&
        (isCorrect || incorrectAttemptCount >= INCORRECT_ATTEMPTS_BEFORE_SHOWING_ANSWER)
      );
    }

    if (currentCard.kind === CardKind.FillBlank) {
      return showResult && isCorrect && selectedAnswer !== undefined;
    }

    if (
      currentCard.kind === CardKind.TranslateToEn ||
      currentCard.kind === CardKind.TranslateFromEn
    ) {
      if (isFlashcard) {
        return flashcardRating !== undefined;
      }
      return (
        showResult &&
        userAnswer.trim().length > 0 &&
        (isCorrect ||
          meaningCorrect ||
          incorrectAttemptCount >= INCORRECT_ATTEMPTS_BEFORE_SHOWING_ANSWER)
      );
    }

    if (currentCard.kind === CardKind.Listening) {
      if (isSpeakListening) {
        return showResult;
      }
      return showResult && userAnswer.trim().length > 0;
    }

    return true;
  }, [
    currentCard,
    showResult,
    isCorrect,
    selectedOptionId,
    selectedAnswer,
    userAnswer,
    flashcardRating,
    incorrectAttemptCount,
    meaningCorrect,
  ]);

  const handleNext = useCallback(
    async (attempts: AttemptLog[]) => {
      if (!canProceed) return;

      if (isLast) {
        // Calculate XP and teachings mastered for summary screen
        const totalXp = attempts
          .filter((a) => a.awardedXp !== undefined)
          .reduce((sum, attempt) => sum + (attempt.awardedXp || 0), 0);
        const teachingsMastered = cards.filter((card) => card.kind === CardKind.Teach).length;

        // Review sessions: auto-continue if more reviews are due
        if (kind === 'review') {
          try {
            const dashboard = await getDashboard();
            const dueCount = dashboard?.dueReviewCount ?? 0;
            if (dueCount > 0) {
              const nextSessionId = `review-${Date.now()}`;
              router.replace({
                pathname: routeBuilders.sessionDetail(nextSessionId),
                params: { kind: 'review', returnTo: returnTo ?? routes.tabs.learn },
              });
              onSessionComplete(attempts);
              return;
            }
          } catch (e) {
            logger.error('Failed to get due count after review session', e as Error);
          }
        }

        const attemptCountsByPhrase = buildAttemptCountsByPhrase(attempts, cards);

        // For review, extract teachings from cards for summary screen
        const reviewedTeachingsJson =
          kind === 'review'
            ? JSON.stringify(
                getReviewedTeachingsFromPlan(cards).map((t) => ({
                  ...t,
                  attempts: attemptCountsByPhrase[t.phrase] ?? 1,
                })),
              )
            : undefined;

        // Navigate to session summary
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

        onSessionComplete(attempts);
      } else {
        // Save current state before moving to next card
        saveCurrentCardState({
          selectedOptionId,
          selectedAnswer,
          userAnswer,
          showResult,
          isCorrect,
          flashcardRating,
          incorrectAttemptCount,
        });
        setIndex((i) => i + 1);
      }
    },
    [
      canProceed,
      isLast,
      cards,
      kind,
      sessionId,
      lessonId,
      planMode,
      timeBudgetSec,
      returnTo,
      onSessionComplete,
      saveCurrentCardState,
      selectedOptionId,
      selectedAnswer,
      userAnswer,
      showResult,
      isCorrect,
      flashcardRating,
      incorrectAttemptCount,
    ],
  );

  const handleBack = useCallback(() => {
    if (index > 0) {
      saveCurrentCardState({
        selectedOptionId,
        selectedAnswer,
        userAnswer,
        showResult,
        isCorrect,
        flashcardRating,
        incorrectAttemptCount,
      });
      setIndex((i) => Math.max(0, i - 1));
      return;
    }

    // First card: exit session
    router.back();
  }, [
    index,
    saveCurrentCardState,
    selectedOptionId,
    selectedAnswer,
    userAnswer,
    showResult,
    isCorrect,
    flashcardRating,
    incorrectAttemptCount,
  ]);

  return {
    index,
    total,
    currentCard,
    isLast,
    canProceed,
    handleNext,
    handleBack,
    saveCurrentCardState,
    getSavedCardState,
    invalidateLessonPlanCache,
  };
}
