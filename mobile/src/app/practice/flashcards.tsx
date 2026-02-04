import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

const FLASHCARD_EMOJI = '🃏';

export default function FlashcardsScreen() {
  const { theme, isDark } = useAppTheme();
  const gradientColors = isDark
    ? [theme.colors.profileHeader, theme.colors.profileHeader]
    : [theme.colors.primary, theme.colors.primary];
  const shadowColor = isDark ? theme.colors.profileHeader : '#264FD4';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        <View style={[styles.card, { shadowColor }]}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.cardContent}>
              <View style={[styles.iconWrap, { backgroundColor: theme.colors.ctaCardAccent }]}>
                <Text style={styles.emoji} accessibilityLabel="Flashcards">
                  {FLASHCARD_EMOJI}
                </Text>
              </View>
              <View style={styles.cardText}>
                <Text style={styles.title}>Flashcards</Text>
                <Text style={styles.subtitle}>
                  Practice with interactive flashcards to reinforce your learning. This feature is
                  coming soon!
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: baseTheme.spacing.lg,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  gradient: {
    padding: 24,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 18,
    letterSpacing: -0.2,
    color: '#FFFFFF',
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
});
