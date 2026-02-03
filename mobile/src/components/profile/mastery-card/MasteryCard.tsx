import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import type { SkillMastery } from '@/services/api/mastery';

type Props = {
  mastery: SkillMastery[];
};

function CircularProgress({ progress, size = 60, strokeWidth = 6 }: { progress: number; size?: number; strokeWidth?: number }) {
  const { theme } = useAppTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressValue = Math.max(0, Math.min(1, progress));
  const strokeDashoffset = circumference * (1 - progressValue);
  const center = size / 2;

  return (
    <Svg width={size} height={size} style={styles.svg}>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={theme.colors.border}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={theme.colors.primary}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
      />
    </Svg>
  );
}

function SkillItem({ skill }: { skill: SkillMastery }) {
  const { theme } = useAppTheme();
  const percentage = Math.round(skill.masteryProbability * 100);
  
  const formatSkillName = (tag: string): string => {
    return tag
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <View style={styles.skillItem}>
      <View style={styles.circularProgressContainer}>
        <CircularProgress progress={skill.masteryProbability} size={60} strokeWidth={6} />
        <View style={styles.percentageContainer}>
          <Text style={[styles.percentageText, { color: theme.colors.text }]}>{percentage}%</Text>
        </View>
      </View>
      <Text style={[styles.skillName, { color: theme.colors.text }]} numberOfLines={2}>
        {formatSkillName(skill.skillTag)}
      </Text>
    </View>
  );
}

export function MasteryCard({ mastery }: Props) {
  const { theme } = useAppTheme();

  if (!mastery || mastery.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.mutedText }]}>
          No skill mastery data yet. Start learning to track your progress!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {mastery.map((skill) => (
          <SkillItem key={skill.skillTag} skill={skill} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: baseTheme.spacing.md,
    justifyContent: 'flex-start',
  },
  skillItem: {
    width: '30%',
    alignItems: 'center',
    minWidth: 80,
  },
  circularProgressContainer: {
    position: 'relative',
    marginBottom: baseTheme.spacing.xs,
  },
  percentageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 12,
  },
  skillName: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 12,
    textAlign: 'center',
  },
  svg: {
    transform: [{ rotate: '0deg' }],
  },
  emptyContainer: {
    padding: baseTheme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  emptyText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    textAlign: 'center',
  },
});
