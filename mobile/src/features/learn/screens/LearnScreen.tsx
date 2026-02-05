import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LearnHeader, LearningPathCarousel, ReviewSection } from '@/components/learn';
import { LoadingScreen } from '@/components/ui';
import {
  buildLearningPathItems,
  type LearningPathItem,
} from '@/features/learn/utils/buildLearningPathItems';
import { makeSessionId } from '@/features/session/sessionBuilder';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getSuggestions, type ModuleSuggestion } from '@/services/api/learn';
import {
  clearLearnScreenCache,
  getCachedLearnScreenData,
  preloadLearnScreenData,
} from '@/services/api/learn-screen-cache';
import { getLessons, getModules } from '@/services/api/modules';
import { getDashboard } from '@/services/api/profile';
import { getUserLessons } from '@/services/api/progress';
import { routeBuilders, routes } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

const CONTENT_PADDING_H = 20;

export default function LearnScreen() {
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const catalogGradientColors = isDark
    ? [theme.colors.profileHeader, theme.colors.profileHeader]
    : [theme.colors.primary, theme.colors.primary];
  const catalogBadgeBg = isDark ? theme.colors.profileHeader + '40' : '#DBEAFE';
  const catalogBadgeText = isDark ? theme.colors.text : '#264FD4';
  const router = useRouter();
  const hasLoadedOnceRef = useRef(false);
  const isLoadingRef = useRef(false);
  const [hasCompletedFocusCheck, setHasCompletedFocusCheck] = React.useState(false);

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
          getDashboard().catch(() => ({
            streak: 0,
            dueReviewCount: 0,
            activeLessonCount: 0,
            xpTotal: 0,
            estimatedReviewMinutes: 0,
          })),
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
    [],
  );

  const learningPathItems = data?.learningPathItems ?? [];
  const dueReviewCount = data?.dueReviewCount ?? 0;
  const estimatedReviewMinutes = data?.estimatedReviewMinutes ?? null;
  const suggestedModule = data?.suggestedModule ?? null;

  useFocusEffect(
    useCallback(() => {
      setHasCompletedFocusCheck(true);
      if (isLoadingRef.current) return;
      const cached = getCachedLearnScreenData();
      const needLoad = !hasLoadedOnceRef.current || !cached;
      if (needLoad) {
        hasLoadedOnceRef.current = true;
        isLoadingRef.current = true;
        reload().finally(() => {
          isLoadingRef.current = false;
        });
      } else {
        // Refocus with existing cache: clear cache and reload so progress (e.g. completed modules) is up to date.
        clearLearnScreenCache();
        isLoadingRef.current = true;
        reload().finally(() => {
          isLoadingRef.current = false;
        });
      }
      return () => {
        setHasCompletedFocusCheck(false);
      };
    }, [reload]),
  );

  const showLoading = loading || (data != null && !hasCompletedFocusCheck);
  if (showLoading) {
    return <LoadingScreen title="Loading content" />;
  }

  return (
    <ScrollView
      testID="learn-screen-scroll"
      style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: insets.top,
          paddingBottom: 100 + insets.bottom,
          paddingLeft: CONTENT_PADDING_H + insets.left,
          paddingRight: CONTENT_PADDING_H + insets.right,
        },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <LearnHeader />
      {dueReviewCount > 0 ? (
        <>
          <ReviewSection
            dueCount={dueReviewCount}
            estimatedReviewMinutes={estimatedReviewMinutes}
            onStart={() => {
              const sessionId = makeSessionId('review');
              router.push({
                pathname: routeBuilders.sessionDetail(sessionId),
                params: { kind: 'review', returnTo: routes.tabs.learn },
              });
            }}
          />
          <View
            style={[
              styles.learningPathFullBleed,
              {
                width: Dimensions.get('window').width,
                marginLeft: -(CONTENT_PADDING_H + insets.left),
                marginRight: -(CONTENT_PADDING_H + insets.right),
              },
            ]}
          >
            <LearningPathCarousel
              items={learningPathItems}
              suggestedModuleId={suggestedModule?.module.id ?? null}
              onPressItem={(route: string) =>
                router.push({
                  pathname: route,
                  params: { returnTo: routes.tabs.learn },
                })
              }
            />
          </View>
        </>
      ) : (
        <>
          <View
            style={[
              styles.learningPathFullBleed,
              {
                width: Dimensions.get('window').width,
                marginLeft: -(CONTENT_PADDING_H + insets.left),
                marginRight: -(CONTENT_PADDING_H + insets.right),
              },
            ]}
          >
            <LearningPathCarousel
              items={learningPathItems}
              suggestedModuleId={suggestedModule?.module.id ?? null}
              onPressItem={(route: string) =>
                router.push({
                  pathname: route,
                  params: { returnTo: routes.tabs.learn },
                })
              }
            />
          </View>
          <ReviewSection
            dueCount={dueReviewCount}
            estimatedReviewMinutes={estimatedReviewMinutes}
            onStart={() => {
              const sessionId = makeSessionId('review');
              router.push({
                pathname: routeBuilders.sessionDetail(sessionId),
                params: { kind: 'review', returnTo: routes.tabs.learn },
              });
            }}
          />
        </>
      )}

      <View style={styles.allModulesSection}>
        <View style={styles.allModulesHeader}>
          <View style={styles.allModulesHeaderLeft}>
            <Text style={[styles.allModulesTitle, { color: theme.colors.text }]}>All Modules</Text>
            <View style={[styles.allModulesBadge, { backgroundColor: catalogBadgeBg }]}>
              <Text style={[styles.allModulesBadgeText, { color: catalogBadgeText }]}>Catalog</Text>
            </View>
          </View>
        </View>
        <Text style={[styles.allModulesSubtitle, { color: theme.colors.mutedText }]}>
          Explore every course and find your next lesson
        </Text>
        <Pressable
          testID="browse-catalog-button"
          accessibilityRole="button"
          accessibilityLabel="Browse all modules"
          onPress={() =>
            router.push({
              pathname: routes.course.list,
              params: { returnTo: routes.tabs.learn },
            })
          }
          style={({ pressed }) => [
            styles.allModulesCard,
            {
              opacity: pressed ? 0.95 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              shadowColor: isDark ? theme.colors.profileHeader : undefined,
            },
          ]}
        >
          <LinearGradient
            colors={catalogGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.allModulesGradient}
          >
            <View style={styles.allModulesCardContent}>
              <View
                style={[styles.allModulesIconWrap, { backgroundColor: theme.colors.ctaCardAccent }]}
              >
                <Ionicons name="library-outline" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.allModulesCardText}>
                <Text style={styles.allModulesCardTitle}>Browse full catalog</Text>
                <Text style={styles.allModulesCardSubtitle}>
                  All courses in one place — start any module
                </Text>
              </View>
              <View
                style={[
                  styles.allModulesArrowWrap,
                  { backgroundColor: theme.colors.ctaCardAccent },
                ]}
              >
                <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  learningPathFullBleed: {
    width: '100%',
  },
  allModulesSection: {
    marginTop: 24,
    gap: 14,
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
