import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

export default function TypingScreen() {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        <View style={[styles.card, { backgroundColor: baseTheme.colors.card }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
            <Ionicons name="keyboard-outline" size={64} color={theme.colors.primary} />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Typing Practice</Text>
          <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
            Improve your typing speed and accuracy by practicing translations. This feature is
            coming soon!
          </Text>
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
    borderRadius: baseTheme.radius.lg,
    padding: baseTheme.spacing.xl,
    alignItems: 'center',
    gap: baseTheme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: baseTheme.spacing.sm,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
