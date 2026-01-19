import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import { Button, SurfaceCard } from '@/components/ui';

function toYouCanNowSentence(outcome: string): string {
  const trimmed = outcome.trim();
  if (!trimmed) return 'You can now greet people confidently.';
  const lower = trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
  // If the outcome already includes “You can …”, don’t double-prefix.
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
  const sub = exampleOutcome ? toYouCanNowSentence(exampleOutcome) : 'You can now use what you learned with confidence.';

  return (
    <SurfaceCard style={[styles.card, { borderColor: theme.colors.border }]}>
      <View style={styles.row}>
        <Text style={styles.emoji} accessibilityLabel="Celebration">
          🎉
        </Text>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
            {moduleTitle} complete!
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.mutedText }]} numberOfLines={2}>
            {sub}
          </Text>
        </View>
      </View>
    </SurfaceCard>
  );
}

export function FirstLessonNudge({
  onStart,
}: {
  onStart: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <SurfaceCard style={[styles.card, { borderColor: theme.colors.border }]}>
      <View style={styles.row}>
        <Ionicons name="sparkles-outline" size={18} color={theme.colors.primary} />
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
            Ready for your first lesson?
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.mutedText }]} numberOfLines={2}>
            Start small—finish one lesson to build momentum.
          </Text>
        </View>
      </View>
      <Button title="Start your first lesson" onPress={onStart} style={styles.button} />
    </SurfaceCard>
  );
}

export function OfflineNotice({
  onRetry,
}: {
  onRetry: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <SurfaceCard style={[styles.card, { borderColor: theme.colors.border }]}>
      <View style={styles.row}>
        <Ionicons name="cloud-offline-outline" size={18} color={theme.colors.mutedText} />
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
            You&apos;re offline
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.mutedText }]} numberOfLines={2}>
            Connect to the internet to load lessons and progress.
          </Text>
        </View>
      </View>
      <Button title="Retry" onPress={onRetry} variant="secondary" style={styles.button} />
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: baseTheme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
  },
  emoji: {
    fontSize: 18,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
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

