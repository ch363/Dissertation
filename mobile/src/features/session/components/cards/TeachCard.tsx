import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getTtsEnabled, getTtsRate } from '@/services/preferences';
import { theme } from '@/services/theme/tokens';
import * as SafeSpeech from '@/services/tts';
import { TeachCard as TeachCardType } from '@/types/session';

type Props = {
  card: TeachCardType;
};

export function TeachCard({ card }: Props) {
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  const handleSpeak = async () => {
    // Prevent multiple rapid calls
    if (isSpeaking) {
      return;
    }

    try {
      const enabled = await getTtsEnabled();
      if (!enabled) {
        console.warn('TTS is disabled in settings');
        return;
      }
      
      setIsSpeaking(true);
      const rate = await getTtsRate();
      await SafeSpeech.stop();
      // Small delay to ensure stop completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const phrase = card.content.phrase || '';
      if (!phrase) {
        console.warn('No phrase to speak');
        setIsSpeaking(false);
        return;
      }
      
      console.log('Speaking phrase:', phrase, 'with language: it-IT');
      // Speak with Italian language - if voice not available, will use default
      await SafeSpeech.speak(phrase, { language: 'it-IT', rate });
      console.log('TTS speak called successfully');
      
      // Reset speaking state after estimated duration
      const estimatedDuration = Math.max(2000, phrase.length * 150);
      setTimeout(() => {
        setIsSpeaking(false);
      }, estimatedDuration);
    } catch (error) {
      console.error('Failed to speak phrase:', error);
      setIsSpeaking(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Teach Card - Light Blue */}
      <View style={styles.teachCard}>
        {card.content.emoji ? (
          <Text style={styles.teachEmoji}>{card.content.emoji}</Text>
        ) : null}
        <Text style={styles.teachPhrase}>{card.content.phrase}</Text>
        {card.content.translation ? (
          <Text style={styles.teachTranslation}>{card.content.translation}</Text>
        ) : null}
        <Pressable 
          style={[styles.speakerButton, isSpeaking && styles.speakerButtonDisabled]} 
          onPress={handleSpeak}
          disabled={isSpeaking}
        >
          <Ionicons name={isSpeaking ? "volume-high" : "volume-high"} size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Usage Note Card - Light Green */}
      {card.content.usageNote ? (
        <View style={styles.usageNoteCard}>
          <Ionicons name="book-outline" size={20} color="#28a745" />
          <View style={styles.usageNoteContent}>
            <Text style={styles.usageNoteTitle}>Usage Note</Text>
            <Text style={styles.usageNoteText}>{card.content.usageNote}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  teachCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 24,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 200,
    justifyContent: 'center',
  },
  teachEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.xs,
  },
  teachPhrase: {
    fontFamily: theme.typography.bold,
    fontSize: 32,
    color: theme.colors.text,
    textAlign: 'center',
  },
  teachTranslation: {
    fontFamily: theme.typography.regular,
    fontSize: 18,
    color: theme.colors.text,
    textAlign: 'center',
  },
  speakerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  speakerButtonDisabled: {
    opacity: 0.6,
  },
  speakerButtonDisabled: {
    opacity: 0.6,
  },
  usageNoteCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: theme.spacing.md,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  usageNoteContent: {
    flex: 1,
    gap: 4,
  },
  usageNoteTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
    color: '#28a745',
  },
  usageNoteText: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: '#2e7d32',
    lineHeight: 20,
  },
});
