import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';

type Props = ViewProps & {
  children: React.ReactNode;
};

export function SurfaceCard({ style, children, ...rest }: Props) {
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
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
});
