import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

export default function TypingScreen() {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Typing</Text>
        <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.sm,
  },
  title: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 24,
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 16,
  },
});
