import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OUTER_CARD_RADIUS, softShadow } from './homeStyles';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

export type HomePrimaryAction =
  | {
      kind: 'review';
      label: 'Start Review';
      subtitle: string;
      dueCount: number;
    }
  | {
      kind: 'continue';
      label: 'Continue Lesson';
      subtitle: string;
      detailLine?: string;
    }
  | {
      kind: 'startNext';
      label: 'Start Next Lesson';
      subtitle: string;
      detailLine?: string;
    };

type Props = {
  action: HomePrimaryAction;
  onPress: () => void;
};

export function HomePrimaryCtaCard({ action, onPress }: Props) {
  const { theme } = useAppTheme();

  const icon: keyof typeof Ionicons.glyphMap =
    action.kind === 'review' ? 'refresh' : action.kind === 'continue' ? 'play' : 'book-outline';
  const cardBackground = theme.colors.primary;
  const onPrimary = theme.colors.onPrimary;

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action.label}
        onPress={onPress}
        style={({ pressed }) => [styles.pressable, { opacity: pressed ? 0.94 : 1 }]}
      >
        <LinearGradient
          colors={[cardBackground, cardBackground]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, { borderRadius: OUTER_CARD_RADIUS }]}
        >
          <View style={styles.cardInner}>
            <View style={styles.topRow}>
              <View style={[styles.iconBox, { backgroundColor: theme.colors.ctaCardAccent }]}>
                <Ionicons
                  name={icon}
                  size={24}
                  color={onPrimary}
                  accessible={false}
                  importantForAccessibility="no"
                />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.label, { color: onPrimary }]}>NEXT UP</Text>
                <Text
                  style={[styles.title, { color: onPrimary }]}
                  numberOfLines={1}
                >
                  {action.label}
                </Text>
                <Text style={[styles.subtitle, { color: onPrimary }]} numberOfLines={1}>
                  {action.subtitle}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={22}
                color={onPrimary}
                style={{ opacity: 0.95 }}
                accessible={false}
                importantForAccessibility="no"
              />
            </View>

            {'detailLine' in action && action.detailLine ? (
              <View style={styles.detailRow}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={onPrimary}
                  style={{ opacity: 0.9 }}
                  accessible={false}
                  importantForAccessibility="no"
                />
                <Text style={[styles.detailText, { color: onPrimary }]} numberOfLines={1}>
                  {action.detailLine}
                </Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: baseTheme.spacing.sm,
  },
  pressable: {
    ...softShadow,
    borderRadius: OUTER_CARD_RADIUS,
    overflow: 'hidden',
  },
  gradient: {
    padding: 24,
  },
  cardInner: {
    gap: baseTheme.spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    opacity: 0.95,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 19,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    marginTop: 2,
    opacity: 0.9,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  detailText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    opacity: 0.9,
  },
});
