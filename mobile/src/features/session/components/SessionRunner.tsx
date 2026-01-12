import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getTtsEnabled, getTtsRate } from '@/services/preferences';
import { theme } from '@/services/theme/tokens';
import * as SafeSpeech from '@/services/tts';
import { AttemptLog, Card, CardKind, SessionPlan } from '@/types/session';

type Props = {
  plan: SessionPlan;
  onComplete: (attempts: AttemptLog[]) => void;
};

const CardHeader = ({ title }: { title: string }) => <Text style={styles.cardHeader}>{title}</Text>;

type CardBodyProps = {
  card: Card;
  selectedOptionId?: string;
  onSelectOption?: (optionId: string) => void;
};

function renderCardBody({ card, selectedOptionId, onSelectOption }: CardBodyProps) {
  switch (card.kind) {
    case CardKind.Teach: {
      const handleSpeak = async () => {
        try {
          const enabled = await getTtsEnabled();
          if (!enabled) return;
          const rate = await getTtsRate();
          await SafeSpeech.stop();
          await SafeSpeech.speak(card.content.phrase, { language: 'it-IT', rate });
        } catch {
          // no-op
        }
      };

      return (
        <View style={styles.teachContainer}>
          {/* Main Teach Card - Light Blue */}
          <View style={styles.teachCard}>
            {card.content.emoji ? (
              <Text style={styles.teachEmoji}>{card.content.emoji}</Text>
            ) : null}
            <Text style={styles.teachPhrase}>{card.content.phrase}</Text>
            {card.content.translation ? (
              <Text style={styles.teachTranslation}>{card.content.translation}</Text>
            ) : null}
            <Pressable style={styles.speakerButton} onPress={handleSpeak}>
              <Ionicons name="volume-high" size={24} color="#fff" />
            </Pressable>
          </View>

          {/* Usage Note Card - Light Green */}
          {card.content.usageNote ? (
            <View style={styles.usageNoteCard}>
              <Ionicons name="book-outline" size={20} color="#28a745" />
              <View style={styles.usageNoteContent}>
                <Text style={styles.usageNoteTitle}>Usage Note</Text>
                <Text style={styles.usageNoteText}>{card.content.usageNote}</Text>
              </View>
            </View>
          ) : null}
        </View>
      );
    }
    case CardKind.MultipleChoice:
      return (
        <View style={styles.body}>
          <Text style={styles.prompt}>{card.prompt}</Text>
          {card.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const isCorrect = opt.id === card.correctOptionId;
            return (
              <Pressable
                key={opt.id}
                onPress={() => onSelectOption?.(opt.id)}
                style={[
                  styles.option,
                  isSelected && (isCorrect ? styles.optionCorrect : styles.optionWrong),
                ]}
              >
                <Text style={styles.optionLabel}>{opt.label}</Text>
              </Pressable>
            );
          })}
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
  const [selectedOptionId, setSelectedOptionId] = useState<string | undefined>(undefined);

  const currentCard = plan.cards[index];
  const total = useMemo(() => plan.cards.length, [plan.cards]);

  const isLast = index >= total - 1;
  const canProceed =
    currentCard.kind === CardKind.Teach ||
    currentCard.kind === CardKind.FillBlank ||
    currentCard.kind === CardKind.TranslateToEn ||
    currentCard.kind === CardKind.TranslateFromEn ||
    currentCard.kind === CardKind.Listening ||
    (currentCard.kind === CardKind.MultipleChoice && selectedOptionId !== undefined);

  const handleSelectOption = (optionId: string) => {
    if (currentCard.kind === CardKind.MultipleChoice) {
      setSelectedOptionId(optionId);
      const isCorrect = optionId === currentCard.correctOptionId;
      const newAttempt: AttemptLog = {
        cardId: currentCard.id,
        attemptNumber: attempts.filter((a) => a.cardId === currentCard.id).length + 1,
        answer: optionId,
        isCorrect,
        elapsedMs: 0,
      };
      setAttempts((prev) => [...prev, newAttempt]);
    }
  };

  const handleNext = () => {
    if (!canProceed) return;

    // For non-MCQ cards, create a placeholder attempt
    let nextAttempts = attempts;
    if (currentCard.kind !== CardKind.MultipleChoice) {
      const newAttempt: AttemptLog = {
        cardId: currentCard.id,
        attemptNumber: attempts.filter((a) => a.cardId === currentCard.id).length + 1,
        answer: 'completed',
        isCorrect: true,
        elapsedMs: 0,
      };
      nextAttempts = [...attempts, newAttempt];
      setAttempts(nextAttempts);
    }

    if (isLast) {
      onComplete(nextAttempts);
    } else {
      setIndex((i) => i + 1);
      setSelectedOptionId(undefined);
    }
  };

  return (
    <View style={styles.container}>
      <CardHeader title={`${plan.title ?? 'Session'} • ${index + 1}/${total}`} />
      {currentCard.kind === CardKind.Teach ? (
        // Teach cards render their own container (with usage note card)
        renderCardBody({
          card: currentCard,
          selectedOptionId,
          onSelectOption: handleSelectOption,
        })
      ) : (
        // Other card types use the standard card container
        <View style={styles.card}>
          {renderCardBody({
            card: currentCard,
            selectedOptionId,
            onSelectOption: handleSelectOption,
          })}
        </View>
      )}
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
  optionCorrect: {
    borderColor: '#28a745',
    backgroundColor: '#d4edda',
  },
  optionWrong: {
    borderColor: '#dc3545',
    backgroundColor: '#f8d7da',
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
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonLabel: {
    color: '#fff',
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
  },
  teachContainer: {
    gap: theme.spacing.md,
  },
  teachCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 24,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 200,
    justifyContent: 'center',
  },
  teachEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.xs,
  },
  teachPhrase: {
    fontFamily: theme.typography.bold,
    fontSize: 32,
    color: theme.colors.text,
    textAlign: 'center',
  },
  teachTranslation: {
    fontFamily: theme.typography.regular,
    fontSize: 18,
    color: theme.colors.text,
    textAlign: 'center',
  },
  speakerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  usageNoteCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: theme.spacing.md,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  usageNoteContent: {
    flex: 1,
    gap: 4,
  },
  usageNoteTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
    color: '#28a745',
  },
  usageNoteText: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: '#2e7d32',
    lineHeight: 20,
  },
});
