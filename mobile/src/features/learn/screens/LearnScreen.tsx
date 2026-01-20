import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScrollView } from '@/components/ui';

import { DiscoverCarousel } from '@/components/learn/DiscoverCarousel';
import { LearnHeader } from '@/components/learn/LearnHeader';
import { LearningPathCarousel } from '@/components/learn/LearningPathCarousel';
import { ReviewSection } from '@/components/learn/ReviewSection';
import { getSuggestions } from '@/services/api/learn';
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
  const { theme, isDark } = useAppTheme();
  const router = useRouter();
  const [discoverItems, setDiscoverItems] = useState<DiscoverItem[]>([]);
  const [learningPathItems, setLearningPathItems] = useState<LearningPathItem[]>([]);
  const [dueReviewCount, setDueReviewCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [modules, lessons, userProgress, dashboard, suggestions] = await Promise.all([
        getModules().catch(() => []),
        getLessons().catch(() => []),
        getUserLessons().catch(() => []),
        getDashboard().catch(() => ({ streak: 0, dueReviewCount: 0, activeLessonCount: 0, xpTotal: 0 })),
        getSuggestions({ limit: 8 }).catch(() => ({ lessons: [], modules: [] })),
      ]);

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
    } catch (error) {
      console.error('Error loading learn screen data:', error);
      // Gracefully handle errors - don't block UI
    } finally {
      setLoading(false);
    }
  }, []);

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
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.mutedText }]}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: baseTheme.spacing.xl }}
      >
        <LearnHeader />
        <LearningPathCarousel
          items={learningPathItems}
          onPressItem={(route) => router.push(route)}
        />
        <ReviewSection
          dueCount={dueReviewCount}
          onStart={() => router.push(routes.tabs.review)}
        />
        {discoverItems.length > 0 && (
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
        )}
        <View style={{ height: baseTheme.spacing.xl }} />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/learn/list')}
          style={({ pressed }) => [
            styles.listCta,
            {
              borderColor: theme.colors.border,
              backgroundColor: pressed ? (isDark ? theme.colors.border : `${theme.colors.primary}0A`) : theme.colors.card,
            },
          ]}
        >
          <View style={styles.listCtaHeader}>
            <Text style={[styles.listTitle, { color: theme.colors.text }]}>Browse all lessons</Text>
            <Text style={[styles.listLink, { color: theme.colors.primary }]}>View</Text>
          </View>
          <Text style={[styles.listSubtitle, { color: theme.colors.mutedText }]}>
            Jump into A1 lessons and overviews
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: baseTheme.spacing.md,
  },
  loadingText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
  },
  listCta: {
    marginTop: baseTheme.spacing.lg,
    marginHorizontal: baseTheme.spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    padding: baseTheme.spacing.md,
    gap: baseTheme.spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  listCtaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
  listLink: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
  },
  listSubtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
  },
});
