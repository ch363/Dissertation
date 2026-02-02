import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getTtsEnabled, getTtsRate } from '@/services/preferences';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
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
  const ctx = useAppTheme();
  const theme = ctx?.theme ?? baseTheme;
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
    <View style={[styles.container, { gap: theme.spacing.sm }]}>
      {/* Instruction Label */}
      {isTranslation && (
        <Text style={[styles.instruction, { color: theme.colors.success }]}>TRANSLATE THIS SENTENCE</Text>
      )}

      {/* Source Text Card (for translation MCQ) */}
      {card.sourceText && (
        <View style={[styles.sourceCard, { backgroundColor: theme.colors.card }]}>
          <Pressable
            style={[styles.audioButton, { backgroundColor: theme.colors.primary }]}
            onPress={handlePlayAudio}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
            accessibilityHint="Plays the sentence audio"
            accessibilityState={{ selected: isPlaying, busy: isPlaying }}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'volume-high'}
              size={20}
              color={theme.colors.onPrimary}
              accessible={false}
              importantForAccessibility="no"
            />
          </Pressable>
          <Text style={[styles.sourceText, { color: theme.colors.text }]}>{card.sourceText}</Text>
        </View>
      )}

      {/* Question Prompt (for non-translation MCQ) */}
      {!isTranslation && (
        <Text style={[styles.prompt, { color: theme.colors.text }]}>{card.prompt}</Text>
      )}

      {/* Options */}
      {!card.options || card.options.length === 0 ? (
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.errorText, { color: theme.colors.mutedText }]}>No options available</Text>
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
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                showAsSelected && { borderColor: theme.colors.primary },
                showAsCorrect && { borderColor: theme.colors.success, backgroundColor: theme.colors.success + '25' },
                showAsIncorrectSelected && { borderColor: theme.colors.error, backgroundColor: theme.colors.error + '20' },
              ]}
            >
              <Text style={[styles.optionLabel, { color: theme.colors.text }]}>{opt.label}</Text>
              {showAsCorrect ? (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={theme.colors.success}
                  accessible={false}
                  importantForAccessibility="no"
                />
              ) : showAsIncorrectSelected ? (
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={theme.colors.error}
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
        <View style={[styles.feedbackBanner, { backgroundColor: theme.colors.success }]} accessibilityRole="alert">
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={theme.colors.onPrimary}
            accessible={false}
            importantForAccessibility="no"
          />
          <Text style={[styles.feedbackText, { color: theme.colors.onPrimary }]}>Excellent! That's correct!</Text>
        </View>
      )}

      {/* Check Answer Button (only for non-translation MCQ) */}
      {!showResult && selectedOptionId !== undefined && !isTranslation && (
        <Pressable
          style={[styles.checkButton, { backgroundColor: theme.colors.success }]}
          onPress={onCheckAnswer}
          accessibilityRole="button"
          accessibilityLabel="Check answer"
          accessibilityHint="Checks whether your selected option is correct"
        >
          <Text style={[styles.checkButtonText, { color: theme.colors.onPrimary }]}>Check Answer</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: baseTheme.spacing.sm,
    flex: 1,
  },
  errorContainer: {
    padding: baseTheme.spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  instruction: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.md,
    borderRadius: 16,
    padding: baseTheme.spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  audioButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 18,
    flex: 1,
  },
  prompt: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 20,
    marginBottom: baseTheme.spacing.xs,
  },
  optionsContainer: {
    gap: baseTheme.spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: baseTheme.spacing.md,
    borderRadius: 16,
    borderWidth: 2,
    minHeight: 56,
  },
  optionSelected: {},
  optionCorrect: {},
  optionIncorrect: {},
  optionLabel: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 18,
    flex: 1,
  },
  checkButton: {
    padding: baseTheme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: baseTheme.spacing.xs,
  },
  checkButtonText: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 16,
    textTransform: 'uppercase',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: baseTheme.spacing.xs,
    paddingVertical: baseTheme.spacing.sm,
    paddingHorizontal: baseTheme.spacing.md,
    borderRadius: 12,
    marginTop: baseTheme.spacing.xs,
  },
  feedbackText: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 14,
  },
});
