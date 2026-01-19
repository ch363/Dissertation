import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScrollView } from '@/components/ui';

import type { DiscoverItem } from '@/features/learn/types';
import type { RoutePath } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  items: DiscoverItem[];
  onPressItem: (route: RoutePath) => void;
};

export function DiscoverCarousel({ items, onPressItem }: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Discover</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: baseTheme.spacing.md,
          paddingHorizontal: baseTheme.spacing.lg,
          paddingVertical: baseTheme.spacing.sm,
        }}
      >
        {items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`${item.ctaLabel ?? 'Open'}: ${item.title}`}
            onPress={() => onPressItem(item.route)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: item.background,
                borderColor: theme.colors.border,
                shadowColor: '#0D1B2A',
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <View style={styles.art} />
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{item.title}</Text>
            <Text style={[styles.cardSubtitle, { color: theme.colors.mutedText }]}>
              {item.subtitle}
            </Text>
            <View style={styles.footerRow}>
              <View style={{ flex: 1 }} />
              <View style={[styles.ctaPill, { borderColor: 'rgba(0,0,0,0.08)' }]}>
                <Text style={[styles.ctaText, { color: theme.colors.primary }]}>
                  {item.ctaLabel ?? 'Open'}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: baseTheme.spacing.lg,
    gap: baseTheme.spacing.xs,
  },
  title: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 18,
    paddingHorizontal: baseTheme.spacing.lg,
  },
  card: {
    width: 220,
    borderRadius: 20,
    padding: baseTheme.spacing.md,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    gap: baseTheme.spacing.sm,
  },
  art: {
    height: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  cardTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 16,
  },
  cardSubtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 1,
  },
  ctaText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 13,
  },
});
