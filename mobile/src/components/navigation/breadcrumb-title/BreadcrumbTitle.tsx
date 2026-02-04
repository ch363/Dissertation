import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  parent: string;
  current: string;
};

export function BreadcrumbTitle({ parent, current }: Props) {
  const { theme } = useAppTheme();
  return (
    <View
      accessibilityRole="header"
      accessibilityLabel={`${parent}, ${current}`}
      style={styles.row}
    >
      <Text style={[styles.parent, { color: theme.colors.mutedText }]} numberOfLines={1}>
        {parent}
      </Text>
      <Text style={[styles.sep, { color: theme.colors.mutedText }]} accessibilityElementsHidden>
        {' '}
        ›{' '}
      </Text>
      <Text style={[styles.current, { color: theme.colors.text }]} numberOfLines={1}>
        {current}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 260,
  },
  parent: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
    flexShrink: 1,
  },
  sep: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
  },
  current: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
    flexShrink: 1,
  },
});
