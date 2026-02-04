/**
 * Card Renderer
 *
 * Central registry for rendering cards based on CardKind.
 * This is the single place where CardKind maps to React components.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

import {
  TeachCard,
  MultipleChoiceCard,
  FillBlankCard,
  TranslateCard,
  ListeningCard,
} from '../cards';

import { theme } from '@/services/theme/tokens';
import { Card, CardKind, PronunciationResult } from '@/types/session';

type Props = {
  card: Card;
  selectedOptionId?: string;
  onSelectOption?: (optionId: string) => void;
  selectedAnswer?: string;
  onSelectAnswer?: (answer: string) => void;
  userAnswer?: string;
  onAnswerChange?: (answer: string) => void;
  showResult?: boolean;
  isCorrect?: boolean;
  grammaticalCorrectness?: number | null;
  meaningCorrect?: boolean;
  naturalPhrasing?: string;
  feedbackWhy?: string;
  acceptedVariants?: string[];
  validationFeedback?: string;
  showHint?: boolean;
  showSuggestedAnswer?: boolean;
  showCorrectAnswer?: boolean;
  onCheckAnswer?: (audioUri?: string) => void;
  onContinue?: () => void;
  onTryAgain?: () => void;
  onRating?: (rating: number) => void;
  selectedRating?: number;
  pronunciationResult?: PronunciationResult | null;
  isPronunciationProcessing?: boolean;
  onPracticeAgain?: () => void;
  incorrectAttemptCount?: number;
};

export function CardRenderer({
  card,
  selectedOptionId,
  onSelectOption,
  selectedAnswer,
  onSelectAnswer,
  userAnswer,
  onAnswerChange,
  showResult,
  isCorrect,
  grammaticalCorrectness,
  meaningCorrect,
  naturalPhrasing,
  feedbackWhy,
  acceptedVariants,
  validationFeedback,
  showHint,
  showSuggestedAnswer,
  showCorrectAnswer,
  onCheckAnswer,
  onContinue,
  onTryAgain,
  onRating,
  selectedRating,
  pronunciationResult,
  isPronunciationProcessing,
  onPracticeAgain,
  incorrectAttemptCount,
}: Props) {
  // Teach cards render their own container (with usage note card)
  if (card.kind === CardKind.Teach) {
    return <TeachCard card={card} />;
  }

  // All other card types use the standard card container
  return (
    <View style={styles.card}>
      {renderCardByKind(
        card,
        selectedOptionId,
        onSelectOption,
        selectedAnswer,
        onSelectAnswer,
        userAnswer,
        onAnswerChange,
        showResult,
        isCorrect,
        grammaticalCorrectness,
        meaningCorrect,
        naturalPhrasing,
        feedbackWhy,
        acceptedVariants,
        validationFeedback,
        showHint,
        showSuggestedAnswer,
        showCorrectAnswer,
        onCheckAnswer,
        onContinue,
        onTryAgain,
        onRating,
        selectedRating,
        pronunciationResult,
        isPronunciationProcessing,
        onPracticeAgain,
        incorrectAttemptCount,
      )}
    </View>
  );
}

function renderCardByKind(
  card: Card,
  selectedOptionId?: string,
  onSelectOption?: (optionId: string) => void,
  selectedAnswer?: string,
  onSelectAnswer?: (answer: string) => void,
  userAnswer?: string,
  onAnswerChange?: (answer: string) => void,
  showResult?: boolean,
  isCorrect?: boolean,
  grammaticalCorrectness?: number | null,
  meaningCorrect?: boolean,
  naturalPhrasing?: string,
  feedbackWhy?: string,
  acceptedVariants?: string[],
  validationFeedback?: string,
  showHint?: boolean,
  showSuggestedAnswer?: boolean,
  showCorrectAnswer?: boolean,
  onCheckAnswer?: (audioUri?: string) => void,
  onContinue?: () => void,
  onTryAgain?: () => void,
  onRating?: (rating: number) => void,
  selectedRating?: number,
  pronunciationResult?: PronunciationResult | null,
  isPronunciationProcessing?: boolean,
  onPracticeAgain?: () => void,
  incorrectAttemptCount?: number,
) {
  switch (card.kind) {
    case CardKind.MultipleChoice:
      return (
        <MultipleChoiceCard
          card={card}
          selectedOptionId={selectedOptionId}
          onSelectOption={onSelectOption}
          showResult={showResult}
          isCorrect={isCorrect}
          showCorrectAnswer={showCorrectAnswer}
          onCheckAnswer={onCheckAnswer}
          onTryAgain={onTryAgain}
          incorrectAttemptCount={incorrectAttemptCount}
        />
      );
    case CardKind.FillBlank:
      return (
        <FillBlankCard
          card={card}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={onSelectAnswer}
          showResult={showResult}
          isCorrect={isCorrect}
          grammaticalCorrectness={grammaticalCorrectness}
        />
      );
    case CardKind.TranslateToEn:
    case CardKind.TranslateFromEn:
      return (
        <TranslateCard
          card={card}
          userAnswer={userAnswer}
          onAnswerChange={onAnswerChange}
          showHint={showHint}
          showResult={showResult}
          isCorrect={isCorrect}
          grammaticalCorrectness={grammaticalCorrectness}
          meaningCorrect={meaningCorrect}
          naturalPhrasing={naturalPhrasing}
          feedbackWhy={feedbackWhy}
          acceptedVariants={acceptedVariants}
          validationFeedback={validationFeedback}
          showSuggestedAnswer={showSuggestedAnswer}
          onCheckAnswer={onCheckAnswer}
          onTryAgain={onTryAgain}
          onRating={onRating}
          selectedRating={selectedRating}
          incorrectAttemptCount={incorrectAttemptCount}
        />
      );
    case CardKind.Listening:
      return (
        <ListeningCard
          card={card}
          userAnswer={userAnswer}
          onAnswerChange={onAnswerChange}
          showResult={showResult}
          isCorrect={isCorrect}
          grammaticalCorrectness={grammaticalCorrectness}
          onCheckAnswer={onCheckAnswer}
          onContinue={onContinue}
          pronunciationResult={pronunciationResult}
          isPronunciationProcessing={isPronunciationProcessing}
          onPracticeAgain={onPracticeAgain}
        />
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 0,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    gap: theme.spacing.sm,
  },
});
