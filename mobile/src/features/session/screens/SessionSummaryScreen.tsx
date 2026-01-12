import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { routes } from '@/services/navigation/routes';
import { theme } from '@/services/theme/tokens';

export default function SessionSummaryScreen() {
  const params = useLocalSearchParams<{ sessionId?: string; kind?: string; lessonId?: string }>();
  const kind = params.kind === 'review' ? 'review' : 'learn';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.title}>Session complete</Text>
        <Text style={styles.subtitle}>
          {kind === 'review'
            ? 'Quick review done. You can continue or take a break.'
            : 'Lesson finished. Keep momentum or review weak items.'}
        </Text>
        <View style={styles.actions}>
          <Pressable style={styles.primary} onPress={() => router.push(routes.tabs.home)}>
            <Text style={styles.primaryLabel}>Back to home</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => router.push(routes.tabs.learn)}>
            <Text style={styles.secondaryLabel}>Back to learn</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
  },
  card: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  title: {
    fontFamily: theme.typography.semiBold,
    fontSize: 22,
    color: theme.colors.text,
  },
  subtitle: {
    fontFamily: theme.typography.regular,
    color: theme.colors.mutedText,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  primary: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  primaryLabel: {
    color: '#fff',
    fontFamily: theme.typography.semiBold,
  },
  secondary: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  secondaryLabel: {
    fontFamily: theme.typography.semiBold,
    color: theme.colors.text,
  },
});
