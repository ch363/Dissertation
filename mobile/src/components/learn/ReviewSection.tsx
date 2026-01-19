import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  dueCount: number;
  onStart?: () => void;
};

export function ReviewSection({ dueCount, onStart }: Props) {
  const { theme } = useAppTheme();
  const subtitle =
    dueCount === 0
      ? 'No cards due today'
      : `${dueCount} ${dueCount === 1 ? 'card' : 'cards'} due today`;

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Review</Text>
      <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
        Strengthen what you&apos;ve already learned
      </Text>
      <View
        style={[
          styles.card,
          {
            backgroundColor: '#E9F2FF',
            borderColor: theme.colors.border,
            shadowColor: '#0D1B2A',
          },
        ]}
      >
        <View style={styles.row}>
          <View style={{ flex: 1, gap: baseTheme.spacing.xs }}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Due for Review</Text>
            <Text style={[styles.cardSubtitle, { color: theme.colors.mutedText }]}>
              {subtitle}
            </Text>
          </View>
          <View
            style={[
              styles.illustration,
              {
                backgroundColor: '#DDEAFE',
                borderColor: theme.colors.border,
              },
            ]}
          />
        </View>
        <Button
          title="Start Review"
          onPress={onStart ?? (() => {})}
          disabled={dueCount === 0}
          style={{
            marginTop: baseTheme.spacing.md,
            borderRadius: baseTheme.radius.lg,
            paddingVertical: baseTheme.spacing.md,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: baseTheme.spacing.lg,
    paddingHorizontal: baseTheme.spacing.lg,
    gap: baseTheme.spacing.xs,
  },
  title: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 18,
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
  },
  card: {
    marginTop: baseTheme.spacing.md,
    borderRadius: 24,
    padding: baseTheme.spacing.lg,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    gap: baseTheme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: baseTheme.spacing.md,
  },
  cardTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 18,
  },
  cardSubtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
  },
  illustration: {
    width: 96,
    height: 96,
    borderRadius: 20,
    borderWidth: 1,
    opacity: 0.9,
  },
});
