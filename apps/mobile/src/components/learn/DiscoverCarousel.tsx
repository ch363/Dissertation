import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DiscoverCard } from '@/features/learn/mock';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  items: DiscoverCard[];
};

export function DiscoverCarousel({ items }: Props) {
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
          <View
            key={item.id}
            style={[
              styles.card,
              {
                backgroundColor: item.background,
                borderColor: theme.colors.border,
                shadowColor: '#0D1B2A',
              },
            ]}
          >
            <View style={styles.art} />
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{item.title}</Text>
            <Text style={[styles.cardSubtitle, { color: theme.colors.mutedText }]}>
              {item.subtitle}
            </Text>
          </View>
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
});
