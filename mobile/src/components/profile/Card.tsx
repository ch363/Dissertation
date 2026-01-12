import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  style?: ViewStyle;
  children: React.ReactNode;
};

export function Card({ style, children }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: baseTheme.colors.card,
    borderColor: baseTheme.colors.border,
    borderWidth: 1,
    borderRadius: baseTheme.radius.lg,
    padding: baseTheme.spacing.md,
  },
});
