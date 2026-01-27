import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CARD_BORDER, OUTER_CARD_RADIUS, softShadow } from './homeStyles';

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
  onPressMore?: () => void;
};

export function HomePrimaryCtaCard({ action, onPress, onPressMore }: Props) {
  const { theme } = useAppTheme();
  const showMore = action.kind === 'review' && action.dueCount > 1 && !!onPressMore;
  const moreCount = action.kind === 'review' ? Math.max(0, action.dueCount - 1) : 0;

  const icon: keyof typeof Ionicons.glyphMap =
    action.kind === 'review' ? 'refresh' : action.kind === 'continue' ? 'play' : 'sparkles';
  const isHero = action.kind !== 'review';
  const iconBg = isHero ? `${theme.colors.primary}22` : `${theme.colors.primary}14`;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Next up</Text>
        {showMore ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="See more in Learn"
            hitSlop={8}
            onPress={onPressMore}
          >
            <Text style={[styles.moreText, { color: theme.colors.mutedText }]}>{`+${moreCount} more`}</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action.label}
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: isHero ? theme.colors.primary : CARD_BORDER,
            borderWidth: isHero ? 1.5 : 1,
            shadowOpacity: isHero ? 0.12 : 0.07,
            shadowRadius: isHero ? 22 : 16,
            shadowOffset: { width: 0, height: isHero ? 12 : 10 },
            elevation: isHero ? 7 : 5,
            opacity: pressed ? 0.94 : 1,
          },
        ]}
      >
        <View style={styles.topRow}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: iconBg,
              },
            ]}
          >
            <Ionicons
              name={icon}
              size={20}
              color={theme.colors.primary}
              accessible={false}
              importantForAccessibility="no"
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={[
                styles.title,
                { color: theme.colors.text, fontSize: isHero ? 22 : styles.title.fontSize },
              ]}
              numberOfLines={1}
            >
              {action.label}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.mutedText }]} numberOfLines={2}>
              {action.subtitle}
            </Text>
          </View>
          <Ionicons
            name="arrow-forward"
            size={18}
            color={theme.colors.mutedText}
            accessible={false}
            importantForAccessibility="no"
          />
        </View>

        {action.detailLine ? (
          <View style={styles.detailRow}>
            <Ionicons
              name="time-outline"
              size={14}
              color={theme.colors.mutedText}
              accessible={false}
              importantForAccessibility="no"
            />
            <Text style={[styles.detailText, { color: theme.colors.mutedText }]} numberOfLines={1}>
              {action.detailLine}
            </Text>
          </View>
        ) : null}

        {/* Intentionally hide secondary helperText on Home to keep this to 3 lines. */}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: baseTheme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 24,
  },
  moreText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 15,
  },
  card: {
    borderRadius: OUTER_CARD_RADIUS,
    borderWidth: 1.5,
    padding: baseTheme.spacing.md + 10,
    gap: baseTheme.spacing.md,
    ...softShadow,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 20,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -6,
  },
  detailText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
  },
  helperText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
  },
});

