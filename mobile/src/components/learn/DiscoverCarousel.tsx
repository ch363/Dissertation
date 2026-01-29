import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ScrollView } from '@/components/ui';

import type { DiscoverItem } from '@/features/learn/types';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  items: DiscoverItem[];
  onPressItem: (item: DiscoverItem) => void;
};

export function DiscoverCarousel({ items, onPressItem }: Props) {
  const { theme } = useAppTheme();

  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Discover</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>New</Text>
          </View>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 16,
          paddingHorizontal: 20,
          paddingBottom: 8,
        }}
      >
        {items.map((item, index) => {
          const gradientColors: [string, string][] = [
            ['#A855F7', '#9333EA'],
            [theme.colors.primary, theme.colors.primary],
            ['#F59E0B', '#D97706'],
            ['#EC4899', '#DB2777'],
            ['#22C55E', '#16A34A'],
            ['#8B5CF6', '#7C3AED'],
          ];
          const colors = gradientColors[index % gradientColors.length];
          const isBlueCard = (index % 6) === 1;

          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.ctaLabel ?? 'Open'}: ${item.title}`}
              onPress={() => onPressItem(item)}
              style={({ pressed }) => [
                styles.card,
                {
                  opacity: pressed ? 0.95 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardContent}>
                  <View style={[
                    styles.iconContainer,
                    isBlueCard && { backgroundColor: theme.colors.ctaCardAccent },
                  ]}
                  >
                    <Ionicons name="sparkles" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardSubtitle} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                  <View style={styles.ctaContainer}>
                    <Text style={styles.ctaText}>{item.ctaLabel ?? 'Explore'}</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: baseTheme.typography.bold,
    color: '#B45309',
  },
  card: {
    width: 260,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardGradient: {
    padding: 24,
  },
  cardContent: {
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 18,
    letterSpacing: -0.2,
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  ctaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  ctaText: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
