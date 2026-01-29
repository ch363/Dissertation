import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/services/theme/ThemeProvider';

export type LoadingScreenProps = {
  /** Main message, e.g. "Verifying your email..." */
  title: string;
  /** Optional supporting text, e.g. "Please wait while we confirm your account" */
  subtitle?: string;
  /** If true, wrap in SafeAreaView. Default true. */
  safeArea?: boolean;
};

/**
 * Full-screen loading state: centered primary spinner, bold title, muted subtitle.
 * No system blur; matches the branded "Verifying your email..." style.
 */
export function LoadingScreen({ title, subtitle, safeArea = true }: LoadingScreenProps) {
  const { theme } = useAppTheme();

  const content = (
    <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>{subtitle}</Text>
      ) : null}
    </View>
  );

  if (safeArea) {
    return <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>{content}</SafeAreaView>;
  }
  return content;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 280,
  },
});
