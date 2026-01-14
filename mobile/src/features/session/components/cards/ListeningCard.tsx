import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { getTtsEnabled, getTtsRate } from '@/services/preferences';
import { theme } from '@/services/theme/tokens';
import * as SafeSpeech from '@/services/tts';
import { ListeningCard as ListeningCardType } from '@/types/session';

type Props = {
  card: ListeningCardType;
  userAnswer?: string;
  onAnswerChange?: (answer: string) => void;
  showResult?: boolean;
  isCorrect?: boolean;
  onCheckAnswer?: () => void;
};

export function ListeningCard({
  card,
  userAnswer = '',
  onAnswerChange,
  showResult = false,
  isCorrect,
  onCheckAnswer,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const mode = card.mode || 'type'; // 'type' or 'speak'

  const handlePlayAudio = async () => {
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
      
      // For "Type What You Hear", speak the expected answer
      // For "Speak This Phrase", speak the phrase to practice
      const textToSpeak = card.expected || card.audioUrl || '';
      if (!textToSpeak) {
        setIsPlaying(false);
        return;
      }
      
      await SafeSpeech.speak(textToSpeak, { language: 'it-IT', rate });
      
      // Reset playing state after estimated duration
      const estimatedDuration = Math.max(2000, textToSpeak.length * 150);
      setTimeout(() => setIsPlaying(false), estimatedDuration);
    } catch (error) {
      console.error('Failed to play audio:', error);
      setIsPlaying(false);
    }
  };

  if (mode === 'speak') {
    // Speech Practice Mode (P22/P23)
    return (
      <View style={styles.container}>
        <Text style={styles.instruction}>SPEAK THIS PHRASE</Text>

        {!showResult ? (
          // Practice Screen
          <>
            <View style={styles.phraseCard}>
              <Text style={styles.phraseText}>{card.expected}</Text>
              <Text style={styles.phraseTranslation}>(Translation)</Text>
            </View>

            <Pressable style={styles.audioButton} onPress={handlePlayAudio}>
              <Ionicons
                name={isPlaying ? 'pause' : 'volume-high'}
                size={32}
                color={theme.colors.primary}
              />
            </Pressable>

            <Pressable style={styles.recordButton}>
              <Ionicons name="mic" size={48} color="#fff" />
            </Pressable>

            <Text style={styles.recordHint}>Tap to record your pronunciation</Text>
          </>
        ) : (
          // Result Screen
          <>
            <View style={styles.phraseCard}>
              <Text style={styles.phraseText}>{card.expected}</Text>
              <Text style={styles.phraseTranslation}>(Translation)</Text>
            </View>

            <View style={styles.resultCard}>
              <Ionicons name="checkmark-circle" size={48} color="#28a745" />
              <Text style={styles.resultTitle}>PRONUNCIATION RESULT</Text>
              <Text style={styles.score}>92%</Text>
              <Text style={styles.scoreLabel}>Pronunciation Score</Text>
            </View>

            <View style={styles.analysisCard}>
              <Text style={styles.analysisTitle}>WORD-BY-WORD ANALYSIS</Text>
              <View style={styles.wordAnalysis}>
                <View style={styles.wordItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#28a745" />
                  <Text style={styles.wordText}>Word 1</Text>
                  <Text style={styles.wordFeedback}>Perfect</Text>
                </View>
                <View style={styles.wordItem}>
                  <Ionicons name="alert-circle" size={20} color="#ff9800" />
                  <Text style={styles.wordText}>Word 2</Text>
                  <Text style={styles.wordFeedback}>Could improve</Text>
                  <Ionicons name="volume-high" size={16} color={theme.colors.primary} />
                </View>
              </View>
            </View>
          </>
        )}
      </View>
    );
  }

  // Type What You Hear Mode (P28/P29)
  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>TYPE WHAT YOU HEAR</Text>

      {!showResult ? (
        // Input Screen
        <>
          <View style={styles.audioCard}>
            <Pressable style={styles.audioButtonLarge} onPress={handlePlayAudio}>
              <Ionicons
                name={isPlaying ? 'pause' : 'volume-high'}
                size={40}
                color="#fff"
              />
            </Pressable>
          </View>

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>YOUR ANSWER:</Text>
            <TextInput
              style={styles.textInput}
              value={userAnswer}
              onChangeText={onAnswerChange}
              placeholder="Type here..."
              autoFocus
              editable={!showResult}
            />
          </View>
          {!showResult && userAnswer.trim().length > 0 && (
            <Pressable style={styles.checkButton} onPress={onCheckAnswer}>
              <Text style={styles.checkButtonText}>Check Answer</Text>
            </Pressable>
          )}
        </>
      ) : (
        // Result Screen
        <>
          <View style={styles.audioCard}>
            <Pressable style={styles.audioButtonLarge} onPress={handlePlayAudio}>
              <Ionicons
                name={isPlaying ? 'pause' : 'volume-high'}
                size={40}
                color="#fff"
              />
            </Pressable>
          </View>

          <View style={[styles.resultCard, isCorrect ? styles.resultCardCorrect : styles.resultCardWrong]}>
            <Ionicons
              name={isCorrect ? 'checkmark-circle' : 'close-circle'}
              size={48}
              color={isCorrect ? '#28a745' : '#dc3545'}
            />
            <Text style={styles.resultTitle}>{isCorrect ? 'CORRECT!' : 'INCORRECT'}</Text>
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
              <Text style={styles.infoText}>Good morning</Text>
              <View style={styles.alsoCorrectSection}>
                <Text style={styles.infoLabel}>ALSO CORRECT</Text>
                <View style={styles.alsoCorrectTag}>
                  <Text style={styles.alsoCorrectText}>Buon giorno</Text>
                </View>
              </View>
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
    alignItems: 'stretch',
  },
  instruction: {
    fontFamily: theme.typography.bold,
    fontSize: 14,
    color: '#28a745',
    textTransform: 'uppercase',
    letterSpacing: 1,
    alignSelf: 'flex-start',
  },
  phraseCard: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  phraseText: {
    fontFamily: theme.typography.bold,
    fontSize: 28,
    color: theme.colors.text,
  },
  phraseTranslation: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    color: theme.colors.mutedText,
  },
  audioButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioButtonLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  recordHint: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.mutedText,
  },
  audioCard: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  inputCard: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  inputLabel: {
    fontFamily: theme.typography.semiBold,
    fontSize: 14,
    color: theme.colors.text,
  },
  textInput: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    padding: theme.spacing.md,
    fontSize: 18,
    fontFamily: theme.typography.regular,
    color: theme.colors.text,
    minHeight: 50,
  },
  resultCard: {
    width: '100%',
    backgroundColor: '#d4edda',
    borderRadius: 16,
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.sm,
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
    fontSize: 20,
    color: theme.colors.text,
    flexShrink: 1,
  },
  resultAudioButton: {
    padding: theme.spacing.xs,
  },
  score: {
    fontFamily: theme.typography.bold,
    fontSize: 40,
    color: '#28a745',
  },
  scoreLabel: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.mutedText,
  },
  analysisCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  analysisTitle: {
    fontFamily: theme.typography.bold,
    fontSize: 12,
    color: theme.colors.mutedText,
    textTransform: 'uppercase',
  },
  wordAnalysis: {
    gap: theme.spacing.sm,
  },
  wordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  wordText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  wordFeedback: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: '#28a745',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
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
  alsoCorrectSection: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  alsoCorrectTag: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  alsoCorrectText: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
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
  },
  xpText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
    color: '#fff',
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
});
