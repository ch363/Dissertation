import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';

import { fillBlankStyles as styles } from './fillBlankStyles';

import { CARD_TYPE_COLORS } from '@/features/session/constants/cardTypeColors';
import { SpeakerButton } from '@/components/ui';
import { useTtsAudio } from '@/hooks/useTtsAudio';
import { createLogger } from '@/services/logging';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
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
  const { speak, isSpeaking } = useTtsAudio();
  const previousAnswerRef = useRef<string | undefined>(undefined);

  // Speak the word when it's placed in the blank
  useEffect(() => {
    const speakSelectedWord = async () => {
      if (selectedAnswer && selectedAnswer !== previousAnswerRef.current) {
        logger.info('Speaking selected word', { selectedAnswer });
        await speak(selectedAnswer, 'it-IT');
      }
      previousAnswerRef.current = selectedAnswer;
    };

    speakSelectedWord();
  }, [selectedAnswer, showResult, speak]);

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

    const textToSpeak = card.text.replace(/___/g, ' ').trim() || '';
    if (!textToSpeak) {
      logger.warn('No text to speak after processing');
      return;
    }
    logger.info('Speaking text', { textToSpeak });
    await speak(textToSpeak, 'it-IT');
  };

  const sentenceParts = card.text.split('___');

  return (
    <View style={[styles.container, { gap: theme.spacing.md }]} testID="fill-blank-card">
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
        {(card.audioUrl || card.text) && (
          <View style={styles.audioButton}>
            <SpeakerButton
              size={44}
              isPlaying={isSpeaking}
              onPress={handlePlayAudio}
              accessibilityLabel={isSpeaking ? 'Pause audio' : 'Play audio'}
              accessibilityHint="Plays the sentence audio"
            />
            <Text style={[styles.audioLabel, { color: theme.colors.text }]}>
              Listen and complete
            </Text>
          </View>
        )}

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
              const isDisabled = showResult && isCorrect;

              return (
                <Pressable
                  key={opt.id}
                  testID={`fb-option-${opt.id}`}
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
