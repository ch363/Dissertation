import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { IconButton } from '@/components/ui';
import { getTtsEnabled, getTtsRate } from '@/services/preferences';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import * as SafeSpeech from '@/services/tts';
import { TranslateCard as TranslateCardType } from '@/types/session';
import { createLogger } from '@/services/logging';

const Logger = createLogger('TranslateCard');

type Props = {
  card: TranslateCardType;
  userAnswer?: string;
  onAnswerChange?: (answer: string) => void;
  showHint?: boolean;
  showResult?: boolean;
  isCorrect?: boolean;
  onCheckAnswer?: () => void;
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
  onCheckAnswer,
  onRating,
  selectedRating,
}: Props) {
  const ctx = useAppTheme();
  const theme = ctx?.theme ?? baseTheme;
  const [isPlaying, setIsPlaying] = useState(false);
  // For flashcards, start with front showing (not flipped) - user flips to see answer
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHintState, setShowHintState] = useState(showHint || false);
  
  // Reset flip state when card changes
  useEffect(() => {
    setIsFlipped(false);
  }, [card.id]);
  
  const handleFlip = () => {
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

  // Flashcard Mode (P24)
  if (card.isFlashcard) {
    return (
      <View style={styles.container}>
        <Text style={styles.directionLabel}>
          {card.kind === 'translate_to_en' ? 'ITALIAN → ENGLISH' : 'ENGLISH → ITALIAN'}
        </Text>

        {!isFlipped ? (
          // Front of card - Show source text (question)
          <>
            <View style={styles.flashcardFront}>
              <View style={styles.flashcardContent}>
                <Text style={styles.flashcardWord}>{card.source}</Text>
                <IconButton
                  accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
                  accessibilityHint="Plays the word audio"
                  onPress={handlePlaySourceAudio}
                  style={styles.flashcardAudio}
                >
                  <Ionicons
                    name={isPlaying ? 'pause' : 'volume-high'}
                    size={32}
                    color={theme.colors.primary}
                    accessible={false}
                    importantForAccessibility="no"
                  />
                </IconButton>
                {card.grammar && (
                  <Text style={styles.flashcardGrammar}>{card.grammar}</Text>
                )}
              </View>
            </View>
            
            {/* Flip Button on Front */}
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
          </>
        ) : (
          // Back of card - Answer view with gradient and rating
          <>
            <View style={styles.flashcardBack}>
              <LinearGradient
                colors={['#20B2AA', '#4A90E2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.flashcardGradient}
              >
                <View style={styles.flashcardAnswerHeader}>
                  <Text style={styles.flashcardAnswerText}>{card.expected}</Text>
                  <IconButton
                    accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
                    accessibilityHint="Plays the answer audio"
                    onPress={handlePlaySourceAudio}
                    style={styles.flashcardAnswerAudio}
                  >
                    <Ionicons
                      name={isPlaying ? 'pause' : 'volume-high'}
                      size={24}
                      color="#fff"
                      accessible={false}
                      importantForAccessibility="no"
                    />
                  </IconButton>
                </View>
                <Text style={styles.flashcardOriginalWord}>{card.source}</Text>
                {card.example && (
                  <View style={styles.flashcardExample}>
                    <Text style={styles.flashcardExampleLabel}>Example:</Text>
                    <Text style={styles.flashcardExampleText}>{card.example}</Text>
                  </View>
                )}
              </LinearGradient>
            </View>

            {/* Flip Button on Back */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Flip card"
              accessibilityHint="Shows the question side of the flashcard"
              style={styles.flipButton}
              onPress={handleFlip}
            >
              <Ionicons name="swap-horizontal" size={20} color="#fff" accessible={false} importantForAccessibility="no" />
              <Text style={styles.flipButtonText}>Flip to see question</Text>
            </Pressable>

            {/* Rating Section */}
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
                  onPress={() => {
                    Logger.info('Rating button pressed: Good (2.5)');
                    onRating?.(2.5);
                  }}
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
                  onPress={() => {
                    Logger.info('Rating button pressed: Easy (5)');
                    onRating?.(5);
                  }}
                >
                  <Ionicons name="thumbs-up" size={24} color="#28a745" accessible={false} importantForAccessibility="no" />
                  <Text style={[styles.ratingButtonText, styles.ratingButtonTextEasy]}>Easy</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </View>
    );
  }

  // Type Translation Mode (P30)
  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        {card.kind === 'translate_to_en' ? 'TRANSLATE TO ENGLISH' : 'TRANSLATE TO ITALIAN'}
      </Text>

      {/* Source Text Card - Language String (e.g., "Ciao") */}
      <View style={styles.sourceCard}>
        <View style={styles.sourceTextContainer}>
          <Text style={styles.sourceText}>{card.source}</Text>
          <IconButton
            accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
            accessibilityHint="Plays the phrase audio"
            onPress={handlePlaySourceAudio}
            style={styles.sourceSpeakerButton}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'volume-high'}
              size={18}
              color={theme.colors.primary}
              accessible={false}
              importantForAccessibility="no"
            />
          </IconButton>
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
          TYPE IN {card.targetLanguage.toUpperCase()}:
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

      {/* Result Display */}
      {showResult && (
        <>
          <View style={[styles.resultCard, isCorrect ? styles.resultCardCorrect : styles.resultCardWrong]}>
            <Ionicons
              name={isCorrect ? 'checkmark-circle' : 'close-circle'}
              size={48}
              color={isCorrect ? '#28a745' : '#dc3545'}
              accessible={false}
              importantForAccessibility="no"
            />
            <Text style={styles.resultTitle}>
              {isCorrect ? 'CORRECT!' : 'INCORRECT'}
            </Text>
            <View style={styles.answerComparison}>
              <View style={styles.answerRow}>
                <Text style={styles.answerLabel}>Your answer</Text>
                <Text style={styles.answerValue}>{userAnswer.trim() || '(empty)'}</Text>
              </View>
              <View style={styles.answerRow}>
                <Text style={styles.answerLabel}>Correct answer</Text>
                <Text style={styles.answerValue}>{card.expected}</Text>
              </View>
            </View>
          </View>

          {isCorrect && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>MEANING</Text>
              <Text style={styles.infoText}>{card.source}</Text>
            </View>
          )}
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
  directionLabel: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 12,
    color: '#28a745',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: baseTheme.spacing.xs,
  },
  instruction: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 14,
    color: '#28a745',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  flashcard: {
    width: '100%',
    minHeight: 300,
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    justifyContent: 'center',
    alignItems: 'center',
    padding: baseTheme.spacing.xl,
  },
  flashcardFront: {
    width: '100%',
    minHeight: 200,
    maxHeight: 220,
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
    padding: baseTheme.spacing.xl,
  },
  flashcardContent: {
    alignItems: 'center',
    gap: baseTheme.spacing.md,
  },
  flashcardWord: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 36,
    color: baseTheme.colors.text,
  },
  flashcardAudio: {
    padding: baseTheme.spacing.sm,
  },
  flashcardGrammar: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    fontStyle: 'italic',
    color: baseTheme.colors.mutedText,
  },
  flashcardBack: {
    width: '100%',
    minHeight: 200,
    maxHeight: 220,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  flashcardGradient: {
    width: '100%',
    minHeight: 200,
    maxHeight: 220,
    paddingVertical: baseTheme.spacing.lg,
    paddingHorizontal: baseTheme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashcardAnswerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: baseTheme.spacing.sm,
    marginBottom: baseTheme.spacing.sm,
    width: '100%',
  },
  flashcardAnswerText: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 32,
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: baseTheme.spacing.xs,
  },
  flashcardAnswerAudio: {
    padding: baseTheme.spacing.xs,
  },
  flashcardOriginalWord: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: baseTheme.spacing.sm,
    opacity: 0.9,
    paddingHorizontal: baseTheme.spacing.xs,
  },
  flashcardExample: {
    marginTop: baseTheme.spacing.sm,
    paddingTop: baseTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: baseTheme.spacing.xs,
  },
  flashcardExampleLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
    color: '#fff',
    marginBottom: baseTheme.spacing.xs,
    opacity: 0.9,
  },
  flashcardExampleText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
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
  ratingTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
    color: baseTheme.colors.text,
    marginBottom: baseTheme.spacing.sm,
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
  sourceSpeakerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: baseTheme.colors.primary + '15', // 15 = ~8% opacity
    justifyContent: 'center',
    alignItems: 'center',
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
    textTransform: 'uppercase',
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
  resultCardCorrect: {
    backgroundColor: '#d4edda',
    borderWidth: 2,
    borderColor: '#28a745',
  },
  resultCardWrong: {
    backgroundColor: '#f8d7da',
    borderWidth: 2,
    borderColor: '#dc3545',
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
