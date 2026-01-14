import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/services/theme/tokens';
import { AttemptLog, CardKind, SessionPlan } from '@/types/session';
import { requiresSelection } from '../delivery-methods';
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
  const canProceed =
    currentCard.kind === CardKind.Teach ||
    (currentCard.kind === CardKind.MultipleChoice
      ? selectedOptionId !== undefined
      : currentCard.kind === CardKind.FillBlank
        ? selectedAnswer !== undefined
        : currentCard.kind === CardKind.TranslateToEn || currentCard.kind === CardKind.TranslateFromEn
          ? userAnswer.trim().length > 0
          : currentCard.kind === CardKind.Listening
            ? showResult || userAnswer.trim().length > 0
            : true);

  const handleSelectOption = (optionId: string) => {
    if (currentCard.kind === CardKind.MultipleChoice) {
      setSelectedOptionId(optionId);
      const correct = optionId === currentCard.correctOptionId;
      setIsCorrect(correct);
      setShowResult(true);
      const newAttempt: AttemptLog = {
        cardId: currentCard.id,
        attemptNumber: attempts.filter((a) => a.cardId === currentCard.id).length + 1,
        answer: optionId,
        isCorrect: correct,
        elapsedMs: 0,
      };
      setAttempts((prev) => [...prev, newAttempt]);
    }
  };

  const handleSelectAnswer = (answer: string) => {
    if (currentCard.kind === CardKind.FillBlank) {
      setSelectedAnswer(answer);
      const correct = answer.toLowerCase().trim() === currentCard.answer.toLowerCase().trim();
      setIsCorrect(correct);
    }
  };

  const handleAnswerChange = (answer: string) => {
    setUserAnswer(answer);
    if (currentCard.kind === CardKind.TranslateToEn || currentCard.kind === CardKind.TranslateFromEn) {
      const correct = answer.toLowerCase().trim() === currentCard.expected.toLowerCase().trim();
      setIsCorrect(correct);
    } else if (currentCard.kind === CardKind.Listening) {
      const correct = answer.toLowerCase().trim() === currentCard.expected.toLowerCase().trim();
      setIsCorrect(correct);
    }
  };

  const handleNext = () => {
    if (!canProceed) return;

    // Show result for input-based cards before proceeding
    if (
      (currentCard.kind === CardKind.TranslateToEn ||
        currentCard.kind === CardKind.TranslateFromEn ||
        currentCard.kind === CardKind.Listening) &&
      !showResult &&
      userAnswer.trim().length > 0
    ) {
      setShowResult(true);
      const correct =
        currentCard.kind === CardKind.Listening
          ? userAnswer.toLowerCase().trim() === currentCard.expected.toLowerCase().trim()
          : userAnswer.toLowerCase().trim() === currentCard.expected.toLowerCase().trim();
      setIsCorrect(correct);
      const newAttempt: AttemptLog = {
        cardId: currentCard.id,
        attemptNumber: attempts.filter((a) => a.cardId === currentCard.id).length + 1,
        answer: userAnswer,
        isCorrect: correct,
        elapsedMs: 0,
      };
      setAttempts((prev) => [...prev, newAttempt]);
      return;
    }

    // For cards that don't need result screen, create attempt immediately
    let nextAttempts = attempts;
    if (
      currentCard.kind === CardKind.FillBlank &&
      selectedAnswer &&
      !attempts.some((a) => a.cardId === currentCard.id)
    ) {
      const correct = selectedAnswer.toLowerCase().trim() === currentCard.answer.toLowerCase().trim();
      const newAttempt: AttemptLog = {
        cardId: currentCard.id,
        attemptNumber: 1,
        answer: selectedAnswer,
        isCorrect: correct,
        elapsedMs: 0,
      };
      nextAttempts = [...attempts, newAttempt];
      setAttempts(nextAttempts);
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
      <CardHeader title={`${plan.title ?? 'Session'} • ${index + 1}/${total}`} />
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
      />
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
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
