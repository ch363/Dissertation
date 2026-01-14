/**
 * Card Renderer
 * 
 * Central registry for rendering cards based on CardKind.
 * This is the single place where CardKind maps to React components.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

import { theme } from '@/services/theme/tokens';
import { Card, CardKind } from '@/types/session';
import {
  TeachCard,
  MultipleChoiceCard,
  FillBlankCard,
  TranslateCard,
  ListeningCard,
} from './cards';

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
  showHint?: boolean;
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
  showHint,
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
        showHint,
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
  showHint?: boolean,
) {
  switch (card.kind) {
    case CardKind.MultipleChoice:
      return (
        <MultipleChoiceCard
          card={card}
          selectedOptionId={selectedOptionId}
          onSelectOption={onSelectOption}
        />
      );
    case CardKind.FillBlank:
      return (
        <FillBlankCard
          card={card}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={onSelectAnswer}
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
        />
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  card: {
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
