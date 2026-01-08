import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/services/theme/tokens';
import { AttemptLog, Card, CardKind, SessionPlan } from '@/types/session';

type Props = {
  plan: SessionPlan;
  onComplete: (attempts: AttemptLog[]) => void;
};

const CardHeader = ({ title }: { title: string }) => <Text style={styles.cardHeader}>{title}</Text>;

function renderCardBody(card: Card) {
  switch (card.kind) {
    case CardKind.Teach:
      return (
        <View style={styles.body}>
          <Text style={styles.prompt}>{card.content.phrase}</Text>
          {card.content.translation ? (
            <Text style={styles.subtle}>{card.content.translation}</Text>
          ) : null}
        </View>
      );
    case CardKind.MultipleChoice:
      return (
        <View style={styles.body}>
          <Text style={styles.prompt}>{card.prompt}</Text>
          {card.options.map((opt) => (
            <View key={opt.id} style={styles.option}>
              <Text style={styles.optionLabel}>{opt.label}</Text>
            </View>
          ))}
        </View>
      );
    case CardKind.FillBlank:
      return (
        <View style={styles.body}>
          <Text style={styles.prompt}>{card.prompt}</Text>
          <Text style={styles.subtle}>{card.text}</Text>
        </View>
      );
    case CardKind.TranslateToEn:
    case CardKind.TranslateFromEn:
      return (
        <View style={styles.body}>
          <Text style={styles.prompt}>{card.prompt}</Text>
          <Text style={styles.subtle}>{card.source}</Text>
        </View>
      );
    case CardKind.Listening:
      return (
        <View style={styles.body}>
          <Text style={styles.prompt}>{card.prompt}</Text>
          <Text style={styles.subtle}>Audio: {card.audioUrl}</Text>
        </View>
      );
    default:
      return null;
  }
}

export function SessionRunner({ plan, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState<AttemptLog[]>([]);

  const currentCard = plan.cards[index];
  const total = useMemo(() => plan.cards.length, [plan.cards]);

  const isLast = index >= total - 1;

  const handleNext = () => {
    const newAttempt: AttemptLog = {
      cardId: currentCard.id,
      attemptNumber: attempts.filter((a) => a.cardId === currentCard.id).length + 1,
      answer: 'placeholder',
      isCorrect: true,
      elapsedMs: 0,
    };
    const nextAttempts = [...attempts, newAttempt];
    setAttempts(nextAttempts);
    if (isLast) {
      onComplete(nextAttempts);
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <View style={styles.container}>
      <CardHeader title={`${plan.title ?? 'Session'} • ${index + 1}/${total}`} />
      <View style={styles.card}>{renderCardBody(currentCard)}</View>
      <Pressable style={styles.primaryButton} onPress={handleNext}>
        <Text style={styles.primaryButtonLabel}>{isLast ? 'Finish' : 'Next'}</Text>
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
  body: {
    gap: theme.spacing.xs,
  },
  prompt: {
    fontFamily: theme.typography.semiBold,
    fontSize: 18,
    color: theme.colors.text,
  },
  subtle: {
    fontFamily: theme.typography.regular,
    color: theme.colors.mutedText,
  },
  option: {
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  optionLabel: {
    fontFamily: theme.typography.regular,
    color: theme.colors.text,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
  },
  primaryButtonLabel: {
    color: '#fff',
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
  },
});
