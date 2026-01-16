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
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSpeak = async () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Don't block clicks - let TTS service handle overlapping calls
    // Just provide visual feedback
    setIsSpeaking(true);

    try {
      const enabled = await getTtsEnabled();
      if (!enabled) {
        console.warn('TTS is disabled in settings');
        setIsSpeaking(false);
        return;
      }
      
      const phrase = card.content.phrase || '';
      if (!phrase) {
        console.warn('No phrase to speak');
        setIsSpeaking(false);
        return;
      }
      
      const rate = await getTtsRate();
      
      console.log('Speaking phrase:', phrase, 'with language: it-IT');
      // Speak with Italian language - if voice not available, will use default
      // TTS service will handle stopping any current speech
      SafeSpeech.speak(phrase, { language: 'it-IT', rate }).catch((error) => {
        console.error('TTS speak error in component:', error);
        setIsSpeaking(false);
      });
      console.log('TTS speak called successfully');
      
      // Reset speaking state after estimated duration
      // Use a shorter timeout for better responsiveness
      const estimatedDuration = Math.max(2000, Math.min(phrase.length * 150, 8000));
      timeoutRef.current = setTimeout(() => {
        console.debug('TeachCard: Resetting speaking state after timeout');
        setIsSpeaking(false);
        timeoutRef.current = null;
      }, estimatedDuration);
    } catch (error) {
      console.error('Failed to speak phrase:', error);
      // Always reset on error to allow retry
      setIsSpeaking(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
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
          // Don't disable the button - allow rapid clicks, TTS service will handle it
        >
          <Ionicons name="volume-high" size={24} color="#fff" />
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
