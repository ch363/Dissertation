import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  title: string;
  subtitle: string;
  /** Optional badge text, e.g. "Maintain streak" */
  badgeText?: string;
  /** Optional time estimate, e.g. "5 min" */
  timeEstimate?: string;
  /** Optional XP reward, e.g. "+20 XP" */
  xpReward?: string;
  onPress: () => void;
};

export function ContinueLearningCTA({
  title,
  subtitle,
  badgeText,
  timeEstimate,
  xpReward,
  onPress,
}: Props) {
  const { theme } = useAppTheme();
  const gradientColors = [theme.colors.primary, theme.colors.profileHeader || theme.colors.primary] as const;

  return (
    <Pressable
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}. ${badgeText ?? ''}`}
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.titleBlock}>
              {badgeText && (
                <View style={styles.badge}>
                  <Ionicons name="flame" size={14} color="#FFF" strokeWidth={2.5} />
                  <Text style={styles.badgeText}>{badgeText}</Text>
                </View>
              )}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={28} color="rgba(255,255,255,0.7)" style={styles.chevron} />
          </View>
          {(timeEstimate || xpReward) && (
            <View style={styles.footerRow}>
              {timeEstimate && (
                <View style={styles.footerItem}>
                  <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.footerText}>{timeEstimate}</Text>
                </View>
              )}
              {xpReward && (
                <View style={styles.footerItem}>
                  <Ionicons name="flash" size={16} color="rgba(255,255,255,0.8)" strokeWidth={2} />
                  <Text style={styles.footerText}>{xpReward}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const CTA_RADIUS = 20;

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: CTA_RADIUS,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  pressed: {
    opacity: 0.97,
    transform: [{ scale: 0.99 }],
  },
  gradient: {
    padding: baseTheme.spacing.lg + 6,
    borderRadius: CTA_RADIUS,
    overflow: 'hidden',
  },
  content: {
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: baseTheme.spacing.md + 2,
  },
  titleBlock: {
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: baseTheme.spacing.sm + 2,
  },
  badgeText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 11,
    color: '#FFF',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 24,
    color: '#FFF',
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  chevron: {
    marginTop: baseTheme.spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.lg,
    paddingTop: baseTheme.spacing.md + 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    letterSpacing: 0.2,
  },
});
