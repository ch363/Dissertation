/**
 * MultipleChoiceCard – matches Figma design from Professional App Redesign (MultipleChoiceScreen).
 * Layout: instruction → word + audio → options → (feedback / check button).
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { multipleChoiceStyles as styles, FIGMA } from './multipleChoiceStyles';

import { CARD_TYPE_COLORS } from '@/features/session/constants/cardTypeColors';
import { SpeakerButton } from '@/components/ui';
import { useTtsAudio } from '@/hooks/useTtsAudio';
import { createLogger } from '@/services/logging';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import { MultipleChoiceCard as MultipleChoiceCardType } from '@/types/session';
import { announce } from '@/utils/a11y';
import { isTargetLanguageText, detectLanguageForTts } from '@/utils/languageDetection';

const logger = createLogger('MultipleChoiceCard');

type Props = {
  card: MultipleChoiceCardType;
  selectedOptionId?: string;
  onSelectOption?: (optionId: string) => void;
  showResult?: boolean;
  isCorrect?: boolean;
  showCorrectAnswer?: boolean;
  onCheckAnswer?: () => void;
  onTryAgain?: () => void;
  /** Current incorrect attempt count (for showing "Try Again" vs showing correct answer) */
  incorrectAttemptCount?: number;
};

export function MultipleChoiceCard({
  card,
  selectedOptionId,
  onSelectOption,
  showResult = false,
  isCorrect,
  showCorrectAnswer = false,
  onCheckAnswer,
  onTryAgain,
  incorrectAttemptCount: _incorrectAttemptCount = 0,
}: Props) {
  const ctx = useAppTheme();
  const theme = ctx?.theme ?? baseTheme;
  const { speak, isSpeaking } = useTtsAudio();

  useEffect(() => {
    if (!showResult) return;
    if (isCorrect === true) announce('Correct.');
    else if (isCorrect === false) announce('Incorrect.');
  }, [showResult, isCorrect]);

  /** Speak the correct answer when user gets it right, only if the answer is in the target language. */
  useEffect(() => {
    if (!showResult || isCorrect !== true || !card.options?.length || !card.correctOptionId) return;
    const correctOpt = card.options.find((o) => o.id === card.correctOptionId);
    const label = correctOpt?.label?.trim();
    if (!label || !isTargetLanguageText(label)) return;

    (async () => {
      try {
        await new Promise((r) => setTimeout(r, 150));
        const language = detectLanguageForTts(label);
        await speak(label, language);
      } catch (e) {
        logger.debug('Failed to speak correct answer (non-critical)', e);
      }
    })();
  }, [showResult, isCorrect, card.options, card.correctOptionId, speak]);

  const handlePlayAudio = async () => {
    if (!card.sourceText) return;
    if (!isTargetLanguageText(card.sourceText)) return;

    const language = detectLanguageForTts(card.sourceText);
    await speak(card.sourceText, language);
  };

  const handleSpeakOption = async (label: string) => {
    if (!isTargetLanguageText(label)) return;

    await new Promise((resolve) => setTimeout(resolve, 80));
    const language = detectLanguageForTts(label);
    await speak(label, language);
  };

  const isTranslation = !!card.sourceText;
  const showPromptSpeaker =
    isTranslation && !!card.sourceText && isTargetLanguageText(card.sourceText);

  return (
    <View style={styles.container}>
      {isTranslation && (
        <Text style={[styles.instruction, { color: FIGMA.instruction }]}>
          TRANSLATE THIS SENTENCE
        </Text>
      )}

      {card.sourceText && (
        <View style={styles.wordRow}>
          {showPromptSpeaker ? (
            <SpeakerButton
              size={48}
              isPlaying={isSpeaking}
              onPress={handlePlayAudio}
              accessibilityLabel={isSpeaking ? 'Pause audio' : 'Play pronunciation'}
              accessibilityHint="Plays the phrase audio"
            />
          ) : null}
          <Text style={[styles.sourceText, { color: FIGMA.word }]}>{card.sourceText}</Text>
        </View>
      )}

      {!isTranslation && (
        <Text style={[styles.prompt, { color: theme.colors.text }]}>{card.prompt}</Text>
      )}

      {!card.options || card.options.length === 0 ? (
        <View
          style={[
            styles.errorContainer,
            { backgroundColor: FIGMA.optionBg, borderColor: FIGMA.optionBorder },
          ]}
        >
          <Text style={[styles.errorText, { color: theme.colors.mutedText }]}>
            No options available
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.optionsContainer,
            !isTranslation && {
              borderLeftWidth: 3,
              borderLeftColor: CARD_TYPE_COLORS.multipleChoice.border,
              paddingLeft: baseTheme.spacing.sm,
              borderRadius: baseTheme.radius.sm,
            },
          ]}
        >
          {card.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const isCorrectOption = opt.id === card.correctOptionId;
            const showAsCorrect =
              showResult && isCorrectOption && (isCorrect === true || showCorrectAnswer);
            const showAsSelected = isSelected && !showResult;
            const showAsIncorrectSelected = showResult && isSelected && !isCorrectOption;

            const borderColor = showAsCorrect
              ? FIGMA.optionCorrectBorder
              : showAsIncorrectSelected
                ? FIGMA.optionIncorrectBorder
                : showAsSelected
                  ? FIGMA.optionSelectedBorder
                  : FIGMA.optionBorder;

            return (
              <Pressable
                key={opt.id}
                testID={`mc-option-${opt.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Answer option: ${opt.label}`}
                accessibilityState={{ selected: isSelected, disabled: showResult }}
                onPress={() => {
                  if (showResult) return;
                  void handleSpeakOption(opt.label);
                  onSelectOption?.(opt.id);
                }}
                style={[
                  styles.optionOuter,
                  { borderColor },
                  showAsSelected && styles.optionSelectedShadow,
                ]}
              >
                {showAsSelected && !showResult ? (
                  <LinearGradient
                    colors={FIGMA.optionSelectedBg}
                    style={styles.optionInner}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={[styles.optionLabel, { color: FIGMA.optionTextSelected }]}>
                      {opt.label}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      styles.optionInner,
                      {
                        backgroundColor: showAsCorrect
                          ? FIGMA.optionCorrectBg
                          : showAsIncorrectSelected
                            ? FIGMA.optionIncorrectBg
                            : FIGMA.optionBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        {
                          color:
                            showAsCorrect || showAsIncorrectSelected
                              ? theme.colors.text
                              : FIGMA.optionText,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {showAsCorrect ? (
                      <Ionicons name="checkmark-circle" size={24} color={FIGMA.feedbackSuccess} />
                    ) : showAsIncorrectSelected ? (
                      <Ionicons name="close-circle" size={24} color={FIGMA.optionIncorrectBorder} />
                    ) : null}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      {showResult && isCorrect === true && (
        <View
          style={[styles.feedbackBanner, { backgroundColor: FIGMA.feedbackSuccess }]}
          accessibilityRole="alert"
          testID="feedback-correct"
        >
          <Ionicons name="checkmark-circle" size={20} color={FIGMA.ctaText} />
          <Text style={[styles.feedbackText, { color: FIGMA.ctaText }]}>
            Excellent! That's correct!
          </Text>
        </View>
      )}
      {showResult && isCorrect === false && (
        <>
          <View
            style={[styles.feedbackBanner, { backgroundColor: FIGMA.optionIncorrectBorder }]}
            accessibilityRole="alert"
            testID="feedback-incorrect"
          >
            <Ionicons name="close-circle" size={20} color={FIGMA.ctaText} />
            <Text style={[styles.feedbackText, { color: FIGMA.ctaText }]}>That's incorrect.</Text>
          </View>

          {!showCorrectAnswer && onTryAgain && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Try again"
              accessibilityHint="Clear result and select a different answer"
              style={styles.tryAgainButton}
              onPress={onTryAgain}
            >
              <Ionicons
                name="refresh"
                size={18}
                color={baseTheme.colors.primary}
                accessible={false}
                importantForAccessibility="no"
              />
              <Text style={styles.tryAgainButtonText}>Try Again</Text>
            </Pressable>
          )}
        </>
      )}

      {!showResult && selectedOptionId !== undefined && !isTranslation && (
        <Pressable
          style={({ pressed }) => [
            styles.ctaWrap,
            !selectedOptionId && styles.ctaDisabled,
            pressed && selectedOptionId && styles.ctaPressed,
          ]}
          onPress={onCheckAnswer}
          disabled={!selectedOptionId}
          accessibilityRole="button"
          accessibilityLabel="Check answer"
        >
          {selectedOptionId ? (
            <LinearGradient
              colors={FIGMA.ctaGradient}
              style={styles.ctaButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.ctaText, { color: FIGMA.ctaText }]}>Check Answer</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.ctaButton, { backgroundColor: FIGMA.ctaDisabledBg }]}>
              <Text style={[styles.ctaText, { color: FIGMA.ctaDisabledText }]}>Check Answer</Text>
            </View>
          )}
        </Pressable>
      )}
    </View>
  );
}
