import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getTtsEnabled, getTtsRate } from '@/services/preferences';
import { theme } from '@/services/theme/tokens';
import * as SafeSpeech from '@/services/tts';
import { FillBlankCard as FillBlankCardType } from '@/types/session';

type Props = {
  card: FillBlankCardType;
  selectedAnswer?: string;
  onSelectAnswer?: (answer: string) => void;
};

export function FillBlankCard({ card, selectedAnswer, onSelectAnswer }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayAudio = async () => {
    if (!card.audioUrl && !card.text) return;
    try {
      const enabled = await getTtsEnabled();
      if (!enabled) return;
      setIsPlaying(true);
      const rate = await getTtsRate();
      await SafeSpeech.stop();
      // Speak the sentence with blank (replace ___ with "blank" for TTS)
      const textToSpeak = card.text.replace(/___/g, 'blank') || '';
      await SafeSpeech.speak(textToSpeak, { language: 'it-IT', rate });
      setTimeout(() => setIsPlaying(false), 3000);
    } catch (error) {
      console.error('Failed to play audio:', error);
      setIsPlaying(false);
    }
  };

  // Parse sentence to find blank position
  const sentenceParts = card.text.split('___');
  const hasBlank = sentenceParts.length === 2;

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>FILL IN THE BLANK</Text>

      {/* Main Question Card */}
      <View style={styles.questionCard}>
        {card.audioUrl && (
          <Pressable style={styles.audioButton} onPress={handlePlayAudio}>
            <Ionicons
              name={isPlaying ? 'pause' : 'volume-high'}
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.audioLabel}>Listen and complete</Text>
          </Pressable>
        )}

        {/* Sentence with blank */}
        <View style={styles.sentenceContainer}>
          {sentenceParts[0] && <Text style={styles.sentenceText}>{sentenceParts[0]}</Text>}
          <View style={[styles.blankField, selectedAnswer && styles.blankFieldFilled]}>
            <Text style={styles.blankText}>{selectedAnswer || '___'}</Text>
          </View>
          {sentenceParts[1] && <Text style={styles.sentenceText}>{sentenceParts[1]}</Text>}
        </View>
      </View>

      {/* Options Card */}
      {card.options && card.options.length > 0 && (
        <View style={styles.optionsCard}>
          <Text style={styles.optionsLabel}>TAP TO FILL THE BLANK</Text>
          <View style={styles.optionsGrid}>
            {card.options.map((opt) => {
              const isSelected = selectedAnswer === opt.label;
              return (
                <Pressable
                  key={opt.id}
                  style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                  onPress={() => onSelectAnswer?.(opt.label)}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {opt.label}
                  </Text>
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
    gap: theme.spacing.md,
  },
  instruction: {
    fontFamily: theme.typography.bold,
    fontSize: 14,
    color: '#28a745',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  audioLabel: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.text,
  },
  sentenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  sentenceText: {
    fontFamily: theme.typography.regular,
    fontSize: 18,
    color: theme.colors.text,
  },
  blankField: {
    minWidth: 80,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4A90E2',
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  blankFieldFilled: {
    backgroundColor: '#D4EDDA',
    borderColor: '#28a745',
  },
  blankText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
    color: theme.colors.text,
  },
  optionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  optionsLabel: {
    fontFamily: theme.typography.semiBold,
    fontSize: 12,
    color: theme.colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    padding: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4A90E2',
    backgroundColor: '#E8F4FD',
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  optionText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
    color: '#4A90E2',
  },
  optionTextSelected: {
    color: '#fff',
  },
});
