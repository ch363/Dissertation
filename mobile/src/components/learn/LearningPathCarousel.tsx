import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScrollView } from '@/components/ui';

import type { LearningPathItem } from '@/features/learn/utils/buildLearningPathItems';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

const SKELETON_PLACEHOLDER = '#E8ECF2';

function ModuleCoverImage({ uri }: { uri: string }) {
  const [loaded, setLoaded] = useState(false);
  const pulse = useRef(new Animated.Value(0.4)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.75,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const onLoad = () => {
    setLoaded(true);
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.imageContainer}>
      {!loaded && (
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: SKELETON_PLACEHOLDER, opacity: pulse }]}
        />
      )}
      <Animated.View style={[StyleSheet.absoluteFill, styles.image, { opacity: imageOpacity }]}>
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" onLoadEnd={onLoad} />
      </Animated.View>
    </View>
  );
}

export function LearningPathCarousel({ items, onPressItem }: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Learning Path</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: baseTheme.spacing.sm,
          paddingHorizontal: baseTheme.spacing.md,
          paddingBottom: 6,
        }}
      >
        {items.map((item) => {
          const isLocked = item.status === 'locked';
          const totalLessons = item.totalLessons ?? 0;
          const completedLessons = item.completedLessons ?? 0;
          const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
          
          return (
            <Pressable
              key={item.id}
              onPress={isLocked ? undefined : () => onPressItem(item.route)}
              disabled={isLocked}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: theme.colors.card,
                  shadowColor: '#000',
                  opacity: isLocked ? 0.6 : pressed ? 0.95 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              {item.imageUrl ? (
                <ModuleCoverImage uri={item.imageUrl} />
              ) : null}
              <View style={styles.cardContent}>
                {item.category && (
                  <Text style={[styles.category, { color: theme.colors.mutedText }]} numberOfLines={1}>
                    {item.category}
                  </Text>
                )}
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {isLocked && (
                    <Ionicons name="lock-closed" size={16} color={theme.colors.mutedText} accessible={false} importantForAccessibility="no" />
                  )}
                </View>
                
                {item.status === 'active' && totalLessons > 0 ? (
                  <View style={styles.progressGroup}>
                    <View style={styles.progressRow}>
                      <Text style={[styles.progressText, { color: theme.colors.mutedText }]}>
                        {completedLessons}/{totalLessons} completed
                      </Text>
                      <Text style={[styles.progressPercent, { color: theme.colors.mutedText }]}>
                        {Math.round(progressPercent)}%
                      </Text>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: `${theme.colors.border}80` }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: theme.colors.primary,
                            width: `${progressPercent}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ) : null}

                {item.status === 'active' && item.ctaLabel ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={item.ctaLabel}
                    onPress={() => onPressItem(item.route)}
                    style={({ pressed }) => [
                      styles.ctaButton,
                      {
                        backgroundColor: theme.colors.primary,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.ctaLabel, { color: theme.colors.onPrimary }]}>{item.ctaLabel}</Text>
                  </Pressable>
                ) : isLocked ? (
                  <View style={[styles.lockedButton, { backgroundColor: theme.colors.border }]}>
                    <Text style={[styles.lockedLabel, { color: theme.colors.mutedText }]}>Locked</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 12,
    gap: 10,
  },
  sectionHeader: {
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
  sectionTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: baseTheme.typography.bold,
  },
  card: {
    width: 300,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  completeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardContent: {
    padding: 20,
    gap: 8,
  },
  category: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontFamily: baseTheme.typography.bold,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  progressGroup: {
    gap: 8,
    marginTop: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressText: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 14,
  },
  progressPercent: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 14,
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  ctaButton: {
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaLabel: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  lockedButton: {
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  lockedLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
});
