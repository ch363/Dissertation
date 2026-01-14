import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/services/theme/tokens';
import { AttemptLog, CardKind, SessionPlan } from '@/types/session';
import { requiresSelection, getDeliveryMethodForCardKind } from '../delivery-methods';
import { validateAnswer } from '@/services/api/progress';
import { CardRenderer } from './CardRenderer';

type Props = {
  plan: SessionPlan;
  onComplete: (attempts: AttemptLog[]) => void;
};

const CardHeader = ({ title }: { title: string }) => <Text style={styles.cardHeader}>{title}</Text>;

export function SessionRunner({ plan, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState<AttemptLog[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | undefined>(undefined);
  const [selectedAnswer, setSelectedAnswer] = useState<string | undefined>(undefined);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const currentCard = plan.cards[index];
  const total = useMemo(() => plan.cards.length, [plan.cards]);

  const isLast = index >= total - 1;
  
  // Determine if we can proceed based on card type
  // For type-based cards, must check answer first (showResult must be true)
  const canProceed =
    currentCard.kind === CardKind.Teach ||
    (currentCard.kind === CardKind.MultipleChoice
      ? showResult && selectedOptionId !== undefined // Must check answer first
      : currentCard.kind === CardKind.FillBlank
        ? selectedAnswer !== undefined
        : currentCard.kind === CardKind.TranslateToEn || currentCard.kind === CardKind.TranslateFromEn
          ? showResult && userAnswer.trim().length > 0 // Must check answer first
          : currentCard.kind === CardKind.Listening
            ? showResult && userAnswer.trim().length > 0 // Must check answer first
            : true);

  const handleSelectOption = (optionId: string) => {
    if (currentCard.kind === CardKind.MultipleChoice) {
      setSelectedOptionId(optionId);
      // Don't set showResult yet - wait for "Check Answer" button
    }
  };

  const handleCheckAnswer = async () => {
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
      let userAnswerValue: string;

      if (currentCard.kind === CardKind.MultipleChoice) {
        if (selectedOptionId === undefined) return;
        userAnswerValue = selectedOptionId;
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

      // Create attempt log with validated score
      const newAttempt: AttemptLog = {
        cardId: currentCard.id,
        attemptNumber: attempts.filter((a) => a.cardId === currentCard.id).length + 1,
        answer: userAnswerValue,
        isCorrect: validationResult.isCorrect,
        elapsedMs: 0,
      };
      setAttempts((prev) => [...prev, newAttempt]);
    } catch (error) {
      console.error('Error validating answer:', error);
      // Fallback: mark as incorrect if validation fails
      setIsCorrect(false);
      setShowResult(true);
    }
  };

  const handleSelectAnswer = (answer: string) => {
    if (currentCard.kind === CardKind.FillBlank) {
      setSelectedAnswer(answer);
      // Don't validate here - wait for "Check Answer" button
      // Validation will happen in handleCheckAnswer
    }
  };

  const handleAnswerChange = (answer: string) => {
    setUserAnswer(answer);
    // Don't validate on change - wait for "Check Answer" button
    // This keeps UI responsive while user types
  };

  const handleNext = async () => {
    if (!canProceed) return;

    // For cards that don't need result screen, validate and create attempt
    let nextAttempts = attempts;
    
    // FillBlank cards validate on "Next" (no separate "Check Answer" button)
    if (
      currentCard.kind === CardKind.FillBlank &&
      selectedAnswer &&
      !attempts.some((a) => a.cardId === currentCard.id)
    ) {
      // Validate via backend
      if (currentCard.id.startsWith('question-')) {
        const questionId = currentCard.id.replace('question-', '');
        const deliveryMethod = getDeliveryMethodForCardKind(currentCard.kind);
        
        try {
          const validationResult = await validateAnswer(questionId, selectedAnswer, deliveryMethod);
          const newAttempt: AttemptLog = {
            cardId: currentCard.id,
            attemptNumber: 1,
            answer: selectedAnswer,
            isCorrect: validationResult.isCorrect,
            elapsedMs: 0,
          };
          nextAttempts = [...attempts, newAttempt];
          setAttempts(nextAttempts);
        } catch (error) {
          console.error('Error validating FillBlank answer:', error);
          // Fallback: mark as incorrect if validation fails
          const newAttempt: AttemptLog = {
            cardId: currentCard.id,
            attemptNumber: 1,
            answer: selectedAnswer,
            isCorrect: false,
            elapsedMs: 0,
          };
          nextAttempts = [...attempts, newAttempt];
          setAttempts(nextAttempts);
        }
      } else {
        // Fallback if card ID format is unexpected
        const newAttempt: AttemptLog = {
          cardId: currentCard.id,
          attemptNumber: 1,
          answer: selectedAnswer,
          isCorrect: false,
          elapsedMs: 0,
        };
        nextAttempts = [...attempts, newAttempt];
        setAttempts(nextAttempts);
      }
    } else if (
      currentCard.kind === CardKind.Teach &&
      !attempts.some((a) => a.cardId === currentCard.id)
    ) {
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
      onComplete(nextAttempts);
    } else {
      // Reset state for next card
      setIndex((i) => i + 1);
      setSelectedOptionId(undefined);
      setSelectedAnswer(undefined);
      setUserAnswer('');
      setShowResult(false);
      setIsCorrect(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CardHeader title={`${plan.title ?? 'Session'} • ${index + 1}/${total}`} />
      </View>

      <View style={styles.cardArea}>
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
          onCheckAnswer={handleCheckAnswer}
        />
      </View>

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
  },
  header: {
    paddingBottom: theme.spacing.md,
  },
  cardArea: {
    flex: 1,
    minHeight: 0, // critical: allow children to shrink instead of pushing footer off-screen
  },
  footer: {
    paddingTop: theme.spacing.md,
  },
  cardHeader: {
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
    color: theme.colors.text,
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
