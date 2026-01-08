import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

export default function ReviewOverviewScreen() {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.card}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Review</Text>
        <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
          Review flow placeholder
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    padding: baseTheme.spacing.lg,
  },
  card: {
    borderRadius: baseTheme.radius.lg,
    backgroundColor: baseTheme.colors.card,
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
  },
});
