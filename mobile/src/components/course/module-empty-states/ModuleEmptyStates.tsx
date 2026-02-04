import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, StaticCard } from '@/components/ui';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

function toYouCanNowSentence(outcome: string): string {
  const trimmed = outcome.trim();
  if (!trimmed) return 'You can now greet people confidently.';
  const lower = trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
  // If the outcome already includes "You can …", don't double-prefix.
  if (/^you can\b/i.test(trimmed)) return trimmed;
  return `You can now ${lower}.`;
}

export function ModuleCompleteBanner({
  moduleTitle,
  exampleOutcome,
}: {
  moduleTitle: string;
  exampleOutcome?: string | null;
}) {
  const { theme } = useAppTheme();
  const sub = exampleOutcome
    ? toYouCanNowSentence(exampleOutcome)
    : 'You can now use what you learned with confidence.';

  return (
    <StaticCard
      title={`${moduleTitle} complete!`}
      titleVariant="subtle"
      leftIcon={
        <Text style={styles.emoji} accessibilityLabel="Celebration">
          🎉
        </Text>
      }
      style={styles.card}
    >
      <Text style={[styles.subtitle, { color: theme.colors.mutedText }]} numberOfLines={2}>
        {sub}
      </Text>
    </StaticCard>
  );
}

export function OfflineNotice({ onRetry }: { onRetry: () => void }) {
  const { theme } = useAppTheme();
  return (
    <StaticCard
      title="You're offline"
      titleVariant="subtle"
      leftIcon={<Ionicons name="cloud-offline-outline" size={18} color={theme.colors.mutedText} />}
      style={styles.card}
    >
      <Text style={[styles.subtitle, { color: theme.colors.mutedText }]} numberOfLines={2}>
        Connect to the internet to load lessons and progress.
      </Text>
      <Button title="Retry" onPress={onRetry} variant="secondary" style={styles.button} />
    </StaticCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: baseTheme.spacing.sm,
  },
  emoji: {
    fontSize: 18,
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    marginTop: baseTheme.spacing.xs,
  },
});
