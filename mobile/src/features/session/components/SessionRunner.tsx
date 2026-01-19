import { router } from 'expo-router';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@/services/theme/tokens';
import { AttemptLog, CardKind, SessionPlan, SessionKind } from '@/types/session';
import { requiresSelection, getDeliveryMethodForCardKind } from '../delivery-methods';
import { validateAnswer, validatePronunciation, recordQuestionAttempt, completeTeaching, updateDeliveryMethodScore } from '@/services/api/progress';
import { PronunciationResult } from '@/types/session';
import * as SpeechRecognition from '@/services/speech-recognition';
import { CardRenderer } from './CardRenderer';
import { LessonProgressHeader } from './LessonProgressHeader';
import { routeBuilders } from '@/services/navigation/routes';
import { clearCachedSessionPlan } from '@/services/api/session-plan-cache';

// Lazy load haptics to avoid crashing if module isn't installed
let HapticsModule: typeof import('expo-haptics') | null = null;

async function getHapticsModule() {
  if (!HapticsModule) {
    try {
      HapticsModule = await import('expo-haptics');
    } catch (error) {
      console.debug('expo-haptics not available, haptic feedback disabled:', error);
      // Return null - haptics will be skipped gracefully
    }
  }
  return HapticsModule;
}

/**
 * Trigger haptic feedback if available
 */
async function triggerHaptic(style: 'light' | 'medium') {
  try {
    const Haptics = await getHapticsModule();
    if (!Haptics) return;
    
    const feedbackStyle = style === 'light' 
      ? Haptics.ImpactFeedbackStyle.Light 
      : Haptics.ImpactFeedbackStyle.Medium;
    await Haptics.impactAsync(feedbackStyle);
  } catch (error) {
    // Silently fail - haptics are non-critical
    console.debug('Haptic feedback failed:', error);
  }
}

type Props = {
  plan: SessionPlan;
  sessionId: string;
  kind: SessionKind;
  lessonId?: string;
  planMode?: 'learn' | 'review' | 'mixed';
  timeBudgetSec?: number | null;
  onComplete: (attempts: AttemptLog[]) => void;
};

export function SessionRunner({ plan, sessionId, kind, lessonId, planMode, timeBudgetSec, onComplete }: Props) {
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
  const [audioRecordingUri, setAudioRecordingUri] = useState<string | null>(null);
  const [awardedXpByCard, setAwardedXpByCard] = useState<Map<string, number>>(new Map());
  const [showRationale, setShowRationale] = useState(false);

  const currentCard = plan.cards[index];
  const total = useMemo(() => plan.cards.length, [plan.cards]);
  const currentRationale = currentCard?.rationale?.trim();
  const hasRationale = !!currentRationale;

  const invalidateLessonPlanCache = () => {
    // Only applicable to learn sessions with a real lessonId.
    // This prevents reuse of a cached/preloaded plan after progress writes.
    if (kind !== 'learn') return;
    if (!lessonId || lessonId === 'demo') return;
    clearCachedSessionPlan(lessonId);
  };

  // Track when card is shown for time tracking
  useEffect(() => {
    if (currentCard && currentCard.kind !== CardKind.Teach) {
      setCardStartTime(Date.now());
    } else {
      setCardStartTime(null);
    }
    // Reset pronunciation result when card changes
    setPronunciationResult(null);
    setAudioRecordingUri(null);
    setShowRationale(false);
  }, [index, currentCard]);

  const isLast = index >= total - 1;
  
  // Determine if we can proceed based on card type
  // For type-based cards, must check answer first (showResult must be true)
  const isTranslationMCQ = currentCard.kind === CardKind.MultipleChoice && 
    'sourceText' in currentCard && !!currentCard.sourceText;
  
  // Check if current card is a flashcard
  const isFlashcard = 'isFlashcard' in currentCard && currentCard.isFlashcard;
  
  const canProceed =
    currentCard.kind === CardKind.Teach ||
    (currentCard.kind === CardKind.MultipleChoice
      ? isTranslationMCQ 
        ? showResult && selectedOptionId !== undefined // Translation MCQ: auto-checked, need result
        : showResult && selectedOptionId !== undefined // Regular MCQ: Must check answer first
      : currentCard.kind === CardKind.FillBlank
        ? showResult && isCorrect && selectedAnswer !== undefined // Must have correct answer selected
        : currentCard.kind === CardKind.TranslateToEn || currentCard.kind === CardKind.TranslateFromEn
          ? isFlashcard
            ? flashcardRating !== undefined // Flashcard: need rating
            : showResult && userAnswer.trim().length > 0 // Type translation: Must check answer first
          : currentCard.kind === CardKind.Listening
            ? showResult && userAnswer.trim().length > 0 // Must check answer first
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
        await handleCheckAnswer(optionId, undefined, false);
      }
      // For regular MCQ, wait for "Check Answer" button
    }
  };

  const handleCheckAnswer = async (optionIdOverride?: string, audioUri?: string) => {
    // Only validate practice cards (not teach cards)
    if (currentCard.kind === CardKind.Teach) {
      return;
    }

    // Extract questionId from cardId (format: "question-${questionId}")
    if (!currentCard.id.startsWith('question-')) {
      console.warn('Card ID does not start with "question-":', currentCard.id);
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
        // Handle pronunciation validation
        console.log('🎤 Processing pronunciation recording:', { audioUri, questionId });
        setAudioRecordingUri(audioUri);
        const audioFile = await SpeechRecognition.getAudioFile(audioUri);
        if (!audioFile?.base64) {
          console.error('❌ Failed to get audio file for pronunciation validation');
          setIsCorrect(false);
          setShowResult(true);
          return;
        }

        const audioFormat = audioRecordingUri.endsWith('.m4a') ? 'm4a' : 
                          audioRecordingUri.endsWith('.flac') ? 'flac' : 'wav';
        
        console.log('✅ Audio file loaded:', { 
          format: audioFormat, 
          base64Length: audioFile.base64.length,
          uri: audioFile.uri 
        });
        
        const pronunciationResponse = await validatePronunciation(questionId, audioFile.base64, audioFormat);
        console.log('✅ Pronunciation response received:', {
          isCorrect: pronunciationResponse.isCorrect,
          overallScore: pronunciationResponse.overallScore,
          transcription: pronunciationResponse.transcription
        });
        setPronunciationResult(pronunciationResponse);
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
            });
            awardedXp = attemptResponse.awardedXp;
            invalidateLessonPlanCache();

            const delta = pronunciationResponse.isCorrect ? 0.1 : -0.05;
            try {
              await updateDeliveryMethodScore(deliveryMethod, { delta });
            } catch (error) {
              console.error('Error updating delivery method score:', error);
            }

            setRecordedAttempts((prev) => new Set(prev).add(currentCard.id));
          } catch (error) {
            console.error('Error recording question attempt:', error);
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

      setIsCorrect(validationResult.isCorrect);
      setShowResult(true);
      
      // Haptic feedback based on correctness
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
          const attemptResponse = await recordQuestionAttempt(questionId, {
            deliveryMethod,
            score: validationResult.score,
            timeToComplete,
            percentageAccuracy: validationResult.isCorrect ? 100 : 0,
            attempts: attemptNumber,
          });
          awardedXp = attemptResponse.awardedXp;
          invalidateLessonPlanCache();

          // Update delivery method score based on performance
          const delta = validationResult.isCorrect ? 0.1 : -0.05;
          try {
            await updateDeliveryMethodScore(deliveryMethod, { delta });
          } catch (error) {
            console.error('Error updating delivery method score:', error);
            // Continue even if this fails
          }

          setRecordedAttempts((prev) => new Set(prev).add(currentCard.id));
        } catch (error) {
          console.error('Error recording question attempt:', error);
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
      console.error('Error validating answer:', error);
      // Fallback: mark as incorrect if validation fails
      setIsCorrect(false);
      setShowResult(true);
      triggerHaptic('medium');
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
              const attemptResponse = await recordQuestionAttempt(questionId, {
                deliveryMethod,
                score: validationResult.score,
                timeToComplete,
                percentageAccuracy: validationResult.isCorrect ? 100 : 0,
                attempts: attemptNumber,
              });
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
                console.error('Error updating delivery method score:', error);
                // Continue even if this fails
              }

              setRecordedAttempts((prev) => new Set(prev).add(currentCard.id));
            } catch (error) {
              console.error('Error recording question attempt:', error);
              // Continue even if API call fails
            }
          }
          
          // If correct, we can proceed immediately
          // If incorrect, user must select correct answer
        } catch (error) {
          console.error('Error validating FillBlank answer:', error);
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
          });
          awardedXp = attemptResponse.awardedXp;
          invalidateLessonPlanCache();

          // Update delivery method score based on performance
          const delta = isCorrect ? 0.1 : -0.05;
          try {
            await updateDeliveryMethodScore(deliveryMethod, { delta });
          } catch (error) {
            console.error('Error updating delivery method score:', error);
            // Continue even if this fails
          }

          setRecordedAttempts((prev) => new Set(prev).add(currentCard.id));
        } catch (error) {
          console.error('Error recording flashcard rating:', error);
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
      // Extract teachingId from cardId (format: "teach-${teachingId}")
      if (currentCard.id.startsWith('teach-')) {
        const teachingId = currentCard.id.replace('teach-', '');
        try {
          await completeTeaching(teachingId);
          invalidateLessonPlanCache();
        } catch (error) {
          console.error('Error completing teaching:', error);
          // Continue even if API call fails
        }
      }

      const newAttempt: AttemptLog = {
        cardId: currentCard.id,
        attemptNumber: 1,
        answer: 'viewed',
        isCorrect: true,
        elapsedMs: 0,
      };
      nextAttempts = [...attempts, newAttempt];
      setAttempts(nextAttempts);
    }

    if (isLast) {
      // Calculate XP and teachings mastered for completion screen
      // Sum awardedXp from backend responses instead of calculating
      const totalXp = nextAttempts
        .filter((a) => a.awardedXp !== undefined)
        .reduce((sum, attempt) => sum + (attempt.awardedXp || 0), 0);
      const teachingsMastered = plan.cards.filter((card) => card.kind === CardKind.Teach).length;

      // Navigate to completion screen
      router.replace({
        pathname: routeBuilders.sessionCompletion(sessionId),
        params: {
          kind,
          lessonId,
          planMode: planMode ?? '',
          timeBudgetSec: timeBudgetSec ? String(timeBudgetSec) : '',
          totalXp: totalXp.toString(),
          teachingsMastered: teachingsMastered.toString(),
        },
      });

      // Still call onComplete for backwards compatibility (though it may not be used)
      onComplete(nextAttempts);
    } else {
      // Reset state for next card
      setIndex((i) => i + 1);
      setSelectedOptionId(undefined);
      setSelectedAnswer(undefined);
      setUserAnswer('');
      setShowResult(false);
      setIsCorrect(false);
      setFlashcardRating(undefined);
      setCardStartTime(null);
    }
  };

  const handleBack = () => {
    if (index > 0) {
      // Go to previous card and reset per-card state
      setIndex((i) => Math.max(0, i - 1));
      setSelectedOptionId(undefined);
      setSelectedAnswer(undefined);
      setUserAnswer('');
      setShowResult(false);
      setIsCorrect(false);
      setFlashcardRating(undefined);
      setCardStartTime(null);
      return;
    }

    // First card: exit session
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LessonProgressHeader
          title={plan.title ?? 'Course'}
          current={index + 1}
          total={total}
          onBackPress={handleBack}
        />

        {hasRationale ? (
          <View style={styles.rationaleContainer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Why am I seeing this?"
              onPress={() => setShowRationale((s) => !s)}
              hitSlop={10}
              style={styles.whyButton}
            >
              <Ionicons
                name={showRationale ? 'information-circle' : 'information-circle-outline'}
                size={16}
                color={theme.colors.mutedText}
              />
              <Text style={styles.whyButtonText}>{showRationale ? 'Hide why' : 'Why this?'}</Text>
            </Pressable>

            {showRationale ? (
              <View style={styles.rationalePanel}>
                <Text style={styles.rationaleText}>{currentRationale}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <ScrollView 
        style={styles.cardArea} 
        contentContainerStyle={styles.cardAreaContent}
        showsVerticalScrollIndicator={false}
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
          onCheckAnswer={handleCheckAnswerWrapper}
          onRating={(rating) => {
            console.log('SessionRunner: Rating received:', rating);
            setFlashcardRating(rating);
            console.log('SessionRunner: flashcardRating state updated to:', rating);
          }}
          selectedRating={flashcardRating}
          pronunciationResult={pronunciationResult}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.primaryButton, !canProceed && styles.primaryButtonDisabled]}
          onPress={handleNext}
          disabled={!canProceed}
        >
          <Text style={styles.primaryButtonLabel}>
            {currentCard.kind === CardKind.Teach && !isLast
              ? 'Start Practice'
              : isLast
                ? 'Finish'
                : 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingBottom: theme.spacing.md,
  },
  rationaleContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  whyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.card,
  },
  whyButtonText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 13,
    color: theme.colors.mutedText,
  },
  rationalePanel: {
    width: '100%',
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  rationaleText: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    textAlign: 'center',
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
    paddingTop: theme.spacing.xs, // Minimal padding to fit everything on screen
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonLabel: {
    color: '#fff',
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
  },
});
