import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ScrollView, StaticCard } from '@/components/ui';

import { LearnHeader } from '@/components/learn/LearnHeader';
import { SuggestedForYouSection } from '@/components/learn/SuggestedForYouSection';
import { LearnScreenSkeleton } from '@/features/learn/components/LearnScreenSkeleton';
import { LearningPathCarousel } from '@/components/learn/LearningPathCarousel';
import { ReviewSection } from '@/components/learn/ReviewSection';
import { getSuggestions, type ModuleSuggestion } from '@/services/api/learn';
import { getCachedLearnScreenData, preloadLearnScreenData } from '@/services/api/learn-screen-cache';
import { getDashboard } from '@/services/api/profile';
import { getLessons, getModules } from '@/services/api/modules';
import { getUserLessons } from '@/services/api/progress';
import { buildLearningPathItems, type LearningPathItem } from '@/features/learn/utils/buildLearningPathItems';
import { routeBuilders, routes } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import { useAsyncData } from '@/hooks/useAsyncData';

export default function LearnScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const hasLoadedOnceRef = useRef(false);

  const { data, loading, reload } = useAsyncData<{
    learningPathItems: LearningPathItem[];
    dueReviewCount: number;
    estimatedReviewMinutes: number | null;
    suggestedModule: ModuleSuggestion | null;
  }>(
    'LearnScreen',
    async () => {
      const cached = getCachedLearnScreenData();
      let modules, lessons, userProgress, dashboard, suggestions;

      if (cached) {
        modules = cached.modules;
        lessons = cached.lessons;
        userProgress = cached.userProgress;
        dashboard = cached.dashboard;
        suggestions = cached.suggestions;
        
        preloadLearnScreenData().catch(() => {});
      } else {
        [modules, lessons, userProgress, dashboard, suggestions] = await Promise.all([
          getModules().catch(() => []),
          getLessons().catch(() => []),
          getUserLessons().catch(() => []),
          getDashboard().catch(() => ({ streak: 0, dueReviewCount: 0, activeLessonCount: 0, xpTotal: 0, estimatedReviewMinutes: 0 })),
          getSuggestions({ limit: 8 }).catch(() => ({ lessons: [], modules: [] })),
        ]);
      }

      const learningPathItems = buildLearningPathItems({
        modules,
        lessons,
        userProgress,
        maxSegments: 8,
      });

      const existingModuleIds = new Set(modules.map((m) => m.id));

      const validModuleSuggestions = suggestions.modules.filter((ms) =>
        existingModuleIds.has(ms.module.id),
      );
      let featuredModuleSuggestion: ModuleSuggestion | null = validModuleSuggestions[0] ?? null;
      if (featuredModuleSuggestion == null && modules.length > 0) {
        const first = modules[0];
        featuredModuleSuggestion = {
          module: { id: first.id, title: first.title, imageUrl: first.imageUrl ?? null },
          reason: 'A great place to continue',
        };
      }

      return {
        learningPathItems,
        dueReviewCount: dashboard.dueReviewCount || 0,
        estimatedReviewMinutes:
          dashboard.estimatedReviewMinutes != null && dashboard.estimatedReviewMinutes > 0
            ? dashboard.estimatedReviewMinutes
            : null,
        suggestedModule: featuredModuleSuggestion,
      };
    },
    []
  );

  const learningPathItems = data?.learningPathItems ?? [];
  const dueReviewCount = data?.dueReviewCount ?? 0;
  const estimatedReviewMinutes = data?.estimatedReviewMinutes ?? null;
  const suggestedModule = data?.suggestedModule ?? null;

  useFocusEffect(
    useCallback(() => {
      if (loading) return;
      const cached = getCachedLearnScreenData();
      const needLoad = !hasLoadedOnceRef.current || !cached;
      if (needLoad) {
        hasLoadedOnceRef.current = true;
        reload();
      } else if (cached) {
        preloadLearnScreenData().catch(() => {});
      }
    }, [reload, loading])
  );

  if (loading) {
    return <LearnScreenSkeleton />;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ backgroundColor: theme.colors.background }}
      >
        <LearnHeader />
        {dueReviewCount > 0 ? (
          <>
            <StaticCard style={[styles.sectionBlock, styles.firstSection]}>
              <ReviewSection
                dueCount={dueReviewCount}
                estimatedReviewMinutes={estimatedReviewMinutes}
                onStart={() => router.push({ pathname: routes.tabs.review, params: { from: 'learn' } })}
              />
            </StaticCard>
            <StaticCard style={styles.sectionBlock}>
              <LearningPathCarousel
                items={learningPathItems}
                onPressItem={(route: string) => router.push(route)}
              />
            </StaticCard>
          </>
        ) : (
          <>
            <StaticCard style={[styles.sectionBlock, styles.firstSection]}>
              <LearningPathCarousel
                items={learningPathItems}
                onPressItem={(route: string) => router.push(route)}
              />
            </StaticCard>
            <StaticCard style={styles.sectionBlock}>
              <ReviewSection
                dueCount={dueReviewCount}
                estimatedReviewMinutes={estimatedReviewMinutes}
                onStart={() => router.push({ pathname: routes.tabs.review, params: { from: 'learn' } })}
              />
            </StaticCard>
          </>
        )}
        {suggestedModule != null && (
          <StaticCard style={styles.sectionBlock}>
            <SuggestedForYouSection
              suggestion={suggestedModule}
              onPress={() => router.push(routeBuilders.courseDetail(suggestedModule.module.id))}
            />
          </StaticCard>
        )}

        <StaticCard style={[styles.sectionBlock, styles.allModulesSection]}>
          <View style={styles.allModulesHeader}>
            <View style={styles.allModulesHeaderLeft}>
              <Text style={[styles.allModulesTitle, { color: theme.colors.text }]}>
                All Modules
              </Text>
              <View style={styles.allModulesBadge}>
                <Text style={styles.allModulesBadgeText}>Catalog</Text>
              </View>
            </View>
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
        </StaticCard>
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
  firstSection: {
    marginTop: 4,
  },
  allModulesSection: {
    marginTop: 8,
    paddingHorizontal: 20,
    gap: 12,
  },
  allModulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
