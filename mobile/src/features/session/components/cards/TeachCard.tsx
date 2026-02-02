import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getTtsEnabled, getTtsRate } from '@/services/preferences';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import * as SafeSpeech from '@/services/tts';
import { TeachCard as TeachCardType } from '@/types/session';
import { createLogger } from '@/services/logging';

const logger = createLogger('TeachCard');

// Professional App Redesign / Figma (LessonScreen) colours
const CARD_GRADIENT = ['#eff6ff', '#e0e7ff', '#eff6ff'] as const;
const CARD_BORDER = 'rgba(191, 219, 254, 0.5)';
const SPEAKER_GRADIENT = ['#2563eb', '#4f46e5'] as const; // blue-600 to indigo-600
const USAGE_CARD_BG = 'rgba(248, 250, 252, 0.8)';
const USAGE_ICON_SLATE = '#94a3b8';

type Props = {
  card: TeachCardType;
};

export function TeachCard({ card }: Props) {
  const ctx = useAppTheme();
  const theme = ctx?.theme ?? baseTheme;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showTapHint, setShowTapHint] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSpeak = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowTapHint(false);
    setIsSpeaking(true);

    try {
      const enabled = await getTtsEnabled();
      if (!enabled) {
        logger.warn('TTS is disabled in settings');
        setIsSpeaking(false);
        return;
      }

      const phrase = card.content.phrase || '';
      if (!phrase) {
        logger.warn('No phrase to speak');
        setIsSpeaking(false);
        return;
      }

      const rate = await getTtsRate();
      logger.info('Speaking phrase', { phrase, language: 'it-IT' });
      SafeSpeech.speak(phrase, { language: 'it-IT', rate }).catch((error) => {
        logger.error('TTS speak error in component', error as Error);
        setIsSpeaking(false);
      });

      const estimatedDuration = Math.max(2000, Math.min(phrase.length * 150, 8000));
      timeoutRef.current = setTimeout(() => {
        setIsSpeaking(false);
        timeoutRef.current = null;
      }, estimatedDuration);
    } catch (error) {
      logger.error('Failed to speak phrase', error as Error);
      setIsSpeaking(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Teach Card – gradient, 32px radius (Figma: rounded-[32px], from-blue-50 via-indigo-50 to-blue-50) */}
      <LinearGradient
        colors={CARD_GRADIENT}
        style={[styles.teachCard, isSpeaking && styles.teachCardSpeaking]}
      >
        <View style={styles.teachCardInner}>
          {/* Emoji at top */}
          {card.content.emoji ? (
            <Text style={styles.teachEmoji}>{card.content.emoji}</Text>
          ) : null}

          {/* Phrase + translation (Figma: text-7xl bold, then text-lg medium) */}
          <View style={styles.phraseBlock}>
            <Text style={[styles.teachPhrase, { color: theme.colors.text }]}>
              {card.content.phrase}
            </Text>
            {card.content.translation ? (
              <Text style={[styles.teachTranslation, { color: theme.colors.mutedText }]}>
                {card.content.translation}
              </Text>
            ) : null}
          </View>

          {/* Audio button – 80px circle, gradient blue–indigo (Figma: w-20 h-20, ring when playing) */}
          <View style={styles.speakerWrap}>
            <Pressable
              onPress={handleSpeak}
              style={({ pressed }) => [
                styles.speakerButton,
                isSpeaking && styles.speakerButtonActive,
                pressed && styles.speakerButtonPressed,
              ]}
              accessibilityLabel={isSpeaking ? 'Playing audio' : 'Play pronunciation'}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={SPEAKER_GRADIENT}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.speakerIconWrap}>
                {isSpeaking ? (
                  <Ionicons name="pause" size={32} color="#fff" />
                ) : (
                  <Ionicons name="volume-high" size={32} color="#fff" />
                )}
              </View>
            </Pressable>
            {showTapHint && !isSpeaking ? (
              <View style={styles.tapHintPill}>
                <Text style={[styles.tapHint, { color: theme.colors.mutedText }]}>
                  Tap to listen
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </LinearGradient>

      {/* Usage Note – slate-50 style, rounded-3xl, book icon + text only (no "Usage Note" title) */}
      {card.content.usageNote ? (
        <View style={styles.usageNoteCard}>
          <Ionicons name="book-outline" size={18} color={USAGE_ICON_SLATE} style={styles.usageNoteIcon} />
          <Text style={[styles.usageNoteText, { color: theme.colors.mutedText }]}>
            {card.content.usageNote}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const CARD_RADIUS = 32;
const USAGE_RADIUS = 24;
const SPEAKER_SIZE = 80;

const styles = StyleSheet.create({
  container: {
    gap: baseTheme.spacing.lg,
  },
  teachCard: {
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: baseTheme.spacing.xl,
    paddingVertical: baseTheme.spacing.xl + 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    overflow: 'hidden',
  },
  teachCardSpeaking: {
    borderColor: 'rgba(59, 130, 246, 0.4)',
    shadowOpacity: 0.1,
  },
  teachCardInner: {
    alignItems: 'center',
    gap: baseTheme.spacing.md,
  },
  teachEmoji: {
    fontSize: 48,
    marginBottom: baseTheme.spacing.xs,
  },
  phraseBlock: {
    alignItems: 'center',
    gap: baseTheme.spacing.xs,
    marginBottom: baseTheme.spacing.sm,
    paddingTop: 4,
  },
  teachPhrase: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 56,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 68,
  },
  teachTranslation: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
  },
  speakerWrap: {
    alignItems: 'center',
    position: 'relative',
  },
  speakerButton: {
    width: SPEAKER_SIZE,
    height: SPEAKER_SIZE,
    borderRadius: SPEAKER_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  speakerButtonActive: {
    borderWidth: 4,
    borderColor: 'rgba(96, 165, 250, 0.5)',
  },
  speakerButtonPressed: {
    opacity: 0.9,
  },
  speakerIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapHintPill: {
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'center',
  },
  tapHint: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 12,
  },
  usageNoteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingHorizontal: baseTheme.spacing.md + 4,
    paddingVertical: baseTheme.spacing.md,
    borderRadius: USAGE_RADIUS,
    backgroundColor: USAGE_CARD_BG,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  usageNoteIcon: {
    marginTop: 2,
  },
  usageNoteText: {
    flex: 1,
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
    lineHeight: 22,
  },
});
