import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HelpButton } from '@/components/navigation';
import {
  HomePrimaryCtaCard,
  type HomePrimaryAction,
} from '@/features/home/components/primary-cta/HomePrimaryCtaCard';
import { HomeStreakCard } from '@/features/home/components/streak/HomeStreakCard';
import { HomeTodayAtAGlance } from '@/features/home/components/today-at-a-glance/HomeTodayAtAGlance';
import { HomeWhyThisNext } from '@/features/home/components/why-this-next/HomeWhyThisNext';
import { buildPrimaryAction } from '@/features/home/utils/buildPrimaryAction';
import { formatLessonDetail } from '@/features/home/utils/formatLessonDetail';
import {
  selectHomeNextAction,
  type HomeNextAction,
} from '@/features/home/utils/selectHomeNextAction';
import { SKILL_CONFIG } from '@/features/profile/profileConstants';
import { buildLessonOutcome } from '@/features/learn/utils/lessonOutcome';
import { makeSessionId } from '@/features/session/sessionBuilder';
import { getSuggestions } from '@/services/api/learn';
import { getAllMastery } from '@/services/api/mastery';
import { getLesson, getLessonTeachings } from '@/services/api/modules';
import { getDashboard, getMyProfile, getRecentActivity, getStats } from '@/services/api/profile';
import { routeBuilders, routes } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import { createLogger } from '@/services/logging';

const logger = createLogger('HomeScreen');

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [streakDays, setStreakDays] = useState<number>(0);
  const [minutesToday, setMinutesToday] = useState<number>(0);
  const [completedItemsToday, setCompletedItemsToday] = useState<number>(0);
  const [accuracyToday, setAccuracyToday] = useState<number | null>(null);
  const [dueReviewCount, setDueReviewCount] = useState<number>(0);
  const [xpTotal, setXpTotal] = useState<number>(0);
  const [mastery, setMastery] = useState<Array<{ skillTag: string; masteryProbability: number }>>([]);
  const [estimatedReviewMinutes, setEstimatedReviewMinutes] = useState<number | null>(null);
  const [nextAction, setNextAction] = useState<HomeNextAction | null>(null);
  const [nextLessonItemCount, setNextLessonItemCount] = useState<number | null>(null);
  const [whyThisText, setWhyThisText] = useState<string>('You’ll build confidence with practical phrases.');
  /** Heuristic topic from last activity (module/lesson title) for Focus when next action is review. */
  const [lastActivityTopic, setLastActivityTopic] = useState<string | null>(null);
  /** First suggested lesson (from learn API), used for Focus when primary action is review. */
  const [suggestedLesson, setSuggestedLesson] = useState<{
    lessonId: string;
    lessonTitle: string;
    moduleTitle: string;
  } | null>(null);
  const [inProgressLesson, setInProgressLesson] = useState<{
    lessonId: string;
    lessonTitle: string;
    moduleTitle: string;
    completedTeachings: number;
    totalTeachings: number;
    estTime: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [profile, dashboardData, statsData, recentActivity, suggestions, masteryData] = await Promise.all([
        getMyProfile().catch(() => null),
        getDashboard().catch(() => ({
          streak: 0,
          dueReviewCount: 0,
          activeLessonCount: 0,
          xpTotal: 0,
          weeklyXP: 0,
          weeklyXPChange: 0,
          accuracyPercentage: 0,
          accuracyByDeliveryMethod: {},
          grammaticalAccuracyByDeliveryMethod: {},
          studyTimeMinutes: 0,
        })),
        getStats().catch(() => ({ minutesToday: 0, completedItemsToday: 0 })),
        getRecentActivity().catch(() => null),
        getSuggestions({ limit: 1 }).catch(() => ({ lessons: [], modules: [] })),
        getAllMastery().catch(() => []),
      ]);

      const rawName = profile?.name;
      const name =
        rawName != null && typeof rawName === 'string' ? rawName.trim() : null;
      setDisplayName(name || null);
      setStreakDays(dashboardData.streak || 0);
      setMinutesToday(statsData.minutesToday || 0);
      setCompletedItemsToday(statsData.completedItemsToday ?? 0);
      setAccuracyToday(
        'accuracyToday' in statsData && typeof statsData.accuracyToday === 'number'
          ? statsData.accuracyToday
          : null,
      );
      setDueReviewCount(dashboardData.dueReviewCount || 0);
      setXpTotal(dashboardData.xpTotal ?? 0);
      setMastery(
        Array.isArray(masteryData)
          ? masteryData.map((m) => ({ skillTag: m.skillTag, masteryProbability: m.masteryProbability }))
          : [],
      );
      setEstimatedReviewMinutes(
        'estimatedReviewMinutes' in dashboardData &&
        typeof dashboardData.estimatedReviewMinutes === 'number' &&
        dashboardData.estimatedReviewMinutes > 0
          ? dashboardData.estimatedReviewMinutes
          : null,
      );
      setNextAction(
        selectHomeNextAction({
          dashboard: dashboardData,
          recentActivity,
          suggestions,
        }),
      );
      const firstSuggestion = suggestions?.lessons?.[0];
      if (firstSuggestion?.lesson?.id && firstSuggestion?.module?.title) {
        setSuggestedLesson({
          lessonId: firstSuggestion.lesson.id,
          lessonTitle: firstSuggestion.lesson.title?.trim() ?? 'Next lesson',
          moduleTitle: firstSuggestion.module.title.trim(),
        });
      } else {
        setSuggestedLesson(null);
      }
      const recentLessonPayload = recentActivity?.recentLesson;
      const recentLesson = recentLessonPayload?.lesson;
      setLastActivityTopic(
        recentLesson?.module?.title?.trim() ?? recentLesson?.title?.trim() ?? null,
      );
      if (
        recentLessonPayload?.lesson?.id &&
        typeof recentLessonPayload.completedTeachings === 'number' &&
        typeof recentLessonPayload.totalTeachings === 'number' &&
        recentLessonPayload.completedTeachings < recentLessonPayload.totalTeachings
      ) {
        const total = recentLessonPayload.totalTeachings;
        const completed = recentLessonPayload.completedTeachings;
        const remaining = Math.max(0, total - completed);
        const minutesAway = Math.max(1, Math.ceil(remaining * 2));
        setInProgressLesson({
          lessonId: recentLessonPayload.lesson.id,
          lessonTitle: recentLessonPayload.lesson.title,
          moduleTitle: recentLessonPayload.lesson.module?.title ?? '',
          completedTeachings: completed,
          totalTeachings: total,
          estTime: `${minutesAway} min`,
        });
      } else {
        setInProgressLesson(null);
      }
    } catch (error) {
      logger.error('Failed to load home data', error);
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

    if (!lessonId) {
      setNextLessonItemCount(null);
      setWhyThisText((nextAction && 'reason' in nextAction ? nextAction.reason : undefined) ?? 'You’ll build confidence with practical phrases.');
      return;
    }

    (async () => {
      try {
        const [lesson, teachings] = await Promise.all([
          getLesson(lessonId).catch(() => null),
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

  const primaryAction: HomePrimaryAction = useMemo(
    () =>
      buildPrimaryAction(
        nextAction,
        dueReviewCount,
        nextLessonItemCount,
        estimatedReviewMinutes,
      ),
    [nextAction, nextLessonItemCount, dueReviewCount, estimatedReviewMinutes],
  );

  const learnAction: HomePrimaryAction | undefined = useMemo(() => {
    if (!nextAction || nextAction.kind === 'review') return undefined;

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
      label: 'Start Learning',
      subtitle: nextAction.moduleTitle ?? nextAction.lessonTitle ?? 'Explore new content',
      detailLine: formatLessonDetail(nextLessonItemCount),
    };
  }, [nextAction, nextLessonItemCount]);

  const focusTopic = useMemo(() => {
    const prefix = 'Focus: ';
    if (inProgressLesson?.moduleTitle?.trim()) {
      return `${prefix}${inProgressLesson.moduleTitle.trim()}`;
    }
    if (nextAction?.kind === 'review') {
      if (mastery.length > 0) {
        const weakest = [...mastery].sort((a, b) => a.masteryProbability - b.masteryProbability)[0];
        const skillName = SKILL_CONFIG[weakest.skillTag]?.name ?? weakest.skillTag;
        return `${prefix}Weakest skill today: ${skillName}`;
      }
      if (suggestedLesson?.moduleTitle) return `${prefix}${suggestedLesson.moduleTitle}`;
      if (lastActivityTopic) return `${prefix}${lastActivityTopic}`;
      return `${prefix}Due reviews`;
    }
    const moduleTitle = nextAction && 'moduleTitle' in nextAction ? nextAction.moduleTitle : null;
    const lessonTitle = nextAction && 'lessonTitle' in nextAction ? nextAction.lessonTitle : null;
    const concrete = moduleTitle ?? lessonTitle ?? null;
    if (concrete && concrete.trim() !== '') return `${prefix}${concrete}`;
    if (xpTotal < 50) return `${prefix}Getting started`;
    if (xpTotal < 200) return `${prefix}Basics`;
    return `${prefix}Building phrases`;
  }, [inProgressLesson, nextAction, xpTotal, mastery, lastActivityTopic, suggestedLesson]);

  const focusWhy = useMemo(() => {
    if (nextAction?.kind === 'review' && mastery.length > 0) {
      return 'Your lowest mastery right now';
    }
    if (mastery.length > 0) {
      const weakest = [...mastery].sort((a, b) => a.masteryProbability - b.masteryProbability)[0];
      const skillName = SKILL_CONFIG[weakest.skillTag]?.name ?? weakest.skillTag;
      return `Because you struggle most with ${skillName}`;
    }
    if (whyThisText && whyThisText.trim() !== '' && !/build confidence|practical phrases/i.test(whyThisText)) {
      return whyThisText;
    }
    return undefined;
  }, [nextAction, mastery, whyThisText]);

  const focusSecondary = useMemo(() => {
    if (!nextAction) return undefined;
    if (nextAction.kind === 'review') {
      if (suggestedLesson?.lessonTitle) return `Next lesson: ${suggestedLesson.lessonTitle}`;
      const topicPart = focusTopic.replace(/^Focus:\s*/i, '').trim().toLowerCase();
      const last = lastActivityTopic?.trim().toLowerCase();
      if (!last || topicPart === last) return undefined;
      return `From: ${lastActivityTopic!.trim()}`;
    }
    if (nextAction.kind === 'continue' && 'progressLabel' in nextAction && nextAction.progressLabel?.trim()) {
      return nextAction.progressLabel.trim();
    }
    const lessonTitle = 'lessonTitle' in nextAction ? nextAction.lessonTitle : null;
    const moduleTitle = 'moduleTitle' in nextAction ? nextAction.moduleTitle : null;
    if (lessonTitle?.trim()) return `Next: ${lessonTitle.trim()}`;
    if (moduleTitle?.trim()) return `In ${moduleTitle.trim()}`;
    return undefined;
  }, [nextAction, lastActivityTopic, focusTopic, suggestedLesson]);

  const focusPrimaryLine = useMemo(() => {
    if (inProgressLesson) {
      const title = inProgressLesson.lessonTitle?.trim();
      const time = inProgressLesson.estTime?.trim();
      if (!title) return undefined;
      return time ? `${title} (${time})` : title;
    }
    if (nextAction?.kind === 'continue') {
      const title = nextAction.lessonTitle?.trim();
      const time = nextAction.estTime?.trim();
      if (!title) return undefined;
      return time ? `${title} (${time})` : title;
    }
    if (nextAction?.kind === 'startNext' && nextAction.lessonTitle?.trim()) {
      const title = nextAction.lessonTitle.trim();
      return title;
    }
    return undefined;
  }, [inProgressLesson, nextAction]);

  const focusSupportLine = useMemo(() => {
    return undefined;
  }, [inProgressLesson, nextAction]);

  const focusProgressLine = useMemo(() => {
    const total = inProgressLesson?.totalTeachings ?? (nextAction?.kind === 'continue' ? nextAction.totalTeachings : undefined);
    const completed = inProgressLesson?.completedTeachings ?? (nextAction?.kind === 'continue' ? nextAction.completedTeachings : undefined);
    if (typeof total !== 'number' || total < 1) return undefined;
    const done = typeof completed === 'number' ? completed : 0;
    const remaining = Math.max(0, total - done);
    const percent = Math.round((done / total) * 100);
    
    if (remaining === 0) {
      return `${total} ${total === 1 ? 'lesson' : 'lessons'} • 100% complete`;
    }
    return `${remaining} ${remaining === 1 ? 'lesson' : 'lessons'} left • ${percent}% complete`;
  }, [inProgressLesson, nextAction]);

  const focusProgressPercent = useMemo(() => {
    if (inProgressLesson && inProgressLesson.totalTeachings > 0) {
      return inProgressLesson.completedTeachings / inProgressLesson.totalTeachings;
    }
    if (nextAction?.kind !== 'continue' || typeof nextAction.totalTeachings !== 'number' || nextAction.totalTeachings <= 0) {
      return undefined;
    }
    return nextAction.completedTeachings / nextAction.totalTeachings;
  }, [inProgressLesson, nextAction]);

  const focusLessonId = useMemo(() => {
    if (inProgressLesson?.lessonId) return inProgressLesson.lessonId;
    if (nextAction?.kind === 'continue' && nextAction.lessonId) return nextAction.lessonId;
    if (nextAction?.kind === 'startNext' && nextAction.lessonId) return nextAction.lessonId;
    if (nextAction?.kind === 'review' && suggestedLesson?.lessonId) return suggestedLesson.lessonId;
    return null;
  }, [inProgressLesson, nextAction, suggestedLesson]);

  const handleFocusPress = useCallback(() => {
    if (!focusLessonId) return;
    const sessionId = makeSessionId('learn');
    router.push({
      pathname: routeBuilders.sessionDetail(sessionId),
      params: { lessonId: focusLessonId, kind: 'learn' },
    });
  }, [focusLessonId]);

  const focusWhyAffordance = useMemo(() => {
    if (focusWhy && focusWhy.trim().length > 0 && focusWhy.length < 80) return focusWhy.trim();
    if (inProgressLesson || nextAction?.kind === 'continue' || (nextAction?.kind === 'startNext' && nextAction.lessonId)) {
      return 'Based on your learning path.';
    }
    if (nextAction?.kind === 'review' && suggestedLesson) return 'After you review.';
    return undefined;
  }, [focusWhy, inProgressLesson, nextAction, suggestedLesson]);

  const handlePrimaryPress = (mode: 'review' | 'learn') => {
    if (!nextAction) return;

    if (mode === 'review') {
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

    if (nextAction.kind === 'startNext' && nextAction.lessonId) {
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
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom + baseTheme.spacing.md,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
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
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.sectionTop}>
            <Text
              style={[styles.greetingTitle, { color: theme.colors.text }]}
              numberOfLines={2}
              ellipsizeMode="tail"
              maxFontSizeMultiplier={1.3}
            >
              {displayName ? `Welcome back, ${displayName}` : 'Welcome back'}
            </Text>
            <Text
              style={[styles.greetingSubtitle, { color: theme.colors.mutedText }]}
              numberOfLines={2}
              ellipsizeMode="tail"
              maxFontSizeMultiplier={1.3}
            >
              Continue your learning journey
            </Text>
          </View>
          <View style={styles.helpButtonWrap}>
            <HelpButton
            variant="elevated"
            accessibilityLabel="Help, home screen tips"
            accessibilityHint="Opens help information"
          />
          </View>
        </View>

        {streakDays > 0 ? (
          <View style={styles.sectionTight}>
            <HomeStreakCard streakDays={streakDays} />
          </View>
        ) : null}

        <View style={styles.sectionMainCta}>
          <HomePrimaryCtaCard
            action={primaryAction}
            learnAction={learnAction}
            onPress={handlePrimaryPress}
          />
        </View>

        <View style={styles.sectionTight}>
          <HomeTodayAtAGlance
            minutesToday={minutesToday}
            completedItemsToday={completedItemsToday}
            accuracyToday={accuracyToday}
            onSuggestLearn={() => router.navigate(routes.tabs.learn)}
          />
        </View>

        <View style={styles.sectionSecondary}>
          <HomeWhyThisNext
            topic={focusTopic}
            why={focusWhy}
            secondaryLine={focusSecondary}
            primaryLine={focusPrimaryLine}
            supportLine={focusSupportLine}
            progressLine={focusProgressLine}
            progressPercent={focusProgressPercent}
            onPress={focusLessonId ? handleFocusPress : undefined}
            lessonId={focusLessonId ?? undefined}
            whyAffordance={focusWhyAffordance}
          />
        </View>

        {streakDays === 0 && minutesToday === 0 && completedItemsToday === 0 ? (
          <View style={styles.emptyStateHint}>
            <Text
              style={[styles.emptyStateText, { color: theme.colors.mutedText }]}
              numberOfLines={2}
              maxFontSizeMultiplier={1.2}
            >
              This page will fill up as you start making progress
            </Text>
          </View>
        ) : null}

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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    gap: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTop: {
    flex: 1,
    marginTop: 0,
    paddingBottom: 0,
    gap: 6,
  },
  greetingTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 23,
    letterSpacing: -0.3,
    lineHeight: 29,
  },
  greetingSubtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    letterSpacing: 0.2,
    lineHeight: 19,
  },
  helpButtonWrap: {
    marginLeft: 8,
    marginTop: 2,
  },
  sectionTight: {
    marginTop: 0,
    marginBottom: 8,
  },
  sectionSecondary: {
    marginTop: 0,
    marginBottom: 8,
  },
  sectionMainCta: {
    marginTop: 0,
    marginBottom: 12,
  },
  emptyStateHint: {
    marginTop: 24,
    paddingTop: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
    letterSpacing: 0.1,
    lineHeight: 18,
    textAlign: 'center',
    opacity: 0.6,
  },
});
