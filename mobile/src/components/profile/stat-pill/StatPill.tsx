import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

export type StatPillIcon = 'trophy' | 'zap' | 'flame';

type Props = {
  label: string;
  value: string;
  accessibilityLabel?: string;
  /** Primary: emphasized card with colored icon. Secondary: muted card. */
  variant?: 'primary' | 'secondary';
  icon?: StatPillIcon;
};

const ICON_MAP: Record<StatPillIcon, keyof typeof Ionicons.glyphMap> = {
  trophy: 'trophy',
  zap: 'flash',
  flame: 'flame',
};

export function StatPill({ label, value, accessibilityLabel, variant = 'secondary', icon }: Props) {
  const { theme } = useAppTheme();
  const a11y = accessibilityLabel ?? `${value} ${label}`;
  const isPrimary = variant === 'primary';
  const iconName = icon ? ICON_MAP[icon] : undefined;
  const iconColor = isPrimary ? theme.colors.primary : theme.colors.mutedText;
  const iconSize = isPrimary ? 20 : 16;

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: isPrimary ? theme.colors.card : theme.colors.card,
          borderColor: isPrimary ? theme.colors.border : theme.colors.border,
          borderWidth: 1,
        },
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={a11y}
    >
      {iconName && (
        <View style={styles.iconWrap}>
          <Ionicons name={iconName} size={iconSize} color={iconColor} strokeWidth={isPrimary ? 2.5 : 2} />
        </View>
      )}
      <Text style={[styles.value, { color: theme.colors.text }, isPrimary && styles.valuePrimary]}>{value}</Text>
      <Text style={[styles.label, { color: theme.colors.mutedText }]}>{label}</Text>
    </View>
  );
}

const PILL_RADIUS = 20;

const styles = StyleSheet.create({
  pill: {
    flex: 1,
    borderRadius: PILL_RADIUS,
    paddingVertical: baseTheme.spacing.lg,
    paddingHorizontal: baseTheme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  iconWrap: {
    marginBottom: baseTheme.spacing.sm + 2,
  },
  value: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 28,
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  valuePrimary: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  label: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
