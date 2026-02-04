import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SpeakerButton } from '@/components/ui';
import { getTtsEnabled, getTtsRate } from '@/services/preferences';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import * as SafeSpeech from '@/services/tts';
import { TranslateCard as TranslateCardType } from '@/types/session';
import { createLogger } from '@/services/logging';
import { CARD_TYPE_COLORS } from '../../constants/cardTypeColors';

const Logger = createLogger('TranslateCard');

// Match TeachCard styling (Figma: blue-50 / indigo-50 gradient, 32px radius)
const FLASHCARD_GRADIENT = ['#eff6ff', '#e0e7ff', '#eff6ff'] as const;
const FLASHCARD_BORDER = 'rgba(191, 219, 254, 0.5)';
const FLASHCARD_USAGE_BG = 'rgba(248, 250, 252, 0.8)';
const FLASHCARD_USAGE_ICON_SLATE = '#94a3b8';
const FLASHCARD_RADIUS = 32;
const FLASHCARD_USAGE_RADIUS = 24;

type Props = {
  card: TranslateCardType;
  userAnswer?: string;
  onAnswerChange?: (answer: string) => void;
  showHint?: boolean;
  showResult?: boolean;
  isCorrect?: boolean;
  grammaticalCorrectness?: number | null;
  meaningCorrect?: boolean;
  naturalPhrasing?: string;
  feedbackWhy?: string;
  acceptedVariants?: string[];
  validationFeedback?: string;
  /** When false, hide suggested/correct answer until user has had 3 incorrect attempts (text input only). */
  showSuggestedAnswer?: boolean;
  onCheckAnswer?: () => void;
  onTryAgain?: () => void;
  onRating?: (rating: number) => void;
  selectedRating?: number;
};

export function TranslateCard({
  card,
  userAnswer = '',
  onAnswerChange,
  showHint,
  showResult = false,
  isCorrect,
  grammaticalCorrectness,
  meaningCorrect,
  naturalPhrasing,
  feedbackWhy,
  acceptedVariants = [],
  validationFeedback,
  showSuggestedAnswer = false,
  onCheckAnswer,
  onTryAgain,
  onRating,
  selectedRating,
}: Props) {
  const ctx = useAppTheme();
  const theme = ctx?.theme ?? baseTheme;
  const [isPlaying, setIsPlaying] = useState(false);
  // For flashcards, start with front showing (not flipped) - user flips to see answer
  const [isFlipped, setIsFlipped] = useState(false);
  // Once user has flipped to see the answer, show rating on unflipped side too when they flip back
  const [hasRevealedAnswer, setHasRevealedAnswer] = useState(false);
  // Hint starts collapsed (showHint from parent is undefined by default) for productive struggle; label shows "Show hint" / "Hide hint".
  const [showHintState, setShowHintState] = useState(showHint ?? false);
  const [showWhy, setShowWhy] = useState(false);
  
  // Reset flip state and Why disclosure when card changes
  useEffect(() => {
    setIsFlipped(false);
    setHasRevealedAnswer(false);
    setShowWhy(false);
  }, [card.id]);
  
  const handleFlip = () => {
    if (!isFlipped) setHasRevealedAnswer(true);
    setIsFlipped(!isFlipped);
  };

  const handlePlaySourceAudio = async () => {
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
      
      // Speak the source text (language string like "Ciao")
      const textToSpeak = card.source || '';
      if (!textToSpeak) {
        setIsPlaying(false);
        return;
      }
      
      const language = card.kind === 'translate_to_en' ? 'it-IT' : 'en-US';
      await SafeSpeech.speak(textToSpeak, { language, rate });
      
      // Reset playing state after estimated duration
      const estimatedDuration = Math.max(2000, textToSpeak.length * 150);
      setTimeout(() => setIsPlaying(false), estimatedDuration);
    } catch (error) {
      Logger.error('Failed to play audio', error);
      setIsPlaying(false);
    }
  };

  // Flashcard Mode (P24) – same card styling and emojis as TeachCard
  if (card.isFlashcard) {
    return (
      <View style={[styles.container, isFlipped && styles.flashcardContainerCompact]}>
        {!isFlipped ? (
          // Front: same teach-card look – gradient, emoji, phrase, speaker
          <>
            <LinearGradient
              colors={FLASHCARD_GRADIENT}
              style={[styles.flashcardTeachCard, { borderLeftWidth: 3, borderLeftColor: CARD_TYPE_COLORS.translate.border }]}
            >
              <View style={styles.flashcardTeachCardInner}>
                {card.emoji ? (
                  <Text style={styles.flashcardTeachEmoji}>{card.emoji}</Text>
                ) : null}
                <View style={styles.flashcardPhraseBlock}>
                  <Text style={[styles.flashcardTeachPhrase, { color: theme.colors.text }]}>
                    {card.source}
                  </Text>
                </View>
                <SpeakerButton
                  size={80}
                  isPlaying={isPlaying}
                  onPress={handlePlaySourceAudio}
                  showTapHint
                  tapHintText="Tap to listen"
                  accessibilityLabel={isPlaying ? 'Playing audio' : 'Play pronunciation'}
                  accessibilityHint="Plays the word audio"
                />
              </View>
            </LinearGradient>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Flip card"
              accessibilityHint="Shows the answer side of the flashcard"
              style={styles.flipButton}
              onPress={handleFlip}
            >
              <Ionicons name="swap-horizontal" size={20} color="#fff" accessible={false} importantForAccessibility="no" />
              <Text style={styles.flipButtonText}>Flip to see answer</Text>
            </Pressable>

            {hasRevealedAnswer && (
              <View style={styles.ratingCard}>
                <Text style={styles.ratingTitle}>How well did you know this?</Text>
                <View style={styles.ratingButtons}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Rate hard"
                    accessibilityState={{ selected: selectedRating === 0 }}
                    style={[
                      styles.ratingButton,
                      styles.ratingButtonHard,
                      selectedRating === 0 && styles.ratingButtonSelected,
                    ]}
                    onPress={() => { Logger.info('Rating button pressed: Hard (0)'); onRating?.(0); }}
                  >
                    <Ionicons name="thumbs-down" size={24} color="#dc3545" accessible={false} importantForAccessibility="no" />
                    <Text style={[styles.ratingButtonText, styles.ratingButtonTextHard]}>Hard</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Rate good"
                    accessibilityState={{ selected: selectedRating === 2.5 }}
                    style={[
                      styles.ratingButton,
                      styles.ratingButtonGood,
                      selectedRating === 2.5 && styles.ratingButtonSelected,
                    ]}
                    onPress={() => { Logger.info('Rating button pressed: Good (2.5)'); onRating?.(2.5); }}
                  >
                    <Ionicons name="remove" size={24} color="#ffc107" accessible={false} importantForAccessibility="no" />
                    <Text style={[styles.ratingButtonText, styles.ratingButtonTextGood]}>Good</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Rate easy"
                    accessibilityState={{ selected: selectedRating === 5 }}
                    style={[
                      styles.ratingButton,
                      styles.ratingButtonEasy,
                      selectedRating === 5 && styles.ratingButtonSelected,
                    ]}
                    onPress={() => { Logger.info('Rating button pressed: Easy (5)'); onRating?.(5); }}
                  >
                    <Ionicons name="thumbs-up" size={24} color="#28a745" accessible={false} importantForAccessibility="no" />
                    <Text style={[styles.ratingButtonText, styles.ratingButtonTextEasy]}>Easy</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </>
        ) : (
          // Back: answer (phrase) much bigger, translation smaller; compact layout to fit one page
          <>
            <View style={styles.flashcardBackWrap}>
              <LinearGradient
                colors={FLASHCARD_GRADIENT}
                style={[styles.flashcardTeachCard, styles.flashcardTeachCardBack, { borderLeftWidth: 3, borderLeftColor: CARD_TYPE_COLORS.translate.border }]}
              >
                <View style={styles.flashcardBackInner}>
                  {card.emoji ? (
                    <Text style={styles.flashcardBackEmoji}>{card.emoji}</Text>
                  ) : null}
                  <View style={styles.flashcardBackPhraseBlock}>
                    <Text style={[styles.flashcardBackPhrase, { color: theme.colors.text }]}>
                      {card.source}
                    </Text>
                    <Text style={[styles.flashcardBackTranslation, { color: theme.colors.mutedText }]}>
                      {card.expected}
                    </Text>
                  </View>
                  <SpeakerButton
                    size={64}
                    isPlaying={isPlaying}
                    onPress={handlePlaySourceAudio}
                    showTapHint
                    tapHintText="Tap to listen"
                    accessibilityLabel={isPlaying ? 'Playing audio' : 'Play pronunciation'}
                    accessibilityHint="Plays the word audio"
                  />
                </View>
              </LinearGradient>

              {card.usageNote ? (
                <View style={styles.flashcardUsageNoteCardCompact}>
                  <Ionicons name="book-outline" size={16} color={FLASHCARD_USAGE_ICON_SLATE} style={styles.flashcardUsageNoteIcon} />
                  <Text style={[styles.flashcardUsageNoteTextCompact, { color: theme.colors.mutedText }]}>
                    {card.usageNote}
                  </Text>
                </View>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Flip card"
              accessibilityHint="Shows the question side of the flashcard"
              style={styles.flipButtonCompact}
              onPress={handleFlip}
            >
              <Ionicons name="swap-horizontal" size={18} color="#fff" accessible={false} importantForAccessibility="no" />
              <Text style={styles.flipButtonText}>Flip to see question</Text>
            </Pressable>

            <View style={styles.ratingCardCompact}>
              <Text style={styles.ratingTitleCompact}>How well did you know this?</Text>
              <View style={styles.ratingButtons}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Rate hard"
                  accessibilityState={{ selected: selectedRating === 0 }}
                  style={[
                    styles.ratingButtonCompact,
                    styles.ratingButtonHard,
                    selectedRating === 0 && styles.ratingButtonSelected,
                  ]}
                  onPress={() => { Logger.info('Rating button pressed: Hard (0)'); onRating?.(0); }}
                >
                  <Ionicons name="thumbs-down" size={20} color="#dc3545" accessible={false} importantForAccessibility="no" />
                  <Text style={[styles.ratingButtonText, styles.ratingButtonTextHard]}>Hard</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Rate good"
                  accessibilityState={{ selected: selectedRating === 2.5 }}
                  style={[
                    styles.ratingButtonCompact,
                    styles.ratingButtonGood,
                    selectedRating === 2.5 && styles.ratingButtonSelected,
                  ]}
                  onPress={() => { Logger.info('Rating button pressed: Good (2.5)'); onRating?.(2.5); }}
                >
                  <Ionicons name="remove" size={20} color="#ffc107" accessible={false} importantForAccessibility="no" />
                  <Text style={[styles.ratingButtonText, styles.ratingButtonTextGood]}>Good</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Rate easy"
                  accessibilityState={{ selected: selectedRating === 5 }}
                  style={[
                    styles.ratingButtonCompact,
                    styles.ratingButtonEasy,
                    selectedRating === 5 && styles.ratingButtonSelected,
                  ]}
                  onPress={() => { Logger.info('Rating button pressed: Easy (5)'); onRating?.(5); }}
                >
                  <Ionicons name="thumbs-up" size={20} color="#28a745" accessible={false} importantForAccessibility="no" />
                  <Text style={[styles.ratingButtonText, styles.ratingButtonTextEasy]}>Easy</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </View>
    );
  }

  // Type Translation Mode (P30) – use backend prompt when specific, else direction label
  const instruction =
    card.prompt && card.prompt.trim() && card.prompt.toLowerCase() !== 'translate'
      ? card.prompt.trim().toUpperCase()
      : card.kind === 'translate_to_en'
        ? 'TRANSLATE TO ENGLISH'
        : 'TRANSLATE TO ITALIAN';

  return (
    <View style={styles.container}>
      <Text style={[styles.instruction, { color: CARD_TYPE_COLORS.translate.instruction }]}>{instruction}</Text>

      {/* Source Text Card - Language String (e.g., "Ciao") */}
      <View style={[styles.sourceCard, { borderLeftWidth: 3, borderLeftColor: CARD_TYPE_COLORS.translate.border }]}>
        <View style={styles.sourceTextContainer}>
          <Text style={styles.sourceText}>{card.source}</Text>
          <SpeakerButton
            size={40}
            isPlaying={isPlaying}
            onPress={handlePlaySourceAudio}
            accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
            accessibilityHint="Plays the phrase audio"
          />
        </View>
      </View>

      {/* Hint Button */}
      {card.hint && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showHintState ? 'Hide hint' : 'Show hint'}
          style={styles.hintButton}
          onPress={() => setShowHintState(!showHintState)}
        >
          <Ionicons name="bulb" size={20} color={theme.colors.primary} accessible={false} importantForAccessibility="no" />
          <Text style={styles.hintButtonText}>
            {showHintState ? 'Hide hint' : 'Show hint'}
          </Text>
        </Pressable>
      )}

      {showHintState && card.hint && (
        <View style={styles.hintCard}>
          <Text style={styles.hintText}>{card.hint}</Text>
        </View>
      )}

      {/* Input Card */}
      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>
          {card.targetLanguage === 'en'
            ? 'Type your answer in English'
            : 'Type your answer in Italian'}
        </Text>
          <TextInput
          style={styles.textInput}
          value={userAnswer}
          onChangeText={onAnswerChange}
          placeholder="Type your translation..."
          autoFocus
          multiline
          editable={!showResult}
          accessibilityLabel="Your translation"
        />
      </View>

      {/* Custom Keyboard Hint (for Italian accents) */}
      {card.targetLanguage === 'it' && (
        <View style={styles.keyboardHint}>
          <Text style={styles.keyboardHintText}>
            Use accented characters: à è ì ò
          </Text>
        </View>
      )}

      {/* Check Answer Button */}
      {!showResult && userAnswer.trim().length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Check answer"
          style={styles.checkButton}
          onPress={onCheckAnswer}
        >
          <Text style={styles.checkButtonText}>Check Answer</Text>
        </Pressable>
      )}

      {/* Result Display – compact, with optional Why? disclosure */}
      {showResult && (
        <>
          <View
            style={[
              styles.resultCardCompact,
              isCorrect
                ? styles.resultCardCorrect
                : meaningCorrect
                  ? styles.resultCardMeaningCorrect
                  : styles.resultCardWrong,
            ]}
            accessibilityRole="alert"
            accessibilityLabel={
              isCorrect
                ? 'Correct'
                : meaningCorrect && showSuggestedAnswer
                  ? `Meaning correct. More natural phrasing: ${naturalPhrasing ?? card.expected}`
                  : 'Not quite'
            }
          >
            <Ionicons
              name={isCorrect ? 'checkmark-circle' : meaningCorrect ? 'information-circle' : 'close-circle'}
              size={32}
              color={
                isCorrect
                  ? (theme.colors.success ?? '#28a745')
                  : meaningCorrect
                    ? (theme.colors.primary ?? '#f59e0b')
                    : (theme.colors.error ?? '#dc3545')
              }
              accessible={false}
              importantForAccessibility="no"
            />
            <View style={styles.resultContentCompact}>
              {isCorrect && (
                <Text style={styles.resultTitleCompact} allowFontScaling>Correct!</Text>
              )}
              {meaningCorrect && !isCorrect && naturalPhrasing && showSuggestedAnswer && (
                <>
                  <Text style={styles.resultMessageCompact} allowFontScaling>
                    Meaning is correct, but more natural:
                  </Text>
                  <View style={styles.suggestedAnswerBlock}>
                    <Text style={styles.suggestedAnswerText} allowFontScaling selectable>
                      {naturalPhrasing}
                    </Text>
                  </View>
                </>
              )}
              {!isCorrect && !meaningCorrect && (
                <>
                  <Text style={styles.resultMessageCompact} allowFontScaling>
                    Not quite.
                  </Text>
                  {showSuggestedAnswer ? (
                    <>
                      <Text style={styles.suggestedAnswerLabel} allowFontScaling>
                        Suggested answer:
                      </Text>
                      <View style={styles.suggestedAnswerBlock}>
                        <Text style={styles.suggestedAnswerText} allowFontScaling selectable>
                          {naturalPhrasing ?? card.expected}
                        </Text>
                      </View>
                    </>
                  ) : null}
                </>
              )}
              {showSuggestedAnswer && acceptedVariants != null && acceptedVariants.length > 0 && (
                <Text style={styles.acceptedVariantsText} allowFontScaling>
                  Also accepted: {acceptedVariants.join(', ')}
                </Text>
              )}
              {feedbackWhy && (
                <Pressable
                  onPress={() => setShowWhy((prev) => !prev)}
                  style={styles.whyButton}
                  accessibilityRole="button"
                  accessibilityLabel={showWhy ? 'Hide why' : 'Show why'}
                  accessibilityState={{ expanded: showWhy }}
                >
                  <Text style={styles.whyButtonText}>{showWhy ? 'Hide why' : 'Why?'}</Text>
                </Pressable>
              )}
              {showWhy && feedbackWhy && (
                <Text style={styles.whyText} allowFontScaling>{feedbackWhy}</Text>
              )}
            </View>
          </View>

        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    gap: baseTheme.spacing.sm,
  },
  instruction: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  flashcardContainerCompact: {
    gap: baseTheme.spacing.xs,
  },
  // Flashcard – same styling as TeachCard (gradient, 32px radius, phrase/translation typography)
  flashcardTeachCard: {
    width: '100%',
    borderRadius: FLASHCARD_RADIUS,
    borderWidth: 1,
    borderColor: FLASHCARD_BORDER,
    paddingHorizontal: baseTheme.spacing.xl,
    paddingVertical: baseTheme.spacing.xl + 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    overflow: 'hidden',
  },
  flashcardTeachCardInner: {
    alignItems: 'center',
    gap: baseTheme.spacing.md,
  },
  flashcardTeachEmoji: {
    fontSize: 42,
    marginBottom: baseTheme.spacing.xs,
  },
  flashcardPhraseBlock: {
    alignItems: 'center',
    gap: baseTheme.spacing.xs,
    marginBottom: baseTheme.spacing.sm,
    paddingTop: 4,
  },
  flashcardTeachPhrase: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 44,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 54,
  },
  flashcardTeachTranslation: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Back of card: answer much bigger, translation smaller, compact to fit one page
  flashcardBackWrap: {
    gap: baseTheme.spacing.xs,
  },
  flashcardTeachCardBack: {
    paddingVertical: baseTheme.spacing.md + 2,
  },
  flashcardBackInner: {
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
  },
  flashcardBackEmoji: {
    fontSize: 36,
    marginBottom: 0,
  },
  flashcardBackPhraseBlock: {
    alignItems: 'center',
    gap: 2,
    marginBottom: 0,
    paddingTop: 0,
  },
  flashcardBackPhrase: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 56,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 64,
  },
  flashcardBackTranslation: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  flashcardUsageNoteCardCompact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: baseTheme.spacing.sm + 2,
    paddingVertical: baseTheme.spacing.sm,
    borderRadius: FLASHCARD_USAGE_RADIUS,
    backgroundColor: FLASHCARD_USAGE_BG,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  flashcardUsageNoteTextCompact: {
    flex: 1,
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  flashcardUsageNoteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingHorizontal: baseTheme.spacing.md + 4,
    paddingVertical: baseTheme.spacing.md,
    borderRadius: FLASHCARD_USAGE_RADIUS,
    backgroundColor: FLASHCARD_USAGE_BG,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  flashcardUsageNoteIcon: {
    marginTop: 2,
  },
  flashcardUsageNoteText: {
    flex: 1,
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  ratingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: baseTheme.spacing.md,
    marginTop: baseTheme.spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  ratingCardCompact: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: baseTheme.spacing.sm,
    marginTop: baseTheme.spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  ratingTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
    color: baseTheme.colors.text,
    marginBottom: baseTheme.spacing.sm,
    textAlign: 'center',
  },
  ratingTitleCompact: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 13,
    color: baseTheme.colors.text,
    marginBottom: baseTheme.spacing.xs,
    textAlign: 'center',
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: baseTheme.spacing.xs,
  },
  ratingButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: baseTheme.spacing.md,
    paddingHorizontal: baseTheme.spacing.xs,
    borderRadius: 12,
    borderWidth: 2,
    minHeight: 80,
    maxHeight: 90,
    justifyContent: 'center',
    gap: baseTheme.spacing.xs,
  },
  ratingButtonCompact: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: baseTheme.spacing.sm,
    paddingHorizontal: baseTheme.spacing.xs,
    borderRadius: 10,
    borderWidth: 2,
    minHeight: 56,
    maxHeight: 64,
    justifyContent: 'center',
    gap: 2,
  },
  ratingButtonHard: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  ratingButtonGood: {
    borderColor: '#ffc107',
    backgroundColor: '#fffbf0',
  },
  ratingButtonEasy: {
    borderColor: '#28a745',
    backgroundColor: '#f0fff4',
  },
  ratingButtonSelected: {
    borderWidth: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  ratingButtonText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 12,
  },
  ratingButtonTextHard: {
    color: '#dc3545',
  },
  ratingButtonTextGood: {
    color: '#ffc107',
  },
  ratingButtonTextEasy: {
    color: '#28a745',
  },
  flipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.xs,
    alignSelf: 'center',
  },
  flipHintText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    color: baseTheme.colors.mutedText,
  },
  flipButton: {
    backgroundColor: baseTheme.colors.primary,
    padding: baseTheme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: baseTheme.spacing.xs,
    marginTop: baseTheme.spacing.sm,
  },
  flipButtonCompact: {
    backgroundColor: baseTheme.colors.primary,
    padding: baseTheme.spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: baseTheme.spacing.xs,
    marginTop: baseTheme.spacing.xs,
  },
  flipButtonText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
    color: '#fff',
  },
  sourceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: baseTheme.spacing.lg,
  },
  sourceTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.md,
  },
  sourceText: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 32,
    color: baseTheme.colors.text,
    flex: 1,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.xs,
    alignSelf: 'flex-start',
  },
  hintButtonText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    color: baseTheme.colors.primary,
  },
  hintCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: baseTheme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  hintText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    color: baseTheme.colors.text,
  },
  inputCard: {
    gap: baseTheme.spacing.sm,
  },
  inputLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
    color: baseTheme.colors.text,
  },
  textInput: {
    borderWidth: 2,
    borderColor: baseTheme.colors.primary,
    borderRadius: 12,
    padding: baseTheme.spacing.md,
    fontSize: 18,
    fontFamily: baseTheme.typography.regular,
    color: baseTheme.colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  keyboardHint: {
    padding: baseTheme.spacing.sm,
  },
  keyboardHintText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 12,
    color: baseTheme.colors.mutedText,
    fontStyle: 'italic',
  },
  checkButton: {
    backgroundColor: baseTheme.colors.primary,
    padding: baseTheme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: baseTheme.spacing.md,
  },
  checkButtonText: {
    color: '#fff',
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
  resultCard: {
    marginTop: baseTheme.spacing.md,
    padding: baseTheme.spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
    width: '100%',
  },
  resultCardCompact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: baseTheme.spacing.md,
    padding: baseTheme.spacing.md,
    borderRadius: 12,
    gap: baseTheme.spacing.sm,
    width: '100%',
    borderWidth: 2,
  },
  resultCardCorrect: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
  },
  resultCardMeaningCorrect: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
    paddingVertical: baseTheme.spacing.lg,
    paddingHorizontal: baseTheme.spacing.lg,
  },
  resultCardWrong: {
    backgroundColor: '#fef2f2',
    borderColor: '#dc3545',
    paddingVertical: baseTheme.spacing.lg,
    paddingHorizontal: baseTheme.spacing.lg,
  },
  resultContentCompact: {
    flex: 1,
    gap: baseTheme.spacing.sm,
    minWidth: 0,
  },
  resultTitleCompact: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 18,
    color: baseTheme.colors.text,
  },
  resultMessageCompact: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
    color: baseTheme.colors.text,
    lineHeight: 24,
  },
  suggestedAnswerLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 15,
    color: baseTheme.colors.text,
    marginTop: baseTheme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestedAnswerBlock: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: baseTheme.radius.sm,
    paddingVertical: baseTheme.spacing.md,
    paddingHorizontal: baseTheme.spacing.md,
    marginTop: baseTheme.spacing.xs,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  suggestedAnswerText: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 20,
    color: baseTheme.colors.text,
    lineHeight: 28,
  },
  acceptedVariantsText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    color: baseTheme.colors.mutedText,
    marginTop: baseTheme.spacing.xs,
    lineHeight: 20,
  },
  whyButton: {
    alignSelf: 'flex-start',
    marginTop: baseTheme.spacing.xs,
    paddingVertical: baseTheme.spacing.xs,
    paddingHorizontal: 0,
  },
  whyButtonText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
    color: baseTheme.colors.primary,
  },
  whyText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
    color: baseTheme.colors.mutedText,
    marginTop: baseTheme.spacing.xs,
    fontStyle: 'italic',
  },
  resultTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 18,
    color: baseTheme.colors.text,
    textTransform: 'uppercase',
  },
  answerComparison: {
    width: '100%',
    gap: baseTheme.spacing.md,
  },
  answerRow: {
    gap: baseTheme.spacing.xs,
  },
  answerLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 12,
    color: baseTheme.colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerValue: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 18,
    color: baseTheme.colors.text,
  },
  answerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
  },
  answerText: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 24,
    color: baseTheme.colors.text,
  },
  resultAudioButton: {
    padding: baseTheme.spacing.xs,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.xs,
    marginTop: baseTheme.spacing.md,
  },
  infoLabel: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 12,
    color: baseTheme.colors.mutedText,
    textTransform: 'uppercase',
    marginBottom: baseTheme.spacing.xs,
  },
  infoText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 16,
    color: baseTheme.colors.text,
  },
  xpBar: {
    width: '100%',
    backgroundColor: '#28a745',
    borderRadius: 12,
    padding: baseTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
    justifyContent: 'center',
    marginTop: baseTheme.spacing.md,
  },
  xpText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
    color: '#fff',
  },
});
