import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
};

export function StatCard({ label, value, icon, color }: Props) {
  const { theme } = useAppTheme();
  const iconColor = color || theme.colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      {icon && <Ionicons name={icon} size={24} color={iconColor} style={styles.icon} />}
      <Text style={[styles.value, { color: theme.colors.text }]}>{String(value)}</Text>
      <Text style={[styles.label, { color: theme.colors.mutedText }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: baseTheme.spacing.md,
    borderRadius: baseTheme.radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  icon: {
    marginBottom: baseTheme.spacing.xs,
  },
  value: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 12,
    textAlign: 'center',
  },
});
