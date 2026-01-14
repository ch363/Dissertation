import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getTtsEnabled, getTtsRate } from '@/services/preferences';
import { theme } from '@/services/theme/tokens';
import * as SafeSpeech from '@/services/tts';
import { MultipleChoiceCard as MultipleChoiceCardType } from '@/types/session';

type Props = {
  card: MultipleChoiceCardType;
  selectedOptionId?: string;
  onSelectOption?: (optionId: string) => void;
  showResult?: boolean;
  isCorrect?: boolean;
  onCheckAnswer?: () => void;
};

export function MultipleChoiceCard({
  card,
  selectedOptionId,
  onSelectOption,
  showResult = false,
  isCorrect,
  onCheckAnswer,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayAudio = async () => {
    if (!card.sourceText) return;
    try {
      const enabled = await getTtsEnabled();
      if (!enabled) return;
      setIsPlaying(true);
      const rate = await getTtsRate();
      await SafeSpeech.stop();
      // Speak the source text (e.g., "Good morning")
      await SafeSpeech.speak(card.sourceText, { language: 'en-US', rate });
      setTimeout(() => setIsPlaying(false), 2000);
    } catch (error) {
      console.error('Failed to play audio:', error);
      setIsPlaying(false);
    }
  };

  const handleSpeakOption = async (optionLabel: string) => {
    try {
      const enabled = await getTtsEnabled();
      if (!enabled) return;
      const rate = await getTtsRate();
      await SafeSpeech.stop();
      // Speak the option label (Italian word)
      await SafeSpeech.speak(optionLabel, { language: 'it-IT', rate });
    } catch (error) {
      console.error('Failed to speak option:', error);
    }
  };

  const isTranslation = !!card.sourceText;

  return (
    <View style={styles.container}>
      {/* Instruction Label */}
      {isTranslation && (
        <Text style={styles.instruction}>TRANSLATE THIS SENTENCE</Text>
      )}

      {/* Source Text Card (for translation MCQ) */}
      {card.sourceText && (
        <View style={styles.sourceCard}>
          <Pressable style={styles.audioButton} onPress={handlePlayAudio}>
            <Ionicons
              name={isPlaying ? 'pause' : 'volume-high'}
              size={20}
              color="#fff"
            />
          </Pressable>
          <Text style={styles.sourceText}>{card.sourceText}</Text>
        </View>
      )}

      {/* Question Prompt (for non-translation MCQ) */}
      {!isTranslation && (
        <Text style={styles.prompt}>{card.prompt}</Text>
      )}

      {/* Options */}
      <View style={styles.optionsContainer}>
        {card.options.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          const isCorrectOption = opt.id === card.correctOptionId;
          const showAsCorrect = showResult && isCorrectOption;
          const showAsSelected = isSelected && !showResult;
          const showAsIncorrectSelected = showResult && isSelected && !isCorrectOption;

          return (
            <Pressable
              key={opt.id}
              onPress={() => {
                if (showResult) return; // Disable selection after checking
                // Speak the option when clicked
                handleSpeakOption(opt.label);
                onSelectOption?.(opt.id);
              }}
              style={[
                styles.option,
                showAsSelected && styles.optionSelected,
                showAsCorrect && styles.optionCorrect,
                showAsIncorrectSelected && styles.optionIncorrect,
              ]}
            >
              <Text style={styles.optionLabel}>{opt.label}</Text>
              {showAsCorrect ? (
                <Ionicons name="checkmark-circle" size={24} color="#28a745" />
              ) : showAsIncorrectSelected ? (
                <Ionicons name="close-circle" size={24} color="#dc3545" />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {/* Check Answer Button (before result) */}
      {!showResult && selectedOptionId !== undefined && (
        <Pressable style={styles.checkButton} onPress={onCheckAnswer}>
          <Text style={styles.checkButtonText}>Check Answer</Text>
        </Pressable>
      )}

      {/* Feedback Banner (after checking, if correct) */}
      {showResult && isCorrect && (
        <View style={styles.feedbackBanner}>
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={styles.feedbackText}>Excellent! That's correct!</Text>
        </View>
      )}
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
    gap: theme.spacing.md,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  audioButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceText: {
    fontFamily: theme.typography.regular,
    fontSize: 18,
    color: theme.colors.text,
    flex: 1,
  },
  prompt: {
    fontFamily: theme.typography.bold,
    fontSize: 20,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  optionsContainer: {
    gap: theme.spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    minHeight: 60,
  },
  optionSelected: {
    borderColor: theme.colors.primary,
    // Keep white background when selected (before check)
  },
  optionCorrect: {
    borderColor: '#28a745',
    backgroundColor: '#E6F7ED', // Light green background
  },
  optionIncorrect: {
    borderColor: '#dc3545',
    backgroundColor: '#FDEBEC', // Light red background
  },
  optionLabel: {
    fontFamily: theme.typography.regular,
    fontSize: 18,
    color: theme.colors.text,
    flex: 1,
  },
  checkButton: {
    backgroundColor: '#28a745', // Green/teal color from mockup
    padding: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  checkButtonText: {
    color: '#fff',
    fontFamily: theme.typography.bold,
    fontSize: 16,
    textTransform: 'uppercase',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: '#28a745',
    padding: theme.spacing.md,
    borderRadius: 12,
    marginTop: theme.spacing.sm,
  },
  feedbackText: {
    color: '#fff',
    fontFamily: theme.typography.bold,
    fontSize: 16,
  },
});
