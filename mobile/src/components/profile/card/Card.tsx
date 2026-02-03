import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  style?: ViewStyle;
  children: React.ReactNode;
};

export function Card({ style, children }: Props) {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const CARD_RADIUS = 20;

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: CARD_RADIUS,
    padding: baseTheme.spacing.lg + 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
});
