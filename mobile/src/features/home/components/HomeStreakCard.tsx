import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { routes } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  streakDays: number;
};

/** Actionable subtitle that reinforces the goal and reduces uncertainty. */
function getStreakSubtitle(): string {
  return 'Study 5 min today to keep your streak';
}

export function HomeStreakCard({ streakDays }: Props) {
  const { isDark } = useAppTheme();
  const valueText = `${streakDays} ${streakDays === 1 ? 'day' : 'days'}`;

  // Cyan gradient colors matching web: from-cyan-50 to-cyan-100/70
  const gradientColors = isDark 
    ? ['rgba(6, 182, 212, 0.15)', 'rgba(8, 145, 178, 0.12)']
    : ['#ECFEFF', 'rgba(207, 250, 254, 0.7)'];
  
  // Cyan-600 for icon color
  const iconColor = isDark ? '#06b6d4' : '#0891b2';
  
  // Border color: cyan-200/50
  const borderColor = isDark ? 'rgba(165, 243, 252, 0.2)' : 'rgba(165, 243, 252, 0.5)';
  
  // Text colors matching web
  const overlineColor = isDark ? '#67e8f9' : '#0e7490'; // cyan-700 equivalent
  const titleColor = isDark ? '#f9fafb' : '#111827'; // gray-900
  const subtitleColor = isDark ? '#d1d5db' : '#4b5563'; // gray-600

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Current streak, ${valueText}. View progress.`}
      accessibilityHint="Opens your progress and stats"
      onPress={() => router.push(routes.tabs.profile.progress)}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor }]}
      >
        <View style={styles.content}>
          <View style={styles.leftSection}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="flame"
                size={24}
                color={iconColor}
                accessible={false}
                importantForAccessibility="no"
              />
            </View>
            <View style={styles.textContent}>
              <Text
                style={[styles.overline, { color: overlineColor }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                CURRENT STREAK
              </Text>
              <Text
                style={[styles.title, { color: titleColor }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {valueText}
              </Text>
              <Text
                style={[styles.subtitle, { color: subtitleColor }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {getStreakSubtitle()}
              </Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(156, 163, 175, 1)'}
            style={styles.chevron}
            accessible={false}
            importantForAccessibility="no"
          />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.94,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  textContent: {
    flex: 1,
    gap: 2,
  },
  overline: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 12,
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 23,
    lineHeight: 27,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    lineHeight: 18,
    marginTop: 2,
  },
  chevron: {
    marginLeft: 12,
    flexShrink: 0,
  },
});
