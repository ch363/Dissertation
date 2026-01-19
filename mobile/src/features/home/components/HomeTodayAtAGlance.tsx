import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  dueReviewCount: number;
  minutesToday: number;
};

export function HomeTodayAtAGlance({ dueReviewCount, minutesToday }: Props) {
  const { theme } = useAppTheme();
  const reviewLine =
    dueReviewCount === 0
      ? 'No reviews due today'
      : `${dueReviewCount} ${dueReviewCount === 1 ? 'review' : 'reviews'} due`;
  const minutesLine = `${minutesToday} min studied`;
  const minutesMuted = minutesToday === 0;

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Today</Text>
      <View
        style={[
          styles.bullets,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.card,
          },
        ]}
      >
        <View style={styles.row}>
          <Ionicons
            name={dueReviewCount === 0 ? 'checkmark-circle-outline' : 'refresh'}
            size={16}
            color={theme.colors.mutedText}
          />
          <Text style={[styles.bullet, { color: theme.colors.mutedText }]}>{reviewLine}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={16} color={theme.colors.mutedText} />
          <Text
            style={[
              styles.bullet,
              { color: theme.colors.mutedText, opacity: minutesMuted ? 0.55 : 1 },
            ]}
          >
            {minutesLine}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: baseTheme.spacing.xs,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 18,
  },
  bullets: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: baseTheme.spacing.xs + 6,
    paddingHorizontal: baseTheme.spacing.md,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bullet: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    lineHeight: 20,
  },
});

