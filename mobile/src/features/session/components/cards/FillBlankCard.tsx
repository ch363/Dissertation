import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CARD_TYPE_COLORS } from '../../constants/cardTypeColors';

import { SpeakerButton } from '@/components/ui';
import { createLogger } from '@/services/logging';
import { getTtsEnabled, getTtsRate } from '@/services/preferences';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import * as SafeSpeech from '@/services/tts';
import { FillBlankCard as FillBlankCardType } from '@/types/session';
import { announce } from '@/utils/a11y';

const logger = createLogger('FillBlankCard');

type Props = {
  card: FillBlankCardType;
  selectedAnswer?: string;
  onSelectAnswer?: (answer: string) => void;
  showResult?: boolean;
  isCorrect?: boolean;
  grammaticalCorrectness?: number | null;
};

export function FillBlankCard({
  card,
  selectedAnswer,
  onSelectAnswer,
  showResult,
  isCorrect,
  grammaticalCorrectness: _grammaticalCorrectness,
}: Props) {
  const ctx = useAppTheme();
  const theme = ctx?.theme ?? baseTheme;
  const [isPlaying, setIsPlaying] = useState(false);
  const previousAnswerRef = useRef<string | undefined>(undefined);

  // Speak the word when it's placed in the blank
  useEffect(() => {
    const speakSelectedWord = async () => {
      // Speak if:
      // 1. There's a selected answer
      // 2. It's different from the previous answer (new word was placed)
      // Allow speaking even after results are shown, so users can hear each wrong answer they try
      if (selectedAnswer && selectedAnswer !== previousAnswerRef.current) {
        try {
          const enabled = await getTtsEnabled();
          if (!enabled) {
            return;
          }

          const rate = await getTtsRate();
          await SafeSpeech.stop();
          // Small delay to ensure stop completes
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Speak the selected word
          logger.info('Speaking selected word', { selectedAnswer });
          await SafeSpeech.speak(selectedAnswer, { language: 'it-IT', rate });
        } catch (error) {
          logger.error('Failed to speak selected word', error as Error);
        }
      }

      // Update the ref to track the current answer
      previousAnswerRef.current = selectedAnswer;
    };

    speakSelectedWord();
  }, [selectedAnswer, showResult]);

  useEffect(() => {
    if (!showResult) return;
    if (isCorrect === true) announce('Correct.');
    else if (isCorrect === false) announce('Incorrect.');
  }, [showResult, isCorrect]);

  const handlePlayAudio = async () => {
    if (!card.text) {
      logger.warn('No text available for audio');
      return;
    }

    // Prevent multiple rapid calls
    if (isPlaying) {
      return;
    }

    try {
      const enabled = await getTtsEnabled();
      if (!enabled) {
        logger.warn('TTS is disabled');
        return;
      }
      setIsPlaying(true);
      const rate = await getTtsRate();
      await SafeSpeech.stop();
      // Small delay to ensure stop completes
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Speak the sentence with blank removed (replace ___ with a pause or just remove it)
      // Remove the blank marker and speak the sentence naturally
      const textToSpeak = card.text.replace(/___/g, ' ').trim() || '';
      if (!textToSpeak) {
        logger.warn('No text to speak after processing');
        setIsPlaying(false);
        return;
      }
      logger.info('Speaking text', { textToSpeak });
      await SafeSpeech.speak(textToSpeak, { language: 'it-IT', rate });
      // Estimate duration: ~150ms per character, minimum 2 seconds
      const estimatedDuration = Math.max(textToSpeak.length * 150, 2000);
      setTimeout(() => setIsPlaying(false), estimatedDuration);
    } catch (error) {
      logger.error('Failed to play audio', error as Error);
      setIsPlaying(false);
    }
  };

  // Parse sentence to find blank position
  const sentenceParts = card.text.split('___');

  return (
    <View style={[styles.container, { gap: theme.spacing.md }]}>
      <Text style={[styles.instruction, { color: CARD_TYPE_COLORS.fillBlank.instruction }]}>
        FILL IN THE BLANK
      </Text>

      {/* Main Question Card */}
      <View
        style={[
          styles.questionCard,
          {
            backgroundColor: theme.colors.card,
            borderLeftWidth: 3,
            borderLeftColor: CARD_TYPE_COLORS.fillBlank.border,
            paddingLeft: theme.spacing.sm,
          },
        ]}
      >
        {/* Audio button - always show if text is available */}
        {(card.audioUrl || card.text) && (
          <View style={styles.audioButton}>
            <SpeakerButton
              size={44}
              isPlaying={isPlaying}
              onPress={handlePlayAudio}
              accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
              accessibilityHint="Plays the sentence audio"
            />
            <Text style={[styles.audioLabel, { color: theme.colors.text }]}>
              Listen and complete
            </Text>
          </View>
        )}

        {/* Sentence with blank */}
        <View style={styles.sentenceContainer}>
          {sentenceParts[0] && (
            <Text style={[styles.sentenceText, { color: theme.colors.text }]}>
              {sentenceParts[0].trim()}
            </Text>
          )}
          <View
            style={[
              styles.blankField,
              {
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.primary + '18',
              },
              selectedAnswer && showResult
                ? isCorrect
                  ? {
                      backgroundColor: theme.colors.success + '30',
                      borderColor: theme.colors.success,
                      borderWidth: 3,
                    }
                  : {
                      backgroundColor: theme.colors.error + '20',
                      borderColor: theme.colors.error,
                      borderWidth: 3,
                    }
                : selectedAnswer
                  ? {
                      backgroundColor: theme.colors.primary + '18',
                      borderColor: theme.colors.primary,
                    }
                  : null,
            ]}
          >
            <Text
              style={[
                styles.blankText,
                { color: theme.colors.primary },
                selectedAnswer && showResult
                  ? isCorrect
                    ? { color: theme.colors.success }
                    : { color: theme.colors.error }
                  : selectedAnswer
                    ? { color: theme.colors.text }
                    : null,
              ]}
            >
              {selectedAnswer || ''}
            </Text>
            {/* Show checkmark/X icon for correct/incorrect */}
            {selectedAnswer && showResult && (
              <Ionicons
                name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={isCorrect ? theme.colors.success : theme.colors.error}
                style={styles.blankIcon}
              />
            )}
          </View>
          {sentenceParts[1] && (
            <Text style={[styles.sentenceText, { color: theme.colors.text }]}>
              {sentenceParts[1].trim()}
            </Text>
          )}
        </View>
      </View>

      {/* Options Card */}
      {card.options && card.options.length > 0 && (
        <View style={[styles.optionsCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.optionsLabel, { color: theme.colors.mutedText }]}>
            TAP TO FILL THE BLANK
          </Text>
          <View style={styles.optionsGrid}>
            {card.options.map((opt) => {
              const isSelected = selectedAnswer === opt.label;
              const isCorrectOption = showResult && isCorrect && isSelected;
              const isIncorrectOption = showResult && !isCorrect && isSelected;
              // Disable all options once correct answer is selected
              const isDisabled = showResult && isCorrect;

              return (
                <Pressable
                  key={opt.id}
                  style={[
                    styles.optionButton,
                    { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                    !showResult &&
                      isSelected && {
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.primary,
                      },
                    isCorrectOption && {
                      backgroundColor: theme.colors.success + '25',
                      borderColor: theme.colors.success,
                    },
                    isIncorrectOption && {
                      backgroundColor: theme.colors.error + '20',
                      borderColor: theme.colors.error,
                    },
                    isDisabled && !isCorrectOption && { opacity: 0.7 },
                  ]}
                  onPress={() => {
                    // Only allow selection if correct answer hasn't been selected yet
                    if (!isDisabled) {
                      onSelectAnswer?.(opt.label);
                    }
                  }}
                  disabled={isDisabled}
                  accessibilityRole="button"
                  accessibilityLabel={`Answer option: ${opt.label}`}
                  accessibilityState={{
                    selected: isSelected,
                    disabled: isDisabled,
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: theme.colors.text },
                      !showResult && isSelected && { color: theme.colors.onPrimary },
                      isCorrectOption && { color: theme.colors.success },
                      isIncorrectOption && { color: theme.colors.error },
                      isDisabled && !isCorrectOption && { color: theme.colors.mutedText },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {/* Show checkmark/X icon for correct/incorrect */}
                  {isCorrectOption && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.colors.success}
                      style={styles.optionIcon}
                      accessible={false}
                      importantForAccessibility="no"
                    />
                  )}
                  {isIncorrectOption && (
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={theme.colors.error}
                      style={styles.optionIcon}
                      accessible={false}
                      importantForAccessibility="no"
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: baseTheme.spacing.md,
  },
  instruction: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  questionCard: {
    borderRadius: 16,
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.xs,
    marginBottom: baseTheme.spacing.sm,
  },
  audioLabel: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
  },
  sentenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: baseTheme.spacing.xs,
  },
  sentenceText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 18,
    lineHeight: 28,
  },
  blankField: {
    minWidth: 100,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: baseTheme.spacing.md,
    paddingVertical: baseTheme.spacing.xs,
    flexDirection: 'row',
    gap: baseTheme.spacing.xs,
  },
  blankIcon: {
    marginLeft: baseTheme.spacing.xs,
  },
  blankFieldFilled: {},
  blankFieldCorrect: {},
  blankFieldIncorrect: {},
  blankText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 18,
    minHeight: 20,
  },
  blankTextFilled: {},
  blankTextCorrect: {},
  blankTextIncorrect: {},
  optionsCard: {
    borderRadius: 16,
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  optionsLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 12,
    color: baseTheme.colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: baseTheme.spacing.xs,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: baseTheme.spacing.md,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: baseTheme.spacing.md,
    paddingHorizontal: baseTheme.spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    flexDirection: 'row',
    gap: baseTheme.spacing.xs,
  },
  optionIcon: {
    marginLeft: baseTheme.spacing.xs,
  },
  optionButtonSelected: {},
  optionButtonCorrect: {},
  optionButtonIncorrect: {},
  optionText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
  optionTextSelected: {},
  optionTextCorrect: {},
  optionTextIncorrect: {},
  optionButtonDisabled: {},
  optionTextDisabled: {},
});
