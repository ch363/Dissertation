import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { HelpButton } from '@/components/navigation/HelpButton';
import { ScrollView } from '@/components/ui';
import { HomePrimaryCtaCard, type HomePrimaryAction } from '@/features/home/components/HomePrimaryCtaCard';
import { HomeStreakCard } from '@/features/home/components/HomeStreakCard';
import { HomeTodayAtAGlance } from '@/features/home/components/HomeTodayAtAGlance';
import { HomeWhyThisNext } from '@/features/home/components/HomeWhyThisNext';
import { formatLessonDetail } from '@/features/home/utils/formatLessonDetail';
import { selectHomeNextAction, type HomeNextAction } from '@/features/home/utils/selectHomeNextAction';
import { getSuggestions } from '@/services/api/learn';
import { getDashboard, getMyProfile, getRecentActivity, getStats } from '@/services/api/profile';
import { routeBuilders, routes } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import { makeSessionId } from '@/features/session/sessionBuilder';
import { getLesson, getLessonTeachings } from '@/services/api/modules';
import { buildLessonOutcome } from '@/features/learn/utils/lessonOutcome';

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [streakDays, setStreakDays] = useState<number>(0);
  const [minutesToday, setMinutesToday] = useState<number>(0);
  const [dueReviewCount, setDueReviewCount] = useState<number>(0);
  const [nextAction, setNextAction] = useState<HomeNextAction | null>(null);
  const [nextLessonItemCount, setNextLessonItemCount] = useState<number | null>(null);
  const [whyThisText, setWhyThisText] = useState<string>('You’ll build confidence with practical phrases.');

  const loadData = useCallback(async () => {
    try {
      const [profile, dashboardData, statsData, recentActivity, suggestions] = await Promise.all([
        getMyProfile().catch(() => null),
        getDashboard().catch(() => ({ streak: 0, dueReviewCount: 0, activeLessonCount: 0, xpTotal: 0 })),
        getStats().catch(() => ({ minutesToday: 0 })),
        getRecentActivity().catch(() => null),
        getSuggestions({ limit: 1 }).catch(() => ({ lessons: [], modules: [] })),
      ]);

      const name = profile?.name?.trim();
      setDisplayName(name || null);
      setStreakDays(dashboardData.streak || 0);
      setMinutesToday(statsData.minutesToday || 0);
      setDueReviewCount(dashboardData.dueReviewCount || 0);
      setNextAction(
        selectHomeNextAction({
          dashboard: dashboardData,
          recentActivity,
          suggestions,
        }),
      );
    } catch (error) {
      console.error('Failed to load home data:', error);
      setNextAction({
        kind: 'startNext',
        statusMessage: 'You’re all caught up. Want to start something new?',
      });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  useEffect(() => {
    let cancelled = false;
    const lessonId =
      nextAction && nextAction.kind !== 'review' ? (nextAction.lessonId ?? null) : null;

    // Reset derived signals when we don't have a lesson.
    if (!lessonId) {
      setNextLessonItemCount(null);
      setWhyThisText((nextAction && 'reason' in nextAction ? nextAction.reason : undefined) ?? 'You’ll build confidence with practical phrases.');
      return;
    }

    (async () => {
      try {
        const [lesson, teachings] = await Promise.all([
          getLesson(lessonId).catch(() => null),
          // Best-effort: only used for passive copy.
          getLessonTeachings(lessonId).catch(() => []),
        ]);

        if (cancelled) return;

        setNextLessonItemCount(typeof lesson?.numberOfItems === 'number' ? lesson.numberOfItems : null);
        const outcome = teachings.length > 0 ? buildLessonOutcome(teachings) : null;
        const fallback = (nextAction && 'reason' in nextAction ? nextAction.reason : undefined) ?? 'You’ll build confidence with practical phrases.';
        setWhyThisText(outcome ?? fallback);
      } catch {
        if (cancelled) return;
        setNextLessonItemCount(null);
        setWhyThisText((nextAction && 'reason' in nextAction ? nextAction.reason : undefined) ?? 'You’ll build confidence with practical phrases.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nextAction]);

  const primaryAction: HomePrimaryAction = useMemo(() => {
    if (!nextAction) {
      return {
        kind: 'startNext',
        label: 'Start Next Lesson',
        subtitle: 'Loading your next step…',
      };
    }

    if (nextAction.kind === 'review') {
      const dueCount = nextAction.dueReviewCount;
      return {
        kind: 'review',
        label: 'Start Review',
        dueCount,
        subtitle: dueCount === 1 ? '1 card due for review today' : `${dueCount} cards due for review today`,
      };
    }

    if (nextAction.kind === 'continue') {
      return {
        kind: 'continue',
        label: 'Continue Lesson',
        subtitle: nextAction.moduleTitle ?? nextAction.lessonTitle,
        detailLine: formatLessonDetail(nextLessonItemCount),
      };
    }

    return {
      kind: 'startNext',
      label: 'Start Next Lesson',
      subtitle: nextAction.moduleTitle ?? nextAction.lessonTitle ?? 'Jump into something new',
      detailLine: formatLessonDetail(nextLessonItemCount),
    };
  }, [nextAction, nextLessonItemCount]);

  const handlePrimaryPress = () => {
    if (!nextAction) return;

    if (nextAction.kind === 'review') {
      router.push({ pathname: routes.tabs.review, params: { from: 'home' } });
      return;
    }

    if (nextAction.kind === 'continue') {
      const sessionId = makeSessionId('learn');
      router.push({
        pathname: routeBuilders.sessionDetail(sessionId),
        params: { lessonId: nextAction.lessonId, kind: 'learn' },
      });
      return;
    }

    if (nextAction.lessonId) {
      const sessionId = makeSessionId('learn');
      router.push({
        pathname: routeBuilders.sessionDetail(sessionId),
        params: { lessonId: nextAction.lessonId, kind: 'learn' },
      });
      return;
    }

    router.navigate(routes.tabs.learn);
  };

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.topBackdrop,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
        pointerEvents="none"
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            backgroundColor: 'transparent',
            paddingBottom: insets.bottom + baseTheme.spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.sectionTop}>
            <Text
              style={[styles.headerOverline, { color: theme.colors.mutedText }]}
              numberOfLines={1}
            >
              Dashboard
            </Text>
            <Text style={[styles.greetingTitle, { color: theme.colors.text }]} numberOfLines={2}>
              {displayName ? `Welcome back, ${displayName}` : 'Welcome back'}
            </Text>
            <Text style={[styles.greetingSubtitle, { color: theme.colors.mutedText }]}>
              Continue your learning journey
            </Text>
          </View>
          <View style={styles.helpButtonWrap}>
            <HelpButton variant="elevated" />
          </View>
        </View>

        {streakDays > 0 ? (
          <View style={styles.sectionTight}>
            <HomeStreakCard streakDays={streakDays} />
          </View>
        ) : null}

        <View style={styles.sectionMainCta}>
          <HomePrimaryCtaCard action={primaryAction} onPress={handlePrimaryPress} />
        </View>

        <View style={styles.sectionTight}>
          <HomeTodayAtAGlance dueReviewCount={dueReviewCount} minutesToday={minutesToday} />
        </View>

        <View style={styles.sectionSecondary}>
          <HomeWhyThisNext text={whyThisText} />
        </View>

        <View style={[styles.footerDivider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.footerPrompt}>
          <Text style={[styles.footerPromptText, { color: theme.colors.mutedText }]}>Want to explore more?</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Browse learning paths"
            onPress={() => router.navigate(routes.tabs.learn)}
            hitSlop={8}
            style={styles.footerLinkRow}
          >
            <Text style={[styles.footerLinkText, { color: theme.colors.primary }]}>Browse learning paths</Text>
            <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} accessible={false} importantForAccessibility="no" />
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
  topBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderBottomWidth: 1,
    shadowColor: '#0D1B2A',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 36,
    gap: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sectionTop: {
    flex: 1,
    marginTop: 0,
    paddingBottom: 0,
    gap: 6,
  },
  headerOverline: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  greetingTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 24,
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  greetingSubtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    letterSpacing: 0.2,
    lineHeight: 20,
  },
  helpButtonWrap: {
    marginLeft: 8,
    marginTop: 2,
  },
  sectionTight: {
    marginTop: 0,
    marginBottom: 20,
  },
  sectionSecondary: {
    marginTop: 0,
    marginBottom: 20,
  },
  sectionMainCta: {
    marginTop: 0,
    marginBottom: 28,
  },
  footerPrompt: {
    marginTop: 20,
    paddingHorizontal: 0,
    gap: baseTheme.spacing.xs,
  },
  footerDivider: {
    marginTop: 0,
    marginBottom: 20,
    height: 1,
    opacity: 0.5,
  },
  footerPromptText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
  },
  footerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  footerLinkText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
});
