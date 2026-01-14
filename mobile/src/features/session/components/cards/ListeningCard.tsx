import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { theme } from '@/services/theme/tokens';
import { ListeningCard as ListeningCardType } from '@/types/session';

type Props = {
  card: ListeningCardType;
  userAnswer?: string;
  onAnswerChange?: (answer: string) => void;
  showResult?: boolean;
  isCorrect?: boolean;
};

export function ListeningCard({
  card,
  userAnswer = '',
  onAnswerChange,
  showResult = false,
  isCorrect,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const mode = card.mode || 'type'; // 'type' or 'speak'

  const handlePlayAudio = async () => {
    setIsPlaying(true);
    // TODO: Implement audio playback
    setTimeout(() => setIsPlaying(false), 1000);
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
            />
          </View>
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
            <Text style={styles.answerText}>{card.expected}</Text>
            <Ionicons name="volume-high" size={20} color={theme.colors.primary} />
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>MEANING</Text>
            <Text style={styles.infoText}>Translation here</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
    alignItems: 'center',
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
    fontSize: 32,
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
    width: 80,
    height: 80,
    borderRadius: 40,
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
    marginVertical: theme.spacing.md,
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
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  resultCardCorrect: {
    backgroundColor: '#d4edda',
  },
  resultCardWrong: {
    backgroundColor: '#f8d7da',
  },
  resultTitle: {
    fontFamily: theme.typography.bold,
    fontSize: 18,
    color: theme.colors.text,
    textTransform: 'uppercase',
  },
  score: {
    fontFamily: theme.typography.bold,
    fontSize: 48,
    color: '#28a745',
  },
  scoreLabel: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.mutedText,
  },
  answerText: {
    fontFamily: theme.typography.bold,
    fontSize: 24,
    color: theme.colors.text,
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
    gap: theme.spacing.xs,
  },
  infoLabel: {
    fontFamily: theme.typography.bold,
    fontSize: 12,
    color: theme.colors.mutedText,
    textTransform: 'uppercase',
  },
  infoText: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    color: theme.colors.text,
  },
});
