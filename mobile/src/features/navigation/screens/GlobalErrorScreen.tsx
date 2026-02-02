import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Button, StaticCard } from '@/components/ui';
import { logError } from '@/services/logging';
import { routes } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type ErrorParam = { error?: string };

export default function GlobalError() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const params = useLocalSearchParams<ErrorParam>();

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
      <StaticCard title="Something went wrong" titleVariant="subtle" style={styles.card}>
        <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
          We hit an unexpected issue. You can go back and try again.
        </Text>
        <View style={styles.actions}>
          <Button
            title="Go back"
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityHint="Returns to previous screen"
          />
          <Button
            title="Go home"
            onPress={() => router.replace(routes.tabs.home)}
            variant="secondary"
            accessibilityLabel="Go home"
            accessibilityHint="Returns to home"
            style={styles.secondaryButton}
          />
        </View>
      </StaticCard>
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
  card: {
    width: '100%',
    maxWidth: 400,
  },
  subtitle: {
    marginTop: baseTheme.spacing.xs,
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  actions: {
    marginTop: baseTheme.spacing.lg,
    gap: baseTheme.spacing.sm,
  },
  secondaryButton: {
    marginTop: baseTheme.spacing.xs,
  },
});
