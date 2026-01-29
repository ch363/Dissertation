import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OUTER_CARD_RADIUS, softShadow } from './homeStyles';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  streakDays: number;
};

/** Gradient end colours for streak card (secondary → darker). Light/dark derived from theme. */
function getStreakGradientColors(isDark: boolean): [string, string] {
  if (isDark) return ['#26D4BA', '#1BA892'];
  return ['#12BFA1', '#0E9A82'];
}

export function HomeStreakCard({ streakDays }: Props) {
  const { theme, isDark } = useAppTheme();
  const [start, end] = getStreakGradientColors(isDark);
  const onPrimary = theme.colors.onPrimary;

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[start, end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, { borderRadius: OUTER_CARD_RADIUS }]}
      >
        <View style={styles.inner}>
          <View style={styles.iconBox}>
            <Ionicons
              name="flame"
              size={24}
              color={onPrimary}
              accessible={false}
              importantForAccessibility="no"
            />
          </View>
          <View style={styles.center}>
            <Text style={[styles.label, { color: onPrimary }]}>CURRENT STREAK</Text>
            <Text style={[styles.value, { color: onPrimary }]}>
              {streakDays} {streakDays === 1 ? 'day' : 'days'}
            </Text>
          </View>
          <Text style={[styles.cta, { color: onPrimary }]}>Keep it going!</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...softShadow,
    borderRadius: OUTER_CARD_RADIUS,
    overflow: 'hidden',
  },
  gradient: {
    padding: 18,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    opacity: 0.95,
  },
  value: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  cta: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 13,
    opacity: 0.95,
  },
});
