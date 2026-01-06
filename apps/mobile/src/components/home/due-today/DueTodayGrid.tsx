import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DueTodayTile, DueTodayTileItem } from './DueTodayTile';
import { theme as baseTheme } from '@/theme';
import { useAppTheme } from '@/providers/ThemeProvider';

type Props = {
  items: DueTodayTileItem[];
  onPressTile: (route: string) => void;
  onPressMore: () => void;
};

export function DueTodayGrid({ items, onPressTile, onPressMore }: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Due today</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View more items due today"
          hitSlop={8}
          onPress={onPressMore}
        >
          <Text style={[styles.moreText, { color: theme.colors.mutedText }]}>+4 more &gt;</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {items.map((item) => (
          <DueTodayTile key={item.title} item={item} onPress={onPressTile} />
        ))}
      </View>
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
    fontSize: 20,
  },
  moreText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 15,
  },
  grid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    columnGap: baseTheme.spacing.sm,
    rowGap: baseTheme.spacing.sm,
    width: '100%',
    paddingHorizontal: 2,
  },
});

