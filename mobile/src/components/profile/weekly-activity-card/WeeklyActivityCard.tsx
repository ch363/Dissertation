import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export type DayBar = {
  heightPercent: number;
  active: boolean;
};

type Props = {
  /** Mon=0 .. Sun=6. Bar heights 0–100. From backend weeklyActivity. */
  dailyBars: DayBar[];
  /** Summary line under the chart, e.g. "298 XP earned this week" */
  summaryText: string;
};

function getTodayIndex(): number {
  const day = new Date().getDay();
  return (day + 6) % 7;
}

const EMPTY_BARS: DayBar[] = Array.from({ length: 7 }, () => ({ heightPercent: 0, active: false }));

export function WeeklyActivityCard({ dailyBars, summaryText }: Props) {
  const { theme } = useAppTheme();
  const bars = dailyBars?.length === 7 ? dailyBars : EMPTY_BARS;
  const todayIndex = getTodayIndex();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>THIS WEEK</Text>
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.chartRow}>
          {bars.map((bar, index) => {
            const isToday = index === todayIndex;
            const fillHeight = bar.heightPercent > 0 ? Math.max(bar.heightPercent, 8) : 0;
            const fillColor = isToday
              ? theme.colors.primary
              : bar.active
                ? theme.colors.ctaCardAccent || theme.colors.primary
                : theme.colors.border;
            const opacity = bar.active ? 1 : 0.5;
            return (
              <View key={index} style={styles.barColumn}>
                <View style={[styles.barTrack, { backgroundColor: theme.colors.border }]}>
                  {fillHeight > 0 &&
                    (isToday ? (
                      <LinearGradient
                        colors={[theme.colors.ctaCardAccent || theme.colors.primary, theme.colors.primary]}
                        start={{ x: 0, y: 1 }}
                        end={{ x: 0, y: 0 }}
                        style={[styles.barFill, { height: `${fillHeight}%` }]}
                      />
                    ) : (
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${fillHeight}%`,
                            backgroundColor: fillColor,
                            opacity,
                          },
                        ]}
                      />
                    ))}
                </View>
                <View style={styles.dayLabelRow}>
                  <Text
                    style={[
                      styles.dayLabel,
                      {
                        color: isToday ? theme.colors.primary : bar.active ? theme.colors.text : theme.colors.mutedText,
                      },
                    ]}
                  >
                    {DAY_LABELS[index]}
                  </Text>
                  {isToday && <View style={[styles.todayDot, { backgroundColor: theme.colors.primary }]} />}
                </View>
              </View>
            );
          })}
        </View>
        <View style={[styles.summaryRow, { borderTopColor: theme.colors.border }]}>
          <Text style={[styles.summaryText, { color: theme.colors.mutedText }]}>{summaryText}</Text>
        </View>
      </View>
    </View>
  );
}

const BAR_HEIGHT = 100;
const CARD_RADIUS = 20;
const BAR_RADIUS = 10;

const styles = StyleSheet.create({
  wrapper: {
    marginTop: baseTheme.spacing.lg,
    marginBottom: baseTheme.spacing.xl,
  },
  sectionTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 13,
    letterSpacing: 0.6,
    marginBottom: baseTheme.spacing.sm + 2,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    paddingHorizontal: baseTheme.spacing.lg + 4,
    paddingTop: baseTheme.spacing.xl,
    paddingBottom: baseTheme.spacing.lg + 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: baseTheme.spacing.sm,
    height: BAR_HEIGHT,
    marginBottom: baseTheme.spacing.md + 4,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: baseTheme.spacing.sm + 2,
  },
  dayLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  barTrack: {
    width: '100%',
    height: BAR_HEIGHT,
    borderRadius: BAR_RADIUS,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: BAR_RADIUS,
  },
  dayLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  summaryRow: {
    paddingTop: baseTheme.spacing.lg,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  summaryText: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
