import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  progress: number;
  currentLevel?: number;
  currentXP?: number;
  xpPerLevel?: number;
};

export function ProgressBar({ progress, currentLevel, currentXP, xpPerLevel }: Props) {
  const { theme } = useAppTheme();
  const pct = Math.max(0, Math.min(1, progress));
  const safeXpPerLevel = Number.isFinite(xpPerLevel) && (xpPerLevel as number) > 0 ? (xpPerLevel as number) : 100;
  const safeCurrentXp = Number.isFinite(currentXP) ? (currentXP as number) : null;
  const xpInLevel =
    safeCurrentXp === null ? null : ((safeCurrentXp % safeXpPerLevel) + safeXpPerLevel) % safeXpPerLevel;

  return (
    <View>
      {currentLevel !== undefined && (
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
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: theme.colors.primary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: baseTheme.spacing.xs,
  },
  levelText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
  },
  xpText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 12,
  },
  wrap: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
});
