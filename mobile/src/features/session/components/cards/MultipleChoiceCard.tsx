/**
 * MultipleChoiceCard – matches Figma design from Professional App Redesign (MultipleChoiceScreen).
 * Layout: instruction → word + audio → options → (feedback / check button).
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SpeakerButton } from '@/components/ui';
import { getTtsEnabled, getTtsRate } from '@/services/preferences';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import * as SafeSpeech from '@/services/tts';
import { MultipleChoiceCard as MultipleChoiceCardType } from '@/types/session';
import { announce } from '@/utils/a11y';
import { createLogger } from '@/services/logging';

const logger = createLogger('MultipleChoiceCard');

// Figma design tokens (from MultipleChoiceScreen – blue/indigo/slate/emerald)
const FIGMA = {
  instruction: 'rgba(5, 150, 105, 0.8)', // emerald-600/80
  word: '#0f172a', // slate-900
  optionBorder: '#e2e8f0', // slate-200
  optionBorderHover: '#cbd5e1', // slate-300
  optionText: '#334155', // slate-700
  optionTextSelected: '#0f172a', // slate-900
  optionSelectedBg: ['#eff6ff', '#eef2ff'] as const, // blue-50 → indigo-50
  optionSelectedBorder: '#60a5fa', // blue-400
  optionCorrectBorder: '#059669', // emerald-600
  optionCorrectBg: 'rgba(5, 150, 105, 0.12)',
  optionIncorrectBorder: '#dc2626', // red-600
  optionIncorrectBg: 'rgba(220, 38, 38, 0.12)',
  optionBg: 'rgba(255, 255, 255, 0.8)',
  ctaGradient: ['#2563eb', '#4f46e5'] as const,
  ctaDisabledBg: '#e2e8f0', // slate-200
  ctaDisabledText: '#94a3b8', // slate-400
  ctaText: '#FFFFFF',
  feedbackSuccess: '#059669',
} as const;

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

  /** Speak the correct answer when user gets it right, only if the answer is in the target language. */
  useEffect(() => {
    if (!showResult || isCorrect !== true || !card.options?.length || !card.correctOptionId) return;
    const correctOpt = card.options.find((o) => o.id === card.correctOptionId);
    const label = correctOpt?.label?.trim();
    if (!label || !isTargetLanguageText(label)) return;
    (async () => {
      try {
        const enabled = await getTtsEnabled();
        if (!enabled) return;
        const rate = await getTtsRate();
        await SafeSpeech.stop();
        await new Promise((r) => setTimeout(r, 150));
        const hasItalian = /[àèéìíîòóùú]/.test(label) || /^(ciao|grazie|acqua|vino|formaggio|scusa|bene|sì|no|buongiorno|buonasera|arrivederci|per favore|prego)$/i.test(label);
        await SafeSpeech.speak(label, { language: hasItalian ? 'it-IT' : 'es-ES', rate });
      } catch (e) {
        logger.debug('Failed to speak correct answer (non-critical)', e);
      }
    })();
  }, [showResult, isCorrect, card.options, card.correctOptionId]);

  /** True if text looks like target language (Italian/Spanish), not English. */
  function isTargetLanguageText(text: string) {
    const t = text.trim();
    if (!t) return false;
    const hasItalianChars = /[àèéìíîòóùú]/.test(t);
    const hasSpanishChars = /[ñáéíóúü¿¡]/.test(t);
    const isCommonItalian =
      /^(ciao|grazie|prego|scusa|bene|sì|no|buongiorno|buonasera|arrivederci|per favore|acqua|vino|formaggio)$/i.test(t);
    const isCommonSpanish =
      /^(agua|vino|hola|gracias|sí|no|buenos días|por favor)$/i.test(t);
    return hasItalianChars || hasSpanishChars || isCommonItalian || isCommonSpanish;
  }

  const handlePlayAudio = async () => {
    if (!card.sourceText) return;
    if (isPlaying) return;
    if (!isTargetLanguageText(card.sourceText)) return;
    try {
      const enabled = await getTtsEnabled();
      if (!enabled) return;
      setIsPlaying(true);
      const rate = await getTtsRate();
      await SafeSpeech.stop();
      await new Promise(resolve => setTimeout(resolve, 100));
      const hasItalian = /[àèéìíîòóùú]/.test(card.sourceText) || /^(ciao|grazie|prego|scusa|bene|sì|no|buongiorno|buonasera|per favore|acqua|vino|formaggio)$/i.test(card.sourceText.trim());
      await SafeSpeech.speak(card.sourceText, { language: hasItalian ? 'it-IT' : 'es-ES', rate });
      const estimatedDuration = Math.max(2000, card.sourceText.length * 150);
      setTimeout(() => setIsPlaying(false), estimatedDuration);
    } catch (error) {
      logger.error('Failed to play audio', error);
      setIsPlaying(false);
    }
  };

  const handleSpeakOption = async (label: string) => {
    if (!isTargetLanguageText(label)) return;
    try {
      const enabled = await getTtsEnabled();
      if (!enabled) return;
      const rate = await getTtsRate();
      await SafeSpeech.stop();
      await new Promise(resolve => setTimeout(resolve, 80));
      const hasItalian = /[àèéìíîòóùú]/.test(label) || /^(ciao|grazie|acqua|vino|formaggio|scusa|bene|sì|no|buongiorno|buonasera|arrivederci|per favore|prego)$/i.test(label);
      await SafeSpeech.speak(label, { language: hasItalian ? 'it-IT' : 'es-ES', rate });
    } catch (error) {
      logger.debug('Failed to speak option (non-critical)', error);
    }
  };

  const isTranslation = !!card.sourceText;
  const showPromptSpeaker = isTranslation && !!card.sourceText && isTargetLanguageText(card.sourceText);

  return (
    <View style={styles.container}>
      {/* Instruction – Figma: text-xs font-semibold text-emerald-600/80 tracking-wide uppercase, mb-6 */}
      {isTranslation && (
        <Text style={[styles.instruction, { color: FIGMA.instruction }]}>TRANSLATE THIS SENTENCE</Text>
      )}

      {/* Word with Audio – only show speaker when prompt is target language (not English) */}
      {card.sourceText && (
        <View style={styles.wordRow}>
          {showPromptSpeaker ? (
            <SpeakerButton
              size={48}
              isPlaying={isPlaying}
              onPress={handlePlayAudio}
              accessibilityLabel={isPlaying ? 'Pause audio' : 'Play pronunciation'}
              accessibilityHint="Plays the phrase audio"
            />
          ) : null}
          <Text style={[styles.sourceText, { color: FIGMA.word }]}>{card.sourceText}</Text>
        </View>
      )}

      {/* Question Prompt (non-translation MCQ) */}
      {!isTranslation && (
        <Text style={[styles.prompt, { color: theme.colors.text }]}>{card.prompt}</Text>
      )}

      {/* Multiple Choice Options – Figma: space-y-3; px-6 py-4 rounded-2xl; selected gradient + blue-400 border */}
      {!card.options || card.options.length === 0 ? (
        <View style={[styles.errorContainer, { backgroundColor: FIGMA.optionBg, borderColor: FIGMA.optionBorder }]}>
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
                accessibilityRole="button"
                accessibilityLabel={`Answer option: ${opt.label}`}
                accessibilityState={{ selected: isSelected, disabled: showResult }}
                onPress={() => {
                  if (showResult) return;
                  void handleSpeakOption(opt.label);
                  onSelectOption?.(opt.id);
                }}
                style={[styles.optionOuter, { borderColor }, showAsSelected && styles.optionSelectedShadow]}
              >
                {(showAsSelected && !showResult) ? (
                  <LinearGradient
                    colors={FIGMA.optionSelectedBg}
                    style={styles.optionInner}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={[styles.optionLabel, { color: FIGMA.optionTextSelected }]}>{opt.label}</Text>
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
                    <Text style={[styles.optionLabel, { color: showAsCorrect || showAsIncorrectSelected ? theme.colors.text : FIGMA.optionText }]}>
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

      {/* Feedback Banner – after check: correct (green) or incorrect (red) */}
      {showResult && isCorrect === true && (
        <View style={[styles.feedbackBanner, { backgroundColor: FIGMA.feedbackSuccess }]} accessibilityRole="alert">
          <Ionicons name="checkmark-circle" size={20} color={FIGMA.ctaText} />
          <Text style={[styles.feedbackText, { color: FIGMA.ctaText }]}>Excellent! That's correct!</Text>
        </View>
      )}
      {showResult && isCorrect === false && (
        <View style={[styles.feedbackBanner, { backgroundColor: FIGMA.optionIncorrectBorder }]} accessibilityRole="alert">
          <Ionicons name="close-circle" size={20} color={FIGMA.ctaText} />
          <Text style={[styles.feedbackText, { color: FIGMA.ctaText }]}>That's incorrect.</Text>
        </View>
      )}

      {/* Footer CTA – Figma: h-56 rounded-[20px] font-semibold; disabled slate-200/slate-400; enabled gradient blue-600 → indigo-600 */}
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

const OPTION_PADDING_H = 24;
const OPTION_PADDING_V = 16;
const RADIUS_OPTION = 16;
const RADIUS_CTA = 20;
const CTA_HEIGHT = 56;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: baseTheme.spacing.md,
  },
  instruction: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
  },
  sourceText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 24,
    flex: 1,
  },
  prompt: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 20,
    marginBottom: baseTheme.spacing.sm,
  },
  optionsContainer: {
    gap: 12,
  },
  optionOuter: {
    borderRadius: RADIUS_OPTION,
    borderWidth: 2,
    overflow: 'hidden',
  },
  optionSelectedShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  optionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: OPTION_PADDING_H,
    paddingVertical: OPTION_PADDING_V,
    borderRadius: RADIUS_OPTION - 2,
    minHeight: 56,
  },
  optionLabel: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 16,
    flex: 1,
  },
  errorContainer: {
    padding: baseTheme.spacing.lg,
    borderRadius: RADIUS_OPTION,
    borderWidth: 2,
  },
  errorText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: baseTheme.spacing.xs,
    paddingVertical: baseTheme.spacing.sm,
    paddingHorizontal: baseTheme.spacing.md,
    borderRadius: RADIUS_OPTION,
  },
  feedbackText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
  },
  ctaWrap: {
    alignSelf: 'stretch',
  },
  ctaDisabled: {
    opacity: 1,
  },
  ctaPressed: {
    opacity: 0.95,
  },
  ctaButton: {
    height: CTA_HEIGHT,
    borderRadius: RADIUS_CTA,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 4,
  },
  ctaText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
});
