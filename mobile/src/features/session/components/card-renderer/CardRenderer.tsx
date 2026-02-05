/**
 * Card Renderer
 *
 * Central registry for rendering cards based on CardKind.
 * Uses a registry pattern for Open/Closed Principle compliance.
 * 
 * Props follow Interface Segregation Principle - each card type receives
 * only the props it needs via focused interfaces defined in types.ts
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
import { LegacyCardRendererProps } from './types';

import { theme } from '@/services/theme/tokens';
import { CardKind } from '@/types/session';

/** Registry of card components by kind */
const CARD_REGISTRY = new Map<CardKind, React.ComponentType<any>>([
  [CardKind.Teach, TeachCard],
  [CardKind.MultipleChoice, MultipleChoiceCard],
  [CardKind.FillBlank, FillBlankCard],
  [CardKind.TranslateToEn, TranslateCard],
  [CardKind.TranslateFromEn, TranslateCard],
  [CardKind.Listening, ListeningCard],
]);

// Using LegacyCardRendererProps for backward compatibility
// TODO: Migrate to focused interfaces once SessionRunner is refactored
type Props = LegacyCardRendererProps;

export function CardRenderer(props: Props) {
  const { card } = props;
  
  // Get component from registry
  const Component = CARD_REGISTRY.get(card.kind);
  
  if (!Component) {
    console.warn(`No component registered for card kind: ${card.kind}`);
    return null;
  }

  // Teach cards render their own container (with usage note card)
  if (card.kind === CardKind.Teach) {
    return <Component card={card} />;
  }

  // All other card types use the standard card container
  return (
    <View style={styles.card}>
      {renderCardWithProps(card.kind, props, Component)}
    </View>
  );
}

/**
 * Map card kind to appropriate props and render component.
 * This function extracts the relevant props for each card type.
 */
function renderCardWithProps(
  cardKind: CardKind,
  props: Props,
  Component: React.ComponentType<any>,
) {
  const {
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
  } = props;

  // Extract props based on card kind
  switch (cardKind) {
    case CardKind.MultipleChoice:
      return (
        <Component
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
        <Component
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
        <Component
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
        <Component
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
