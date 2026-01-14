import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/services/theme/tokens';
import { MultipleChoiceCard as MultipleChoiceCardType } from '@/types/session';

type Props = {
  card: MultipleChoiceCardType;
  selectedOptionId?: string;
  onSelectOption?: (optionId: string) => void;
};

export function MultipleChoiceCard({ card, selectedOptionId, onSelectOption }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayAudio = async () => {
    if (!card.audioUrl) return;
    setIsPlaying(true);
    // TODO: Implement audio playback
    setTimeout(() => setIsPlaying(false), 1000);
  };

  const isTranslation = !!card.sourceText;

  return (
    <View style={styles.container}>
      {isTranslation && (
        <Text style={styles.instruction}>TRANSLATE THIS SENTENCE</Text>
      )}

      {/* Source Text Card (for translation MCQ) */}
      {card.sourceText && (
        <View style={styles.sourceCard}>
          {card.audioUrl && (
            <Pressable style={styles.audioButton} onPress={handlePlayAudio}>
              <Ionicons
                name={isPlaying ? 'pause' : 'volume-high'}
                size={20}
                color={theme.colors.primary}
              />
            </Pressable>
          )}
          <Text style={styles.sourceText}>{card.sourceText}</Text>
        </View>
      )}

      {/* Options */}
      <View style={styles.optionsContainer}>
        {!isTranslation && <Text style={styles.prompt}>{card.prompt}</Text>}
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
              <Text
                style={[
                  styles.optionLabel,
                  isSelected && (isCorrect ? styles.optionLabelCorrect : styles.optionLabelWrong),
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  instruction: {
    fontFamily: theme.typography.bold,
    fontSize: 14,
    color: '#28a745',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: theme.spacing.md,
  },
  audioButton: {
    padding: theme.spacing.xs,
  },
  sourceText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 18,
    color: theme.colors.text,
    flex: 1,
  },
  optionsContainer: {
    gap: theme.spacing.sm,
  },
  prompt: {
    fontFamily: theme.typography.semiBold,
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  option: {
    padding: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
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
    fontSize: 16,
    color: theme.colors.text,
  },
  optionLabelCorrect: {
    color: '#155724',
    fontFamily: theme.typography.semiBold,
  },
  optionLabelWrong: {
    color: '#721c24',
    fontFamily: theme.typography.semiBold,
  },
});
