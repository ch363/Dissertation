import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScrollView } from '@/components/ui';

import type { LearningPathItem } from '@/features/learn/utils/buildLearningPathItems';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  items: LearningPathItem[];
  onPressItem: (route: string) => void;
};

export function LearningPathCarousel({ items, onPressItem }: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Learning Path</Text>
        <Text style={[styles.chevron, { color: theme.colors.mutedText }]}>{'>>'}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: baseTheme.spacing.md,
          paddingHorizontal: baseTheme.spacing.lg,
        }}
      >
        {items.map((item) => {
          const isLocked = item.status === 'locked';
          const totalSegments = item.totalSegments ?? 0;
          const completedSegments = item.completedSegments ?? 0;
          return (
            <View
              key={item.id}
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  shadowColor: '#0D1B2A',
                  opacity: isLocked ? 0.6 : 1,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                  {item.title}
                </Text>
                {isLocked ? (
                  <Ionicons name="lock-closed" size={16} color={theme.colors.mutedText} />
                ) : null}
              </View>
              <Text style={[styles.cardSubtitle, { color: theme.colors.mutedText }]}>
                {item.subtitle}
              </Text>

              {item.status === 'active' && totalSegments ? (
                <View style={styles.progressGroup}>
                  <View style={styles.segmentRow}>
                    {Array.from({ length: totalSegments }).map((_, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.segment,
                          {
                            backgroundColor:
                              idx < completedSegments ? theme.colors.primary : theme.colors.border,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.progressLabel, { color: theme.colors.mutedText }]}>
                    {item.completedLessons}/{item.totalLessons} completed
                  </Text>
                </View>
              ) : null}

              {item.status === 'active' && item.ctaLabel ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={item.ctaLabel}
                  onPress={() => onPressItem(item.route)}
                  style={[styles.ctaButton, { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={[styles.ctaLabel, { color: theme.colors.onPrimary }]}>{item.ctaLabel}</Text>
                </Pressable>
              ) : (
                <View style={styles.lockRow}>
                  <Ionicons name="lock-closed" size={16} color={theme.colors.mutedText} />
                  <Text style={[styles.lockText, { color: theme.colors.mutedText }]}>
                    Locked
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: baseTheme.spacing.lg,
    gap: baseTheme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: baseTheme.spacing.lg,
    paddingRight: baseTheme.spacing.lg + 4,
  },
  sectionTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 18,
  },
  chevron: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 14,
  },
  card: {
    width: 260,
    borderRadius: 20,
    borderWidth: 1,
    padding: baseTheme.spacing.lg,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    gap: baseTheme.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
  cardSubtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
  },
  progressGroup: {
    gap: baseTheme.spacing.xs,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 999,
  },
  progressLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 12,
  },
  ctaButton: {
    marginTop: baseTheme.spacing.sm,
    borderRadius: baseTheme.radius.lg,
    paddingVertical: baseTheme.spacing.sm,
    alignItems: 'center',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  ctaLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: baseTheme.spacing.sm,
  },
  lockText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
  },
});
