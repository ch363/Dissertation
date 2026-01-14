import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { getTtsEnabled, getTtsRate } from '@/services/preferences';
import { theme } from '@/services/theme/tokens';
import * as SafeSpeech from '@/services/tts';
import { TranslateCard as TranslateCardType } from '@/types/session';

type Props = {
  card: TranslateCardType;
  userAnswer?: string;
  onAnswerChange?: (answer: string) => void;
  showHint?: boolean;
  showResult?: boolean;
  isCorrect?: boolean;
  onCheckAnswer?: () => void;
};

export function TranslateCard({
  card,
  userAnswer = '',
  onAnswerChange,
  showHint,
  showResult = false,
  isCorrect,
  onCheckAnswer,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHintState, setShowHintState] = useState(showHint || false);

  const handlePlayAudio = async () => {
    try {
      const enabled = await getTtsEnabled();
      if (!enabled) return;
      setIsPlaying(true);
      const rate = await getTtsRate();
      await SafeSpeech.stop();
      // Speak the source text
      const textToSpeak = card.source || '';
      const language = card.kind === 'translate_to_en' ? 'it-IT' : 'en-US';
      await SafeSpeech.speak(textToSpeak, { language, rate });
      setTimeout(() => setIsPlaying(false), 2000);
    } catch (error) {
      console.error('Failed to play audio:', error);
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
          // Front of card
          <Pressable style={styles.flashcard} onPress={() => setIsFlipped(true)}>
            <View style={styles.flashcardContent}>
              <Text style={styles.flashcardWord}>{card.source}</Text>
              {card.audioUrl && (
                <Pressable style={styles.flashcardAudio} onPress={handlePlayAudio}>
                  <Ionicons
                    name={isPlaying ? 'pause' : 'volume-high'}
                    size={24}
                    color={theme.colors.primary}
                  />
                </Pressable>
              )}
              <Text style={styles.flashcardGrammar}>noun, feminine</Text>
            </View>
          </Pressable>
        ) : (
          // Back of card
          <Pressable style={styles.flashcard} onPress={() => setIsFlipped(false)}>
            <View style={styles.flashcardContent}>
              <Text style={styles.flashcardTranslation}>{card.expected}</Text>
              <Text style={styles.flashcardMeaning}>Translation</Text>
            </View>
          </Pressable>
        )}

        <View style={styles.flipHint}>
          <Ionicons name="refresh" size={16} color={theme.colors.mutedText} />
          <Text style={styles.flipHintText}>Tap card to see translation</Text>
        </View>

        <Pressable
          style={styles.flipButton}
          onPress={() => setIsFlipped(!isFlipped)}
        >
          <Text style={styles.flipButtonText}>Flip Card</Text>
        </Pressable>
      </View>
    );
  }

  // Type Translation Mode (P30)
  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        {card.kind === 'translate_to_en' ? 'TRANSLATE TO ENGLISH' : 'TRANSLATE TO ITALIAN'}
      </Text>

      {/* Source Text Card */}
      <View style={styles.sourceCard}>
        <Text style={styles.sourceText}>{card.source}</Text>
        {card.audioUrl && (
          <Pressable style={styles.previewButton} onPress={handlePlayAudio}>
            <Ionicons
              name={isPlaying ? 'pause' : 'volume-high'}
              size={16}
              color="#fff"
            />
            <Text style={styles.previewText}>Preview</Text>
          </Pressable>
        )}
      </View>

      {/* Hint Button */}
      {card.hint && (
        <Pressable
          style={styles.hintButton}
          onPress={() => setShowHintState(!showHintState)}
        >
          <Ionicons name="bulb" size={20} color={theme.colors.primary} />
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
        <Pressable style={styles.checkButton} onPress={onCheckAnswer}>
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
            />
            <Text style={styles.resultTitle}>
              {isCorrect ? 'CORRECT!' : 'INCORRECT'}
            </Text>
            <View style={styles.answerContainer}>
              <Text style={styles.answerText}>{card.expected}</Text>
              <Pressable
                onPress={handlePlayAudio}
                style={styles.resultAudioButton}
              >
                <Ionicons name="volume-high" size={20} color={theme.colors.primary} />
              </Pressable>
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
    gap: theme.spacing.md,
  },
  directionLabel: {
    fontFamily: theme.typography.bold,
    fontSize: 12,
    color: '#28a745',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  instruction: {
    fontFamily: theme.typography.bold,
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
    padding: theme.spacing.xl,
  },
  flashcardContent: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  flashcardWord: {
    fontFamily: theme.typography.bold,
    fontSize: 36,
    color: theme.colors.text,
  },
  flashcardAudio: {
    padding: theme.spacing.sm,
  },
  flashcardGrammar: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    fontStyle: 'italic',
    color: theme.colors.mutedText,
  },
  flashcardTranslation: {
    fontFamily: theme.typography.bold,
    fontSize: 32,
    color: theme.colors.text,
  },
  flashcardMeaning: {
    fontFamily: theme.typography.regular,
    fontSize: 18,
    color: theme.colors.mutedText,
  },
  flipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    alignSelf: 'center',
  },
  flipHintText: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.mutedText,
  },
  flipButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  flipButtonText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
    color: '#fff',
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  sourceText: {
    fontFamily: theme.typography.regular,
    fontSize: 18,
    color: theme.colors.text,
    flex: 1,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 8,
  },
  previewText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 12,
    color: '#fff',
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  hintButtonText: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.primary,
  },
  hintCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  hintText: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.text,
  },
  inputCard: {
    gap: theme.spacing.sm,
  },
  inputLabel: {
    fontFamily: theme.typography.semiBold,
    fontSize: 14,
    color: theme.colors.text,
    textTransform: 'uppercase',
  },
  textInput: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    padding: theme.spacing.md,
    fontSize: 18,
    fontFamily: theme.typography.regular,
    color: theme.colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  keyboardHint: {
    padding: theme.spacing.sm,
  },
  keyboardHintText: {
    fontFamily: theme.typography.regular,
    fontSize: 12,
    color: theme.colors.mutedText,
    fontStyle: 'italic',
  },
  checkButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  checkButtonText: {
    color: '#fff',
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
  },
  resultCard: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    gap: theme.spacing.sm,
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
    fontFamily: theme.typography.bold,
    fontSize: 18,
    color: theme.colors.text,
    textTransform: 'uppercase',
  },
  answerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  answerText: {
    fontFamily: theme.typography.bold,
    fontSize: 24,
    color: theme.colors.text,
  },
  resultAudioButton: {
    padding: theme.spacing.xs,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  infoLabel: {
    fontFamily: theme.typography.bold,
    fontSize: 12,
    color: theme.colors.mutedText,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    color: theme.colors.text,
  },
  xpBar: {
    width: '100%',
    backgroundColor: '#28a745',
    borderRadius: 12,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  xpText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
    color: '#fff',
  },
});
