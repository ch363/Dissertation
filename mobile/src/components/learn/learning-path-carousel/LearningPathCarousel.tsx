import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getModuleIllustrationSource } from './moduleIllustrations';

import { ScrollView } from '@/components/ui';
import type { LearningPathItem } from '@/features/learn/utils/buildLearningPathItems';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

/** Shorter strip: fixed height so illustrations are compact and consistent. */
const ILLUSTRATION_HEIGHT = 80;
const CARD_WIDTH = 300;
/** Fixed card height so all cards align; illustration + content area match across cards. */
const CARD_HEIGHT = 330;

/** Picks a consistent icon for the module (fallback when image fails or no source). */
function getModuleIcon(title: string): keyof typeof Ionicons.glyphMap {
  const t = title.toLowerCase();
  if (t.includes('travel')) return 'airplane';
  if (t.includes('food') || t.includes('restaurant')) return 'restaurant';
  if (t.includes('family')) return 'people';
  if (t.includes('work') || t.includes('business')) return 'briefcase';
  if (t.includes('shopping')) return 'cart';
  if (t.includes('weather')) return 'sunny';
  if (t.includes('basics') || t.includes('phrase') || t.includes('grammar')) return 'book';
  return 'school';
}

function ModuleIllustration({
  title,
  iconColor,
  backgroundColor,
}: {
  title: string;
  iconColor: string;
  backgroundColor: string;
}) {
  const icon = getModuleIcon(title);
  const imageSource = getModuleIllustrationSource(title);
  const [imageError, setImageError] = useState(false);
  const showImage = Boolean(imageSource && !imageError);

  return (
    <View style={[styles.illustrationStrip, { backgroundColor }]}>
      {showImage && imageSource ? (
        <Image
          source={imageSource}
          style={styles.illustrationImage}
          resizeMode="cover"
          onError={() => setImageError(true)}
          accessible
          accessibilityLabel={`Illustration for ${title}`}
        />
      ) : (
        <Ionicons name={icon} size={36} color={iconColor} />
      )}
    </View>
  );
}

type Props = {
  items: LearningPathItem[];
  suggestedModuleId?: string | null;
  onPressItem: (route: string) => void;
};

function getNextIndex(items: LearningPathItem[]): number {
  return items.findIndex(
    (i) =>
      i.status === 'active' &&
      i.ctaLabel &&
      (i.ctaLabel.startsWith('Start') || i.ctaLabel.startsWith('Continue')),
  );
}

const HEADER_PADDING_H = 20;

export function LearningPathCarousel({ items, suggestedModuleId, onPressItem }: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const nextIndex = getNextIndex(items);
  const headerPadding = {
    paddingLeft: HEADER_PADDING_H + insets.left,
    paddingRight: HEADER_PADDING_H + insets.right,
  };

  return (
    <View style={styles.section}>
      <View style={[styles.sectionHeader, headerPadding]}>
        <View style={styles.headerContent}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Learning Path</Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: theme.colors.mutedText }]}>
          Continue your Italian journey
        </Text>
      </View>
      <ScrollView
        testID="learning-path-carousel"
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: baseTheme.spacing.sm,
          paddingBottom: 6,
          paddingLeft: HEADER_PADDING_H + insets.left,
        }}
      >
        {items.map((item, index) => {
          const isLocked = item.status === 'locked';
          const isNext = index === nextIndex;
          const isSuggested = suggestedModuleId != null && item.id === suggestedModuleId && !isNext;
          const totalLessons = item.totalLessons ?? 0;
          const completedLessons = item.completedLessons ?? 0;
          const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
          const nextUpMinutes = item.estimatedMinutes ?? 3;

          return (
            <Pressable
              key={item.id}
              onPress={isLocked ? undefined : () => onPressItem(item.route)}
              disabled={isLocked}
              accessibilityRole="button"
              accessibilityLabel={
                isLocked
                  ? `${item.title}, locked`
                  : isNext
                    ? `Next: ${item.title}, ${nextUpMinutes} minutes`
                    : isSuggested
                      ? `Suggested for you: ${item.title}`
                      : item.title
              }
              accessibilityHint={isLocked ? undefined : 'Double tap to open module'}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: theme.colors.card,
                  shadowColor: '#000',
                  opacity: isLocked ? 0.6 : pressed ? 0.92 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  ...(isNext && {
                    shadowOpacity: 0.12,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 4,
                    borderColor: theme.colors.primary + '40',
                    borderWidth: 1.5,
                  }),
                  ...(isSuggested && {
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 3,
                    borderColor: theme.colors.primary + '30',
                    borderWidth: 1.5,
                  }),
                },
              ]}
            >
              <ModuleIllustration
                title={item.title}
                iconColor={theme.colors.primary}
                backgroundColor={theme.colors.primary + '14'}
              />
              <View style={styles.cardContent}>
                <View style={styles.rowNext}>
                  {isNext ? (
                    <Text
                      style={[styles.nextUpLabel, { color: theme.colors.primary }]}
                      numberOfLines={1}
                    >
                      Next lesson: {item.title} ({nextUpMinutes} min)
                    </Text>
                  ) : isSuggested ? (
                    <Text
                      style={[styles.suggestedLabel, { color: theme.colors.primary }]}
                      numberOfLines={1}
                    >
                      Suggested for you
                    </Text>
                  ) : null}
                </View>
                <View style={styles.rowCategory}>
                  {item.category ? (
                    <Text
                      style={[styles.category, { color: theme.colors.mutedText }]}
                      numberOfLines={1}
                    >
                      {item.category}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.rowTitle}>
                  <View style={styles.cardHeader}>
                    <Text
                      style={[styles.cardTitle, { color: theme.colors.text }]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {item.title}
                    </Text>
                    {isLocked ? (
                      <Ionicons
                        name="lock-closed"
                        size={16}
                        color={theme.colors.mutedText}
                        accessible={false}
                        importantForAccessibility="no"
                      />
                    ) : null}
                  </View>
                </View>
                <View style={styles.rowProgress}>
                  {item.status === 'active' && totalLessons > 0 ? (
                    <View
                      style={styles.progressGroup}
                      accessibilityLabel={`Progress: ${completedLessons} of ${totalLessons} lessons completed, ${Math.round(progressPercent)}%`}
                    >
                      <View style={styles.progressRow}>
                        <Text style={[styles.progressText, { color: theme.colors.mutedText }]}>
                          {completedLessons}/{totalLessons} completed
                        </Text>
                        <Text style={[styles.progressPercent, { color: theme.colors.mutedText }]}>
                          {Math.round(progressPercent)}%
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.progressBar,
                          { backgroundColor: `${theme.colors.border}80` },
                        ]}
                      >
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
                  ) : (
                    <View style={styles.progressGroup}>
                      <View style={styles.progressRow}>
                        <Text style={[styles.progressText, { color: theme.colors.mutedText }]}>
                          {totalLessons > 0
                            ? `${completedLessons}/${totalLessons} completed`
                            : '0 completed'}
                        </Text>
                        <Text style={[styles.progressPercent, { color: theme.colors.mutedText }]}>
                          {totalLessons > 0 ? `${Math.round(progressPercent)}%` : '—'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.progressBar,
                          { backgroundColor: `${theme.colors.border}80` },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressFill,
                            { backgroundColor: theme.colors.primary, width: `${progressPercent}%` },
                          ]}
                        />
                      </View>
                    </View>
                  )}
                </View>
                <View style={styles.rowSpacer} />
                <View style={styles.rowButton}>
                  {item.status === 'active' && item.ctaLabel ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        isNext ? `${item.ctaLabel}, ${item.title}` : item.ctaLabel
                      }
                      onPress={() => onPressItem(item.route)}
                      style={({ pressed }) => [
                        styles.ctaButton,
                        {
                          backgroundColor: theme.colors.primary,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.ctaLabel, { color: theme.colors.onPrimary }]}>
                        {item.ctaLabel}
                      </Text>
                    </Pressable>
                  ) : isLocked ? (
                    <View style={[styles.lockedButton, { backgroundColor: theme.colors.border }]}>
                      <Text style={[styles.lockedLabel, { color: theme.colors.mutedText }]}>
                        Locked
                      </Text>
                    </View>
                  ) : null}
                </View>
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
    marginTop: 14,
    gap: 10,
  },
  sectionHeader: {
    gap: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 14,
    opacity: 0.75,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  countText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 13,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
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
  nextUpLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  suggestedLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  illustrationStrip: {
    width: '100%',
    height: ILLUSTRATION_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  illustrationImage: {
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
    flex: 1,
    padding: 14,
    gap: 3,
  },
  rowNext: {
    minHeight: 16,
    justifyContent: 'center',
  },
  rowCategory: {
    minHeight: 16,
    justifyContent: 'center',
  },
  rowTitle: {
    minHeight: 34,
    justifyContent: 'center',
  },
  rowProgress: {
    minHeight: 40,
    justifyContent: 'center',
  },
  rowSpacer: {
    flex: 1,
  },
  rowButton: {
    minHeight: 40,
    justifyContent: 'flex-end',
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
    gap: 3,
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
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  ctaButton: {
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ctaLabel: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  lockedButton: {
    borderRadius: 16,
    paddingVertical: 10,
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
