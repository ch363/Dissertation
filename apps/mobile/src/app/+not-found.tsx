import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import { logError } from '@/services/logging';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type ErrorParam = { error?: string };

export default function GlobalError() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const params = useLocalSearchParams<ErrorParam>();

  // The router provides the error via props in development; we rely on logError where possible.
  useEffect(() => {
    if (params?.error) {
      try {
        const parsed = JSON.parse(String(params.error));
        logError(parsed);
      } catch {
        logError(params.error);
      }
    }
  }, [params?.error]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Something went wrong</Text>
      <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
        We hit an unexpected issue. You can go back and try again.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => router.back()}
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
      >
        <Text style={styles.buttonText}>Go back</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go home"
        onPress={() => router.replace('/(nav-bar)/home')}
        style={[styles.button, styles.secondary]}
      >
        <Text style={styles.buttonText}>Go home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: baseTheme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: baseTheme.spacing.sm,
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    marginTop: baseTheme.spacing.md,
    paddingVertical: 14,
    paddingHorizontal: baseTheme.spacing.lg,
    borderRadius: baseTheme.radius.md,
  },
  secondary: {
    backgroundColor: baseTheme.colors.secondary,
  },
  buttonText: {
    color: '#fff',
    fontFamily: baseTheme.typography.semiBold,
  },
});
