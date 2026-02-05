import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect, useCallback } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import {
  translateStyles as styles,
  FLASHCARD_GRADIENT,
  FLASHCARD_USAGE_ICON_SLATE,
} from './translateStyles';

import { CARD_TYPE_COLORS } from '@/features/session/constants/cardTypeColors';
import { SpeakerButton } from '@/components/ui';
import { useTtsAudio } from '@/hooks/useTtsAudio';
import { createLogger } from '@/services/logging';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import { TranslateCard as TranslateCardType } from '@/types/session';

const Logger = createLogger('TranslateCard');

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
  /** Current incorrect attempt count (for showing "Try Again" vs "Continue") */
  incorrectAttemptCount?: number;
};

export function TranslateCard({
  card,
  userAnswer = '',
  onAnswerChange,
  showHint,
  showResult = false,
  isCorrect,
  grammaticalCorrectness: _grammaticalCorrectness,
  meaningCorrect,
  naturalPhrasing,
  feedbackWhy,
  acceptedVariants = [],
  validationFeedback: _validationFeedback,
  showSuggestedAnswer = false,
  onCheckAnswer,
  onTryAgain,
  onRating,
  selectedRating,
  incorrectAttemptCount: _incorrectAttemptCount = 0,
}: Props) {
  const ctx = useAppTheme();
  const theme = ctx?.theme ?? baseTheme;
  const { speak, isSpeaking } = useTtsAudio();
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

  const handlePlaySourceAudio = useCallback(async () => {
    const textToSpeak = card.source || '';
    if (!textToSpeak) return;

    const language = card.kind === 'translate_to_en' ? 'it-IT' : 'en-US';
    await speak(textToSpeak, language);
  }, [card.source, card.kind, speak]);

  // Flashcard Mode (P24) – same card styling and emojis as TeachCard
  if (card.isFlashcard) {
    return (
      <View style={[styles.container, isFlipped && styles.flashcardContainerCompact]}>
        {!isFlipped ? (
          // Front: same teach-card look – gradient, emoji, phrase, speaker
          <>
            <LinearGradient
              colors={FLASHCARD_GRADIENT}
              style={[
                styles.flashcardTeachCard,
                { borderLeftWidth: 3, borderLeftColor: CARD_TYPE_COLORS.translate.border },
              ]}
            >
              <View style={styles.flashcardTeachCardInner}>
                {card.emoji ? <Text style={styles.flashcardTeachEmoji}>{card.emoji}</Text> : null}
                <View style={styles.flashcardPhraseBlock}>
                  <Text style={[styles.flashcardTeachPhrase, { color: theme.colors.text }]}>
                    {card.source}
                  </Text>
                </View>
                <SpeakerButton
                  size={80}
                  isPlaying={isSpeaking}
                  onPress={handlePlaySourceAudio}
                  showTapHint
                  tapHintText="Tap to listen"
                  accessibilityLabel={isSpeaking ? 'Playing audio' : 'Play pronunciation'}
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
              <Ionicons
                name="swap-horizontal"
                size={20}
                color="#fff"
                accessible={false}
                importantForAccessibility="no"
              />
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
                    onPress={() => {
                      Logger.info('Rating button pressed: Hard (0)');
                      onRating?.(0);
                    }}
                  >
                    <Ionicons
                      name="thumbs-down"
                      size={24}
                      color="#dc3545"
                      accessible={false}
                      importantForAccessibility="no"
                    />
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
                    onPress={() => {
                      Logger.info('Rating button pressed: Good (2.5)');
                      onRating?.(2.5);
                    }}
                  >
                    <Ionicons
                      name="remove"
                      size={24}
                      color="#ffc107"
                      accessible={false}
                      importantForAccessibility="no"
                    />
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
                    onPress={() => {
                      Logger.info('Rating button pressed: Easy (5)');
                      onRating?.(5);
                    }}
                  >
                    <Ionicons
                      name="thumbs-up"
                      size={24}
                      color="#28a745"
                      accessible={false}
                      importantForAccessibility="no"
                    />
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
                style={[
                  styles.flashcardTeachCard,
                  styles.flashcardTeachCardBack,
                  { borderLeftWidth: 3, borderLeftColor: CARD_TYPE_COLORS.translate.border },
                ]}
              >
                <View style={styles.flashcardBackInner}>
                  {card.emoji ? <Text style={styles.flashcardBackEmoji}>{card.emoji}</Text> : null}
                  <View style={styles.flashcardBackPhraseBlock}>
                    <Text style={[styles.flashcardBackPhrase, { color: theme.colors.text }]}>
                      {card.source}
                    </Text>
                    <Text
                      style={[styles.flashcardBackTranslation, { color: theme.colors.mutedText }]}
                    >
                      {card.expected}
                    </Text>
                  </View>
                  <SpeakerButton
                    size={64}
                    isPlaying={isSpeaking}
                    onPress={handlePlaySourceAudio}
                    showTapHint
                    tapHintText="Tap to listen"
                    accessibilityLabel={isSpeaking ? 'Playing audio' : 'Play pronunciation'}
                    accessibilityHint="Plays the word audio"
                  />
                </View>
              </LinearGradient>

              {card.usageNote ? (
                <View style={styles.flashcardUsageNoteCardCompact}>
                  <Ionicons
                    name="book-outline"
                    size={16}
                    color={FLASHCARD_USAGE_ICON_SLATE}
                    style={styles.flashcardUsageNoteIcon}
                  />
                  <Text
                    style={[
                      styles.flashcardUsageNoteTextCompact,
                      { color: theme.colors.mutedText },
                    ]}
                  >
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
              <Ionicons
                name="swap-horizontal"
                size={18}
                color="#fff"
                accessible={false}
                importantForAccessibility="no"
              />
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
                  onPress={() => {
                    Logger.info('Rating button pressed: Hard (0)');
                    onRating?.(0);
                  }}
                >
                  <Ionicons
                    name="thumbs-down"
                    size={20}
                    color="#dc3545"
                    accessible={false}
                    importantForAccessibility="no"
                  />
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
                  onPress={() => {
                    Logger.info('Rating button pressed: Good (2.5)');
                    onRating?.(2.5);
                  }}
                >
                  <Ionicons
                    name="remove"
                    size={20}
                    color="#ffc107"
                    accessible={false}
                    importantForAccessibility="no"
                  />
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
                  onPress={() => {
                    Logger.info('Rating button pressed: Easy (5)');
                    onRating?.(5);
                  }}
                >
                  <Ionicons
                    name="thumbs-up"
                    size={20}
                    color="#28a745"
                    accessible={false}
                    importantForAccessibility="no"
                  />
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
    <View style={styles.container} testID="translate-card">
      <Text style={[styles.instruction, { color: CARD_TYPE_COLORS.translate.instruction }]}>
        {instruction}
      </Text>

      {/* Source Text Card - Language String (e.g., "Ciao") */}
      <View
        style={[
          styles.sourceCard,
          { borderLeftWidth: 3, borderLeftColor: CARD_TYPE_COLORS.translate.border },
        ]}
      >
        <View style={styles.sourceTextContainer}>
          <Text style={styles.sourceText}>{card.source}</Text>
          <SpeakerButton
            size={40}
            isPlaying={isSpeaking}
            onPress={handlePlaySourceAudio}
            accessibilityLabel={isSpeaking ? 'Pause audio' : 'Play audio'}
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
          <Ionicons
            name="bulb"
            size={20}
            color={theme.colors.primary}
            accessible={false}
            importantForAccessibility="no"
          />
          <Text style={styles.hintButtonText}>{showHintState ? 'Hide hint' : 'Show hint'}</Text>
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
          testID="translate-input"
        />
      </View>

      {/* Custom Keyboard Hint (for Italian accents) */}
      {card.targetLanguage === 'it' && (
        <View style={styles.keyboardHint}>
          <Text style={styles.keyboardHintText}>Use accented characters: à è ì ò</Text>
        </View>
      )}

      {/* Check Answer Button */}
      {!showResult && userAnswer.trim().length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Check answer"
          style={styles.checkButton}
          onPress={onCheckAnswer}
          testID="translate-check-button"
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
            testID={isCorrect ? 'feedback-correct' : 'feedback-incorrect'}
          >
            <Ionicons
              name={
                isCorrect
                  ? 'checkmark-circle'
                  : meaningCorrect
                    ? 'information-circle'
                    : 'close-circle'
              }
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
                <Text style={styles.resultTitleCompact} allowFontScaling>
                  Correct!
                </Text>
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
                <Text style={styles.whyText} allowFontScaling>
                  {feedbackWhy}
                </Text>
              )}
            </View>
          </View>

          {/* Try Again Button - only show if incorrect and haven't reached max attempts */}
          {!isCorrect && !meaningCorrect && !showSuggestedAnswer && onTryAgain && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Try again"
              accessibilityHint="Clear result and try answering again"
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
    </View>
  );
}
