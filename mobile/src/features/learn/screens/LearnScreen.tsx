import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ScrollView } from '@/components/ui';

import { DiscoverCarousel } from '@/components/learn/DiscoverCarousel';
import { LearnHeader } from '@/components/learn/LearnHeader';
import { LearnScreenSkeleton } from '@/features/learn/components/LearnScreenSkeleton';
import { LearningPathCarousel } from '@/components/learn/LearningPathCarousel';
import { ReviewSection } from '@/components/learn/ReviewSection';
import { getSuggestions } from '@/services/api/learn';
import { getCachedLearnScreenData, preloadLearnScreenData } from '@/services/api/learn-screen-cache';
import { getDashboard } from '@/services/api/profile';
import { getLessons, getModules } from '@/services/api/modules';
import { getUserLessons } from '@/services/api/progress';
import { buildLearningPathItems, type LearningPathItem } from '@/features/learn/utils/buildLearningPathItems';
import type { DiscoverItem } from '@/features/learn/types';
import { routeBuilders, routes } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import { makeSessionId } from '@/features/session/sessionBuilder';

export default function LearnScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [discoverItems, setDiscoverItems] = useState<DiscoverItem[]>([]);
  const [learningPathItems, setLearningPathItems] = useState<LearningPathItem[]>([]);
  const [dueReviewCount, setDueReviewCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    // Check for cached data first - if available, use it immediately without showing loading
    const cached = getCachedLearnScreenData();
    let modules, lessons, userProgress, dashboard, suggestions;

    if (cached) {
      // Use cached data for instant load - don't show loading spinner
      modules = cached.modules;
      lessons = cached.lessons;
      userProgress = cached.userProgress;
      dashboard = cached.dashboard;
      suggestions = cached.suggestions;
    } else {
      // No cache available, show loading and fetch fresh data
      setLoading(true);
      [modules, lessons, userProgress, dashboard, suggestions] = await Promise.all([
        getModules().catch(() => []),
        getLessons().catch(() => []),
        getUserLessons().catch(() => []),
        getDashboard().catch(() => ({ streak: 0, dueReviewCount: 0, activeLessonCount: 0, xpTotal: 0 })),
        getSuggestions({ limit: 8 }).catch(() => ({ lessons: [], modules: [] })),
      ]);
    }

    try {

      setDueReviewCount(dashboard.dueReviewCount || 0);
      setLearningPathItems(
        buildLearningPathItems({
          modules,
          lessons,
          userProgress,
          maxSegments: 8,
        }),
      );

      const existingLessonIds = new Set(lessons.map((l) => l.id));
      const existingModuleIds = new Set(modules.map((m) => m.id));

      // Transform suggestions to DiscoverItem[]
      const discoverCards: DiscoverItem[] = [];
      // Theme-aware backgrounds: subtle tint over current theme background.
      const backgroundColors = [
        `${theme.colors.primary}18`,
        `${theme.colors.secondary}18`,
        `${theme.colors.primary}12`,
        `${theme.colors.secondary}12`,
        `${theme.colors.primary}0F`,
        `${theme.colors.secondary}0F`,
      ];
      
      // Add lesson suggestions
      suggestions.lessons
        .filter((lessonSuggestion) => existingLessonIds.has(lessonSuggestion.lesson.id))
        .forEach((lessonSuggestion, index) => {
        discoverCards.push({
          kind: 'lesson',
          id: lessonSuggestion.lesson.id,
          title: lessonSuggestion.lesson.title,
          subtitle: lessonSuggestion.reason || 'Continue your learning journey',
          background: backgroundColors[index % backgroundColors.length],
          route: routeBuilders.lessonStart(lessonSuggestion.lesson.id),
          imageUrl: lessonSuggestion.lesson.imageUrl,
          ctaLabel: 'Start lesson',
        });
      });

      // Add module suggestions
      suggestions.modules
        .filter((moduleSuggestion) => existingModuleIds.has(moduleSuggestion.module.id))
        .forEach((moduleSuggestion, index) => {
        discoverCards.push({
          kind: 'module',
          id: moduleSuggestion.module.id,
          title: moduleSuggestion.module.title,
          subtitle: moduleSuggestion.reason || 'Explore new content',
          background: backgroundColors[(suggestions.lessons.length + index) % backgroundColors.length],
          route: routeBuilders.courseDetail(moduleSuggestion.module.id),
          imageUrl: moduleSuggestion.module.imageUrl,
          ctaLabel: 'View course',
        });
      });

      setDiscoverItems(discoverCards);
      setLoading(false);

      // If we used cached data, refresh in the background for next time
      if (cached) {
        preloadLearnScreenData().catch(() => {
          // Silently fail - background refresh is best effort
        });
      }
    } catch (error) {
      console.error('Error loading learn screen data:', error);
      // Gracefully handle errors - don't block UI
      setLoading(false);
    }
  }, [theme.colors.primary, theme.colors.secondary]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (loading) {
    return <LearnScreenSkeleton />;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ backgroundColor: theme.colors.background }}
      >
        <LearnHeader />
        <View style={[styles.sectionBlock, { backgroundColor: theme.colors.card + '18' }]}>
          <LearningPathCarousel
            items={learningPathItems}
            onPressItem={(route: string) => router.push(route)}
          />
        </View>
        <View style={[styles.sectionBlock, { backgroundColor: theme.colors.card + '18' }]}>
          <ReviewSection
            dueCount={dueReviewCount}
            onStart={() => router.push({ pathname: routes.tabs.review, params: { from: 'learn' } })}
          />
        </View>
        {discoverItems.length > 0 && (
          <View style={[styles.sectionBlock, { backgroundColor: theme.colors.card + '18' }]}>
            <DiscoverCarousel
              items={discoverItems}
              onPressItem={(item) => {
                if (item.kind === 'lesson') {
                  const sessionId = makeSessionId('learn');
                  router.push({
                    pathname: routeBuilders.sessionDetail(sessionId),
                    params: { lessonId: item.id, kind: 'learn' },
                  });
                  return;
                }

                router.push(item.route);
              }}
            />
          </View>
        )}

        {/* All Modules Section */}
        <View style={[styles.sectionBlock, styles.allModulesSection, { backgroundColor: theme.colors.card + '18' }]}>
          <View style={styles.allModulesHeader}>
            <View style={styles.allModulesHeaderLeft}>
              <Text style={[styles.allModulesTitle, { color: theme.colors.text }]}>
                All Modules
              </Text>
              <View style={styles.allModulesBadge}>
                <Text style={styles.allModulesBadgeText}>Catalog</Text>
              </View>
            </View>
            <Pressable
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="View all modules"
              onPress={() => router.push(routes.course.list)}
              style={styles.allModulesViewAll}
            >
              <Text style={[styles.allModulesViewAllText, { color: theme.colors.primary }]}>
                View
              </Text>
            </Pressable>
          </View>
          <Text style={[styles.allModulesSubtitle, { color: theme.colors.mutedText }]}>
            Explore every course and find your next lesson
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Browse all modules"
            onPress={() => router.push(routes.course.list)}
            style={({ pressed }) => [
              styles.allModulesCard,
              { opacity: pressed ? 0.95 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.allModulesGradient}
            >
              <View style={styles.allModulesCardContent}>
                <View style={[styles.allModulesIconWrap, { backgroundColor: theme.colors.ctaCardAccent }]}>
                  <Ionicons name="library-outline" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.allModulesCardText}>
                  <Text style={styles.allModulesCardTitle}>Browse full catalog</Text>
                  <Text style={styles.allModulesCardSubtitle}>
                    All courses in one place — start any module
                  </Text>
                </View>
                <View style={[styles.allModulesArrowWrap, { backgroundColor: theme.colors.ctaCardAccent }]}>
                  <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  sectionBlock: {
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  allModulesSection: {
    marginTop: 8,
    paddingHorizontal: 20,
    gap: 12,
  },
  allModulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  allModulesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allModulesTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  allModulesBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  allModulesBadgeText: {
    fontSize: 12,
    fontFamily: baseTheme.typography.bold,
    color: '#264FD4',
  },
  allModulesViewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  allModulesViewAllText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 15,
  },
  allModulesSubtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
    marginBottom: 4,
  },
  allModulesCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#264FD4',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  allModulesGradient: {
    padding: 24,
  },
  allModulesCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  allModulesIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allModulesCardText: {
    flex: 1,
    gap: 4,
  },
  allModulesCardTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 18,
    letterSpacing: -0.2,
    color: '#FFFFFF',
  },
  allModulesCardSubtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  allModulesArrowWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
