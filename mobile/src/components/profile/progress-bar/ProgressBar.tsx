import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

export type MilestonesData = {
  dailyGoalLabel: string;
  dailyGoalValue: string;
  thisWeekLabel: string;
  thisWeekValue: string;
  nextMilestoneLabel: string;
  nextMilestoneValue: string;
};

type Props = {
  progress: number;
  currentLevel?: number;
  currentXP?: number;
  xpPerLevel?: number;
  /** Show "Level N" heading and "X XP remaining" (Figma style) */
  showHeading?: boolean;
  /** Show gradient fill instead of solid */
  useGradient?: boolean;
  /** Show milestones row (daily goal, this week, next milestone) */
  milestones?: MilestonesData;
};

const TRACK_HEIGHT = 10;
const TRACK_RADIUS = TRACK_HEIGHT / 2;

export function ProgressBar({
  progress,
  currentLevel,
  currentXP,
  xpPerLevel,
  showHeading = false,
  useGradient = false,
  milestones,
}: Props) {
  const { theme } = useAppTheme();
  const pct = Math.max(0, Math.min(1, progress));
  const safeXpPerLevel =
    Number.isFinite(xpPerLevel) && (xpPerLevel as number) > 0 ? (xpPerLevel as number) : 100;
  const safeCurrentXp = Number.isFinite(currentXP) ? (currentXP as number) : null;
  const xpInLevel =
    safeCurrentXp === null
      ? null
      : ((safeCurrentXp % safeXpPerLevel) + safeXpPerLevel) % safeXpPerLevel;
  const xpRemaining = safeXpPerLevel - (xpInLevel ?? 0);
  const progressPercent = Math.round(pct * 100);
  const nextLevel = currentLevel !== undefined ? currentLevel + 1 : undefined;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Level progress: ${progressPercent} percent`}
      accessibilityValue={{ min: 0, max: 100, now: progressPercent }}
    >
      {showHeading && nextLevel !== undefined && (
        <>
          <Text style={[styles.levelHeading, { color: theme.colors.text }]}>Level {nextLevel}</Text>
          <Text style={[styles.remainingText, { color: theme.colors.mutedText }]}>
            {xpRemaining} XP remaining
          </Text>
        </>
      )}
      {!showHeading && currentLevel !== undefined && (
        <View style={styles.levelInfo}>
          <Text style={[styles.levelText, { color: theme.colors.text }]}>Level {currentLevel}</Text>
          {xpInLevel !== null && (
            <Text style={[styles.xpText, { color: theme.colors.mutedText }]}>
              {xpInLevel} / {safeXpPerLevel} XP
            </Text>
          )}
        </View>
      )}
      <View style={[styles.wrap, { backgroundColor: theme.colors.border }]}>
        {useGradient ? (
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.ctaCardAccent || theme.colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fill, { width: `${pct * 100}%` }]}
          />
        ) : (
          <View
            style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: theme.colors.primary }]}
          />
        )}
      </View>
      {showHeading && xpInLevel !== null && (
        <View style={styles.xpRow}>
          <View style={styles.xpLeft}>
            <Text style={[styles.xpCurrent, { color: theme.colors.text }]}>{xpInLevel} XP</Text>
            <Text style={[styles.xpPercent, { color: theme.colors.primary }]}>
              {progressPercent}%
            </Text>
          </View>
          <Text style={[styles.xpTotal, { color: theme.colors.mutedText }]}>
            {safeXpPerLevel} XP
          </Text>
        </View>
      )}
      {milestones && (
        <View style={[styles.milestonesRow, { borderTopColor: theme.colors.border }]}>
          <View style={styles.milestoneItem}>
            <Text style={[styles.milestoneValue, { color: theme.colors.text }]}>
              {milestones.dailyGoalValue}
            </Text>
            <Text style={[styles.milestoneLabel, { color: theme.colors.mutedText }]}>
              {milestones.dailyGoalLabel}
            </Text>
          </View>
          <View style={styles.milestoneItem}>
            <Text style={[styles.milestoneValue, { color: theme.colors.text }]}>
              {milestones.thisWeekValue}
            </Text>
            <Text style={[styles.milestoneLabel, { color: theme.colors.mutedText }]}>
              {milestones.thisWeekLabel}
            </Text>
          </View>
          <View style={styles.milestoneItem}>
            <Text style={[styles.milestoneValue, { color: theme.colors.text }]}>
              {milestones.nextMilestoneValue}
            </Text>
            <Text style={[styles.milestoneLabel, { color: theme.colors.mutedText }]}>
              {milestones.nextMilestoneLabel}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: baseTheme.spacing.sm,
  },
  levelText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  xpText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
  },
  levelHeading: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 20,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  remainingText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
    marginBottom: baseTheme.spacing.md + 4,
  },
  wrap: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_RADIUS,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: TRACK_RADIUS,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: baseTheme.spacing.md + 2,
  },
  xpLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  xpCurrent: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 13,
  },
  xpPercent: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 12,
  },
  xpTotal: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 13,
  },
  milestonesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: baseTheme.spacing.lg,
    marginTop: baseTheme.spacing.lg,
    borderTopWidth: 1,
  },
  milestoneItem: {
    alignItems: 'center',
    minWidth: 72,
  },
  milestoneValue: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  milestoneLabel: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
