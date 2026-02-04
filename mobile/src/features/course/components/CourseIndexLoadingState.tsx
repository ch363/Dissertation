import React from 'react';
import { View, StyleSheet } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

export function CourseIndexLoadingState() {
  const { theme } = useAppTheme();

  return (
    <View style={styles.wrap}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.row}>
            <View style={[styles.thumbSkeleton, { backgroundColor: theme.colors.border }]} />
            <View style={styles.contentSkeleton}>
              <View
                style={[styles.line, styles.lineTitle, { backgroundColor: theme.colors.border }]}
              />
              <View
                style={[styles.line, styles.lineDesc, { backgroundColor: theme.colors.border }]}
              />
              <View style={styles.metaRow}>
                <View style={[styles.pillSkeleton, { backgroundColor: theme.colors.border }]} />
                <View style={[styles.pillSkeleton, { backgroundColor: theme.colors.border }]} />
                <View
                  style={[
                    styles.pillSkeleton,
                    styles.pillWider,
                    { backgroundColor: theme.colors.border },
                  ]}
                />
              </View>
            </View>
            <View style={[styles.chevronSkeleton, { backgroundColor: theme.colors.border }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    paddingHorizontal: baseTheme.spacing.lg,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  thumbSkeleton: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  contentSkeleton: {
    flex: 1,
    minWidth: 0,
  },
  line: {
    height: 14,
    borderRadius: 4,
  },
  lineTitle: {
    width: '75%',
    marginBottom: 8,
  },
  lineDesc: {
    width: '100%',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillSkeleton: {
    height: 20,
    width: 48,
    borderRadius: 6,
  },
  pillWider: {
    width: 72,
  },
  chevronSkeleton: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
