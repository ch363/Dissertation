import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Status = 'not_started' | 'in_progress' | 'completed';

export type LessonMicroProgressProps = {
  completed: number;
  total: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getStatus(completed: number, total: number): Status {
  if (total <= 0) return 'not_started';
  if (completed >= total) return 'completed';
  if (completed > 0) return 'in_progress';
  return 'not_started';
}

function getLabel(status: Status): string {
  switch (status) {
    case 'completed':
      return 'Completed ✓';
    case 'in_progress':
      return 'In progress';
    case 'not_started':
      return 'Not started';
  }
}

export function LessonMicroProgress({ completed, total }: LessonMicroProgressProps) {
  const { theme } = useAppTheme();

  const safeTotal = Number.isFinite(total) ? Math.max(0, total) : 0;
  const safeCompleted = Number.isFinite(completed)
    ? clamp(completed, 0, safeTotal || completed)
    : 0;

  const status = getStatus(safeCompleted, safeTotal);
  const label = getLabel(status);

  const showExactDots = safeTotal > 0 && safeTotal <= 5;
  const dotCount = showExactDots ? safeTotal : 5;
  const dotFilled = showExactDots
    ? clamp(safeCompleted, 0, dotCount)
    : safeTotal > 0
      ? clamp(Math.round((safeCompleted / safeTotal) * dotCount), 0, dotCount)
      : 0;

  const fraction = safeTotal > 0 ? clamp(safeCompleted / safeTotal, 0, 1) : 0;

  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.label,
          {
            color:
              status === 'completed'
                ? theme.colors.primary
                : status === 'in_progress'
                  ? theme.colors.text
                  : theme.colors.mutedText,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>

      {safeTotal > 0 ? (
        <>
          {showExactDots ? (
            <View style={styles.dots} accessibilityLabel={`${safeCompleted} of ${safeTotal}`}>
              {Array.from({ length: dotCount }).map((_, idx) => {
                const filled = idx < dotFilled;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: filled ? theme.colors.primary : 'transparent',
                        borderColor: filled ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  />
                );
              })}
            </View>
          ) : (
            <View style={[styles.barTrack, { backgroundColor: theme.colors.border }]}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.round(fraction * 100)}%`,
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              />
            </View>
          )}

          <Text style={[styles.count, { color: theme.colors.mutedText }]} numberOfLines={1}>
            {safeCompleted} of {safeTotal}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.xs,
    flexShrink: 1,
  },
  label: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 12,
    flexShrink: 1,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  barTrack: {
    width: 60,
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  count: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 12,
  },
});
