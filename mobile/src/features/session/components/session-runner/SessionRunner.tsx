import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';

import { getDeliveryMethodForCardKind } from '../../delivery-methods';
import { useCardNavigation } from '../../hooks/useCardNavigation';
import { useAttemptTracking } from '../../hooks/useAttemptTracking';
import { CardRenderer } from '../card-renderer/CardRenderer';
import { LessonProgressHeader } from '../lesson-progress-header/LessonProgressHeader';

import { ContentContinueButton } from '@/components/ui';
import { createLogger } from '@/services/logging';
import { theme } from '@/services/theme/tokens';
import { CardKind, SessionPlan, SessionKind } from '@/types/session';

const logger = createLogger('SessionRunner');

const INCORRECT_ATTEMPTS_BEFORE_SHOWING_ANSWER = 3;

type Props = {
  plan: SessionPlan;
  sessionId: string;
  kind: SessionKind;
  lessonId?: string;
  planMode?: 'learn' | 'review' | 'mixed';
  timeBudgetSec?: number | null;
  returnTo?: string;
  onComplete: (attempts: import('@/types/session').AttemptLog[]) => void;
};

/**
 * SessionRunner - Main session execution component
 *
 * Refactored to use hooks following SOLID principles (SRP, DIP).
 * Logic is delegated to specialized hooks:
 * - useCardNavigation: handles card navigation, state persistence
 * - useAttemptTracking: handles answer validation and attempt recording
 */
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
  // UI-only state (card-specific, reset on navigation)
  const [selectedOptionId, setSelectedOptionId] = useState<string | undefined>(undefined);
  const [selectedAnswer, setSelectedAnswer] = useState<string | undefined>(undefined);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [flashcardRating, setFlashcardRating] = useState<number | undefined>(undefined);
  const [grammaticalCorrectness, setGrammaticalCorrectness] = useState<number | null>(null);
  const [meaningCorrect, setMeaningCorrect] = useState(false);
  const [naturalPhrasing, setNaturalPhrasing] = useState<string | undefined>(undefined);
  const [feedbackWhy, setFeedbackWhy] = useState<string | undefined>(undefined);
  const [acceptedVariants, setAcceptedVariants] = useState<string[]>([]);
  const [validationFeedback, setValidationFeedback] = useState<string | undefined>(undefined);

  // Attempt tracking hook
  const attemptTracking = useAttemptTracking({
    sessionId,
    onInvalidateCache: () => {
      if (kind === 'learn' && lessonId && lessonId !== 'demo') {
        import('@/services/api/session-plan-cache').then((mod) =>
          mod.clearCachedSessionPlan(lessonId),
        );
      }
    },
  });

  // Card navigation hook
  const cardNavigation = useCardNavigation({
    cards: plan.cards,
    sessionId,
    kind,
    lessonId,
    planMode,
    timeBudgetSec,
    returnTo,
    onSessionComplete: onComplete,
    showResult,
    isCorrect,
    selectedOptionId,
    selectedAnswer,
    userAnswer,
    flashcardRating,
    incorrectAttemptCount: attemptTracking.incorrectAttemptCount,
    meaningCorrect,
  });

  const { currentCard, index, total, isLast, canProceed, handleBack, getSavedCardState } =
    cardNavigation;

  const isSpeakListening =
    currentCard?.kind === CardKind.Listening &&
    'mode' in currentCard &&
    currentCard.mode === 'speak';

  // Restore card state when navigating
  useEffect(() => {
    attemptTracking.resetCardStartTime();

    const saved = getSavedCardState(index);
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
    } else {
      resetCardState();
    }
  }, [index]);

  const resetCardState = useCallback(() => {
    setSelectedOptionId(undefined);
    setSelectedAnswer(undefined);
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(false);
    setFlashcardRating(undefined);
    setGrammaticalCorrectness(null);
    setMeaningCorrect(false);
    setNaturalPhrasing(undefined);
    setFeedbackWhy(undefined);
    setAcceptedVariants([]);
    setValidationFeedback(undefined);
    attemptTracking.resetIncorrectAttemptCount();
  }, [attemptTracking]);

  const handleSelectOption = useCallback(
    async (optionId: string) => {
      if (currentCard.kind === CardKind.MultipleChoice) {
        setSelectedOptionId(optionId);
        const isTranslationMCQ = 'sourceText' in currentCard && !!currentCard.sourceText;
        if (isTranslationMCQ) {
          await handleCheckAnswer(optionId);
        }
      }
    },
    [currentCard],
  );

  const handleCheckAnswer = useCallback(
    async (optionIdOverride?: string, audioUri?: string) => {
      if (currentCard.kind === CardKind.Teach) return;

      const deliveryMethod = getDeliveryMethodForCardKind(
        currentCard.kind,
        'isFlashcard' in currentCard ? currentCard.isFlashcard : false,
      );

      // Handle pronunciation mode
      if (
        currentCard.kind === CardKind.Listening &&
        'mode' in currentCard &&
        currentCard.mode === 'speak' &&
        audioUri
      ) {
        try {
          const result = await attemptTracking.validateAndRecordPronunciation(currentCard, audioUri);
          setUserAnswer(result.transcription);
          setIsCorrect(result.isCorrect);
          setShowResult(true);
        } catch {
          setIsCorrect(false);
          setShowResult(true);
        }
        return;
      }

      // Get user answer based on card type
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

      try {
        const result = await attemptTracking.validateAndRecordAnswer(
          currentCard,
          userAnswerValue,
          deliveryMethod,
        );

        setIsCorrect(result.isCorrect);
        setShowResult(true);
        setGrammaticalCorrectness(result.grammaticalCorrectness);
        setMeaningCorrect(result.meaningCorrect);
        setNaturalPhrasing(result.naturalPhrasing);
        setFeedbackWhy(result.feedbackWhy);
        setAcceptedVariants(result.acceptedVariants);
        setValidationFeedback(result.validationFeedback);

        if (!result.isCorrect) {
          attemptTracking.incrementIncorrectAttemptCount();
        }
      } catch (error) {
        logger.error('Error validating answer', error as Error);
        setIsCorrect(false);
        setShowResult(true);
      }
    },
    [currentCard, selectedOptionId, selectedAnswer, userAnswer, attemptTracking],
  );

  const handleSelectAnswer = useCallback(
    async (answer: string) => {
      if (currentCard.kind === CardKind.FillBlank) {
        setSelectedAnswer(answer);
        await handleCheckAnswer();
      }
    },
    [currentCard, handleCheckAnswer],
  );

  const handleAnswerChange = useCallback((answer: string) => {
    setUserAnswer(answer);
  }, []);

  const handleCheckAnswerWrapper = useCallback(
    async (audioUri?: string) => {
      await handleCheckAnswer(undefined, audioUri);
    },
    [handleCheckAnswer],
  );

  const handleNext = useCallback(async () => {
    if (!canProceed) return;

    const isFlashcard = 'isFlashcard' in currentCard && currentCard.isFlashcard;

    // Handle flashcard rating
    if (isFlashcard && flashcardRating !== undefined) {
      const elapsedMs = attemptTracking.cardStartTime
        ? Date.now() - attemptTracking.cardStartTime
        : 0;
      try {
        const awardedXp = await attemptTracking.recordFlashcardRating(
          currentCard,
          flashcardRating,
          elapsedMs,
        );
        attemptTracking.recordAttemptForCard(currentCard, {
          answer: `rating:${flashcardRating}`,
          isCorrect: flashcardRating >= 2.5,
          elapsedMs,
          awardedXp,
        });
      } catch {
        // Continue even if recording fails
      }
    }

    // Handle teaching card completion
    if (currentCard.kind === CardKind.Teach && currentCard.id.startsWith('teach-')) {
      const teachingId = currentCard.id.replace('teach-', '');
      const elapsedMs = attemptTracking.cardStartTime
        ? Date.now() - attemptTracking.cardStartTime
        : 0;
      try {
        await attemptTracking.recordTeachingComplete(teachingId, elapsedMs);
        attemptTracking.recordAttemptForCard(currentCard, {
          answer: 'viewed',
          isCorrect: true,
          elapsedMs,
        });
      } catch {
        // Continue even if recording fails
      }
    }

    // Navigate using hook
    await cardNavigation.handleNext(attemptTracking.attempts);
  }, [canProceed, currentCard, flashcardRating, attemptTracking, cardNavigation]);

  const handleTryAgain = useCallback(() => {
    setShowResult(false);
    setIsCorrect(false);
    setMeaningCorrect(false);
    setNaturalPhrasing(undefined);
    setFeedbackWhy(undefined);
    setAcceptedVariants([]);
    setValidationFeedback(undefined);
    setGrammaticalCorrectness(null);
  }, []);

  // Figma / Professional App Redesign: full-screen gradient (slate-50 → blue-50 → indigo-50)
  const sessionBgGradient = ['#f8fafc', '#eff6ff', '#eef2ff'] as const;

  const footerLabel = isLast ? 'Finish' : 'Continue';

  const isTranslateTextInput =
    (currentCard.kind === CardKind.TranslateToEn ||
      currentCard.kind === CardKind.TranslateFromEn) &&
    !('isFlashcard' in currentCard && currentCard.isFlashcard);
  const showSuggestedAnswer =
    isTranslateTextInput &&
    attemptTracking.incorrectAttemptCount >= INCORRECT_ATTEMPTS_BEFORE_SHOWING_ANSWER;
  const showCorrectAnswer =
    currentCard.kind === CardKind.MultipleChoice &&
    attemptTracking.incorrectAttemptCount >= INCORRECT_ATTEMPTS_BEFORE_SHOWING_ANSWER;

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
          }}
          selectedRating={flashcardRating}
          pronunciationResult={attemptTracking.pronunciationResult}
          isPronunciationProcessing={attemptTracking.isPronunciationProcessing}
          onPracticeAgain={
            isSpeakListening
              ? () => {
                  setShowResult(false);
                }
              : undefined
          }
          incorrectAttemptCount={attemptTracking.incorrectAttemptCount}
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
