import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';

type Props = {
  insetLeft?: number;
  style?: ViewStyle;
};

export function ListDivider({ insetLeft = 16, style }: Props) {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: theme.colors.border, marginLeft: insetLeft },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
