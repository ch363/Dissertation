import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getTtsEnabled, getTtsRate } from '@/services/preferences';
import { theme } from '@/services/theme/tokens';
import * as SafeSpeech from '@/services/tts';
import { MultipleChoiceCard as MultipleChoiceCardType } from '@/types/session';
import { announce } from '@/utils/a11y';
import { createLogger } from '@/services/logging';

const logger = createLogger('MultipleChoiceCard');

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

  useEffect(() => {
    if (!showResult) return;
    if (isCorrect === true) announce('Correct.');
    else if (isCorrect === false) announce('Incorrect.');
  }, [showResult, isCorrect]);

  function isItalianText(text: string) {
    // Heuristic: check for Italian-specific characters or a few high-frequency words.
    // This avoids speaking English MC options on tap.
    const t = text.trim();
    if (!t) return false;
    const hasItalianChars = /[àèéìíîòóùú]/.test(t);
    const isCommonItalian =
      /^(ciao|grazie|prego|scusa|bene|sì|no|buongiorno|buonasera|arrivederci|per favore)$/i.test(t);
    return hasItalianChars || isCommonItalian;
  }

  const handlePlayAudio = async () => {
    if (!card.sourceText) return;
    // Prevent multiple rapid calls
    if (isPlaying) {
      return;
    }
    
    try {
      const enabled = await getTtsEnabled();
      if (!enabled) return;
      setIsPlaying(true);
      const rate = await getTtsRate();
      await SafeSpeech.stop();
      // Small delay to ensure stop completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Detect language: if sourceText contains Italian characters or common Italian words, use Italian
      // Otherwise default to English
      // Simple heuristic: check for Italian-specific characters (à, è, ì, ò, ù) or common Italian words
      const hasItalianChars = /[àèéìíîòóùú]/.test(card.sourceText);
      const isCommonItalian = /^(ciao|grazie|prego|scusa|bene|sì|no|buongiorno|buonasera|per favore)$/i.test(card.sourceText.trim());
      const language = hasItalianChars || isCommonItalian ? 'it-IT' : 'en-US';
      await SafeSpeech.speak(card.sourceText, { language, rate });
      
      // Reset playing state after estimated duration
      const estimatedDuration = Math.max(2000, card.sourceText.length * 150);
      setTimeout(() => setIsPlaying(false), estimatedDuration);
    } catch (error) {
      logger.error('Failed to play audio', error);
      setIsPlaying(false);
    }
  };

  const handleSpeakOption = async (label: string) => {
    // Only speak options that look like Italian (learning language in this project).
    // If options are English MCQ distractors, do nothing.
    if (!isItalianText(label)) return;
    try {
      const enabled = await getTtsEnabled();
      if (!enabled) return;
      const rate = await getTtsRate();
      await SafeSpeech.stop();
      await new Promise((resolve) => setTimeout(resolve, 80));
      await SafeSpeech.speak(label, { language: 'it-IT', rate });
    } catch (error) {
      // Best-effort: never block selection due to TTS.
      logger.debug('Failed to speak option (non-critical)', error);
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
          <Pressable
            style={styles.audioButton}
            onPress={handlePlayAudio}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
            accessibilityHint="Plays the sentence audio"
            accessibilityState={{ selected: isPlaying, busy: isPlaying }}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'volume-high'}
              size={20}
              color="#fff"
              accessible={false}
              importantForAccessibility="no"
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
      {!card.options || card.options.length === 0 ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No options available</Text>
        </View>
      ) : (
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
              accessibilityRole="button"
              accessibilityLabel={`Answer option: ${opt.label}`}
              accessibilityState={{
                selected: isSelected,
                disabled: showResult,
              }}
              onPress={() => {
                if (showResult) return; // Disable selection after checking
                // Speak learning-language (Italian) options on tap; keep English MC options silent.
                void handleSpeakOption(opt.label);
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
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color="#28a745"
                  accessible={false}
                  importantForAccessibility="no"
                />
              ) : showAsIncorrectSelected ? (
                <Ionicons
                  name="close-circle"
                  size={24}
                  color="#dc3545"
                  accessible={false}
                  importantForAccessibility="no"
                />
              ) : null}
            </Pressable>
          );
        })}
        </View>
      )}

      {/* Feedback Banner (after checking, if correct) - appears right after options */}
      {showResult && isCorrect && (
        <View style={styles.feedbackBanner} accessibilityRole="alert">
          <Ionicons
            name="checkmark-circle"
            size={20}
            color="#fff"
            accessible={false}
            importantForAccessibility="no"
          />
          <Text style={styles.feedbackText}>Excellent! That's correct!</Text>
        </View>
      )}

      {/* Check Answer Button (only for non-translation MCQ) */}
      {!showResult && selectedOptionId !== undefined && !isTranslation && (
        <Pressable
          style={styles.checkButton}
          onPress={onCheckAnswer}
          accessibilityRole="button"
          accessibilityLabel="Check answer"
          accessibilityHint="Checks whether your selected option is correct"
        >
          <Text style={styles.checkButtonText}>Check Answer</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
    flex: 1,
  },
  errorContainer: {
    padding: theme.spacing.lg,
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  errorText: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
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
    gap: theme.spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    minHeight: 56,
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
    marginTop: theme.spacing.xs,
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
    gap: theme.spacing.xs,
    backgroundColor: '#28a745',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 12,
    marginTop: theme.spacing.xs,
  },
  feedbackText: {
    color: '#fff',
    fontFamily: theme.typography.bold,
    fontSize: 14,
  },
});
