import { useLocalSearchParams, router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { LoadingScreen } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { getModule, getModuleLessons, getLessonTeachings, type Module, type Lesson } from '@/services/api/modules';
import { getSuggestions } from '@/services/api/learn';
import { getRecentActivity, type RecentActivity } from '@/services/api/profile';
import { routeBuilders } from '@/services/navigation/routes';
import { theme } from '@/services/theme/tokens';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { makeSessionId } from '@/features/session/sessionBuilder';
import { preloadSessionPlan } from '@/services/api/session-plan-cache';
import { getUserLessons, type UserLessonProgress } from '@/services/api/progress';
import { buildLessonOutcome } from '@/features/learn/utils/lessonOutcome';
import { ScreenHeader } from '@/components/navigation';
import { MetaRow, TappableCard } from '@/components/ui';
import { ModuleCompleteBanner, OfflineNotice } from '@/components/course';
import { useAsyncData } from '@/hooks/useAsyncData';
import { createLogger } from '@/services/logging';
import React from 'react';

const Logger = createLogger('CourseDetailScreen');

const MODULE_COVER = {
  pillBg: '#EFF6FF',
  pillBorder: 'rgba(191, 219, 254, 0.3)',
  blue: '#3B82F6',
  blueLight: '#60A5FA',
  blueDark: '#2563EB',
  title: '#0F172A',
  muted: '#475569',
  mutedDesc: '#64748B',
  metaText: '#334155',
  metaBg: '#F8FAFC',
  metaBorder: 'rgba(226, 232, 240, 0.6)',
  progressBg: '#F1F5F9',
  progressBorder: 'rgba(226, 232, 240, 0.5)',
  cardBorder: 'rgba(226, 232, 240, 0.6)',
  tipGradientStart: '#EFF6FF',
  tipGradientEnd: '#E0E7FF',
  tipBorder: 'rgba(191, 219, 254, 0.5)',
  secondaryBorder: '#E2E8F0',
} as const;

type PrimaryAction =
  | {
      kind: 'continue';
      label: 'Continue lesson';
      lessonId: string;
      helperText?: string;
    }
  | {
      kind: 'start';
      label: 'Start lessons';
      lessonId: string;
      helperText?: string;
    };

export default function CourseDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { theme } = useAppTheme();
  const [lessonOutcomes, setLessonOutcomes] = useState<Record<string, string>>({});
  const [lessonsLoadError, setLessonsLoadError] = useState<string | null>(null);
  const outcomeRequestsRef = useRef(new Set<string>());
  const scrollViewRef = useRef<ScrollView>(null);
  const lessonsSectionRef = useRef<View>(null);
  const [lessonsSectionY, setLessonsSectionY] = useState(0);

  const { data, loading, error, reload } = useAsyncData<{
    module: Module;
    lessons: Lesson[];
    userProgress: UserLessonProgress[];
    recentActivity: RecentActivity | null;
    suggestedLessonId: string | null;
    suggestedLessonTitle: string | null;
  }>(
    'CourseDetailScreen',
    async () => {
      if (!slug) {
        throw new Error('Course slug is required');
      }

      const moduleData = await getModule(String(slug));
      
      let lessonsData: Lesson[] = [];
      let progressData: UserLessonProgress[] = [];
      let recent: RecentActivity | null = null;
      let suggestedLessonId: string | null = null;
      let suggestedLessonTitle: string | null = null;

      try {
        const [lessons, progress, activity, suggestions] = await Promise.all([
          getModuleLessons(moduleData.id),
          getUserLessons().catch(() => [] as UserLessonProgress[]),
          getRecentActivity().catch(() => null),
          getSuggestions({ moduleId: moduleData.id, limit: 1 }).catch(() => ({ lessons: [], modules: [] })),
        ]);
        lessonsData = lessons;
        progressData = progress;
        recent = activity;
        const first = suggestions?.lessons?.[0];
        suggestedLessonId = first?.lesson?.id ?? null;
        suggestedLessonTitle = first?.lesson?.title ?? null;
        
        const lessonsToPreload = lessonsData.slice(0, 5);
        lessonsToPreload.forEach((lesson, index) => {
          setTimeout(() => {
            preloadSessionPlan(lesson.id).catch(() => {});
          }, index * 100);
        });

        setLessonsLoadError(null);
      } catch (lessonErr) {
        setLessonsLoadError(lessonErr instanceof Error ? lessonErr.message : String(lessonErr));
        const [activity, suggestions] = await Promise.all([
          getRecentActivity().catch(() => null),
          getSuggestions({ moduleId: moduleData.id, limit: 1 }).catch(() => ({ lessons: [], modules: [] })),
        ]);
        recent = activity;
        const first = suggestions?.lessons?.[0];
        suggestedLessonId = first?.lesson?.id ?? null;
        suggestedLessonTitle = first?.lesson?.title ?? null;
      }

      return {
        module: moduleData,
        lessons: lessonsData,
        userProgress: progressData,
        recentActivity: recent,
        suggestedLessonId,
        suggestedLessonTitle,
      };
    },
    [slug]
  );

  const module = data?.module ?? null;
  const lessons = data?.lessons ?? [];
  const userProgress = data?.userProgress ?? [];
  const recentActivity = data?.recentActivity ?? null;
  const suggestedLessonId = data?.suggestedLessonId ?? null;
  const suggestedLessonTitle = data?.suggestedLessonTitle ?? null;

  const preloadLessonOutcomes = (lessonsData: Lesson[]) => {
    const missing = lessonsData
      .map((l) => l.id)
      .filter((id) => !lessonOutcomes[id] && !outcomeRequestsRef.current.has(id))
      .slice(0, 25);

    if (missing.length === 0) return;

    missing.forEach((id, index) => {
      outcomeRequestsRef.current.add(id);
      setTimeout(() => {
        getLessonTeachings(id)
          .then((teachings) => {
            const outcome = buildLessonOutcome(teachings);
            if (!outcome) return;
            setLessonOutcomes((prev) => ({ ...prev, [id]: outcome }));
          })
          .catch(() => {})
          .finally(() => {
            outcomeRequestsRef.current.delete(id);
          });
      }, index * 40);
    });
  };

  React.useEffect(() => {
    if (lessons.length > 0) {
      preloadLessonOutcomes(lessons);
    }
  }, [lessons]);

  const displayTitle = module?.title ?? '';
  const displayDescription = module?.description || 'A tailored course based on your onboarding preferences.';
  
  const totalItems = lessons.reduce((sum, lesson) => sum + (lesson.numberOfItems || 0), 0);

  const progressByLessonId = useMemo(() => {
    return new Map(userProgress.map((p) => [p.lesson.id, p]));
  }, [userProgress]);

  const moduleCompleted = useMemo(() => {
    if (lessons.length === 0) return false;
    return lessons.every((lesson) => {
      const p = progressByLessonId.get(lesson.id);
      const total = p?.totalTeachings ?? lesson.numberOfItems ?? 0;
      const completed = p?.completedTeachings ?? 0;
      return total > 0 && completed >= total;
    });
  }, [lessons, progressByLessonId]);

  const completedLessonsCount = useMemo(() => {
    return lessons.filter((lesson) => {
      const p = progressByLessonId.get(lesson.id);
      const total = p?.totalTeachings ?? lesson.numberOfItems ?? 0;
      const completed = p?.completedTeachings ?? 0;
      return total > 0 && completed >= total;
    }).length;
  }, [lessons, progressByLessonId]);

  const lessonsCompleteLabel =
    lessons.length > 0
      ? `${completedLessonsCount}/${lessons.length} ${lessons.length === 1 ? 'lesson' : 'lessons'} complete`
      : null;

  const completionExampleOutcome = useMemo(() => {
    // Prefer a strong “outcome” line if we already generated one.
    const first = lessons.find((l) => lessonOutcomes[l.id])?.id;
    return first ? lessonOutcomes[first] : null;
  }, [lessonOutcomes, lessons]);

  const primaryAction: PrimaryAction | null = useMemo(() => {
    const moduleId = module?.id;
    if (!moduleId) return null;

    // Prefer continuing any in-progress lesson in this module (even if recent activity is missing/stale).
    // This prevents “Recommended next” suggestions from pointing at a not-started lesson while the
    // user already has unfinished progress here.
    const inProgressInThisModule = userProgress
      .filter((p) => p.lesson?.module?.id === moduleId)
      .filter((p) => p.totalTeachings > 0 && p.completedTeachings > 0 && p.completedTeachings < p.totalTeachings)
      .sort((a, b) => {
        const ar = a.totalTeachings > 0 ? a.completedTeachings / a.totalTeachings : 0;
        const br = b.totalTeachings > 0 ? b.completedTeachings / b.totalTeachings : 0;
        return br - ar || b.completedTeachings - a.completedTeachings;
      })[0];

    if (inProgressInThisModule?.lesson?.id) {
      const lesson = lessons.find((l) => l.id === inProgressInThisModule.lesson.id);
      const lessonIndex = lesson ? lessons.indexOf(lesson) + 1 : 0;
      const estMin = lesson?.numberOfItems ? Math.ceil(lesson.numberOfItems * 1.5) : 5;
      return {
        kind: 'continue',
        label: 'Continue lesson',
        lessonId: inProgressInThisModule.lesson.id,
        helperText: `Lesson ${lessonIndex} of ${lessons.length} • ~${estMin} min`,
      };
    }

    const recentLesson = recentActivity?.recentLesson ?? null;
    const isRecentInThisModule = recentLesson?.lesson?.module?.id === moduleId;
    const hasPartialProgress =
      typeof recentLesson?.completedTeachings === 'number' &&
      typeof recentLesson?.totalTeachings === 'number' &&
      recentLesson.completedTeachings > 0 &&
      recentLesson.completedTeachings < recentLesson.totalTeachings;

    if (isRecentInThisModule && hasPartialProgress && recentLesson?.lesson?.id) {
      const lesson = lessons.find((l) => l.id === recentLesson.lesson.id);
      const lessonIndex = lesson ? lessons.indexOf(lesson) + 1 : 0;
      const estMin = lesson?.numberOfItems ? Math.ceil(lesson.numberOfItems * 1.5) : 5;
      return {
        kind: 'continue',
        label: 'Continue lesson',
        lessonId: recentLesson.lesson.id,
        helperText: `Lesson ${lessonIndex} of ${lessons.length} • ~${estMin} min`,
      };
    }

    const startLessonId = suggestedLessonId ?? lessons[0]?.id ?? null;
    if (!startLessonId) return null;
    const startLesson = lessons.find((l) => l.id === startLessonId);
    const lessonIndex = startLesson ? lessons.indexOf(startLesson) + 1 : 0;
    const estMin = startLesson?.numberOfItems ? Math.ceil(startLesson.numberOfItems * 1.5) : 5;
    const startTitle = suggestedLessonTitle ?? startLesson?.title ?? 'Start lessons';
    return {
      kind: 'start',
      label: `Start: ${startTitle}`,
      lessonId: startLessonId,
      helperText: `Lesson ${lessonIndex} of ${lessons.length} • ~${estMin} min`,
    };
  }, [lessons, module?.id, recentActivity, suggestedLessonId, suggestedLessonTitle, userProgress]);

  const recommendedLessonTitle = useMemo(() => {
    if (!suggestedLessonId) return null;
    return suggestedLessonTitle ?? lessons.find((l) => l.id === suggestedLessonId)?.title ?? null;
  }, [lessons, suggestedLessonId, suggestedLessonTitle]);

  const handlePrimaryActionPress = () => {
    if (!primaryAction) return;
    const sessionId = makeSessionId('learn');
    router.push({
      pathname: routeBuilders.sessionDetail(sessionId),
      params: { lessonId: primaryAction.lessonId, kind: 'learn' },
    });
  };

  const handlePrimaryActionPressIn = () => {
    if (!primaryAction) return;
    preloadSessionPlan(primaryAction.lessonId).catch((error) => {
      Logger.debug('Preload failed (non-critical)', { error });
    });
  };

  const handleRetry = () => {
    reload();
  };

  const handleViewAllLessons = () => {
    if (lessonsSectionY > 0) {
      scrollViewRef.current?.scrollTo({ y: lessonsSectionY - 24, animated: true });
    }
  };

  // IMPORTANT: Hooks must run before any early returns.
  if (loading) {
    return (
      <LoadingScreen
        title="Loading course details..."
        subtitle="Please wait while we load this course."
      />
    );
  }

  if (error || !module) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScreenHeader
          title="Course"
          subtitle="Unable to load course"
          icon="book-outline"
          label="Learning"
          showHome
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]} accessibilityRole="alert">
            {error || 'Course not found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const progressPercent = lessons.length > 0 ? Math.round((completedLessonsCount / lessons.length) * 100) : 0;
  const totalMin = Math.ceil(totalItems * 1.5);

  return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#FAFBFC' }]}>
      <View style={styles.navBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
        >
          <Ionicons name="chevron-back" size={28} color="#0F172A" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Menu"
          style={({ pressed }) => [styles.navButtonMenu, pressed && styles.navButtonPressed]}
        >
          <Ionicons name="menu" size={22} color="#334155" />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.modulePill}>
          <Ionicons name="book-outline" size={12} color={MODULE_COVER.blue} />
          <Text style={styles.modulePillText}>MODULE</Text>
        </View>

        <Text style={styles.moduleTitle} accessibilityRole="header">
          {displayTitle}
        </Text>

        {lessons.length > 0 && (
          <View style={styles.progressBlock}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>
                {completedLessonsCount} of {lessons.length} lessons complete
              </Text>
              <Text style={styles.progressPercent}>{progressPercent}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        )}

        <View style={[styles.summaryCard, { borderColor: MODULE_COVER.cardBorder }]}>
          <LinearGradient
            colors={[MODULE_COVER.blueLight, MODULE_COVER.blue, MODULE_COVER.blueDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryIcon}
          >
            <Ionicons name="book-outline" size={40} color="#FFFFFF" />
          </LinearGradient>
          {lessons.length > 0 && (
            <View style={styles.metaRow}>
              <View style={[styles.metaPill, { backgroundColor: MODULE_COVER.metaBg, borderColor: MODULE_COVER.metaBorder }]}>
                <Ionicons name="time-outline" size={14} color={MODULE_COVER.mutedDesc} />
                <Text style={styles.metaPillText}>~{totalMin} min</Text>
              </View>
              <View style={[styles.metaPill, { backgroundColor: MODULE_COVER.metaBg, borderColor: MODULE_COVER.metaBorder }]}>
                <Ionicons name="document-text-outline" size={14} color={MODULE_COVER.mutedDesc} />
                <Text style={styles.metaPillText}>{totalItems} {totalItems === 1 ? 'exercise' : 'exercises'}</Text>
              </View>
            </View>
          )}
          <Text style={styles.summaryDescription} numberOfLines={3}>
            {displayDescription}
          </Text>
        </View>

        {moduleCompleted && (
          <View style={styles.bannerRow}>
            <ModuleCompleteBanner moduleTitle={module.title} exampleOutcome={completionExampleOutcome} />
          </View>
        )}
        {lessons.length === 0 && lessonsLoadError ? (
          <View style={styles.bannerRow}>
            <OfflineNotice onRetry={handleRetry} />
          </View>
        ) : null}

        {primaryAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={primaryAction.label}
            onPress={handlePrimaryActionPress}
            onPressIn={handlePrimaryActionPressIn}
            style={({ pressed }) => [styles.primaryCtaWrap, pressed && { opacity: 0.95 }]}
          >
            <LinearGradient
              colors={[MODULE_COVER.blueLight, MODULE_COVER.blue, MODULE_COVER.blueDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryCtaGradient}
            >
              <View style={styles.primaryCtaContent}>
                <Text style={styles.primaryCtaLabel}>{primaryAction.label}</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </View>
              {primaryAction.helperText ? (
                <Text style={styles.primaryCtaSubtitle}>{primaryAction.helperText}</Text>
              ) : null}
            </LinearGradient>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View all lessons"
          onPress={handleViewAllLessons}
          style={({ pressed }) => [styles.secondaryCta, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.secondaryCtaText}>View all lessons</Text>
        </Pressable>

        <LinearGradient
          colors={[MODULE_COVER.tipGradientStart, MODULE_COVER.tipGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.tipCard, { borderColor: MODULE_COVER.tipBorder }]}
        >
          <LinearGradient
            colors={[MODULE_COVER.blueLight, MODULE_COVER.blue]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tipIconWrap}
          >
            <Ionicons name="bulb-outline" size={16} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipTitle}>Start small</Text>
            <Text style={styles.tipDescription}>Just 5 minutes builds momentum.</Text>
          </View>
        </LinearGradient>

        {lessons.length > 0 ? (
          <View
            ref={lessonsSectionRef}
            onLayout={(e) => setLessonsSectionY(e.nativeEvent.layout.y)}
            collapsable={false}
            style={styles.lessonsSection}
          >
          <Text style={styles.lessonsSectionTitle}>
            Lessons
          </Text>
          <View style={styles.lessonsList}>
            {lessons.map((lesson, index) => {
              const progress = progressByLessonId.get(lesson.id);
              const completed = progress?.completedTeachings ?? 0;
              const total = progress?.totalTeachings ?? (lesson.numberOfItems || 0);
              const preview = lessonOutcomes[lesson.id] ?? lesson.description ?? null;
              const statusLabel =
                total <= 0 || completed === 0
                  ? 'Not started'
                  : completed >= total
                    ? 'Completed'
                    : 'In progress';
              const progressLabel = total > 0 ? `${completed} of ${total}` : '0 of 0';
              const durationMin = lesson.numberOfItems ? Math.ceil(lesson.numberOfItems * 1.5) : 5;

              const handleLessonPress = () => {
                const sessionId = makeSessionId('learn');
                router.push({
                  pathname: routeBuilders.sessionDetail(sessionId),
                  params: { lessonId: lesson.id, kind: 'learn' },
                });
              };

              const handleLessonPressIn = () => {
                preloadSessionPlan(lesson.id).catch((error) => {
                  Logger.debug('Preload failed (non-critical)', { error });
                });
              };

              const metaRow = (
                <View style={styles.lessonMetaRow}>
                  <View style={styles.lessonStatusPill}>
                    <View style={styles.lessonStatusDot} />
                    <Text style={styles.lessonMetaText}>{statusLabel}</Text>
                  </View>
                  <MetaRow text={progressLabel} icon="document-text-outline" textColor={theme.colors.mutedText} />
                  <MetaRow text={`~${durationMin} min`} icon="time-outline" textColor={theme.colors.mutedText} />
                </View>
              );
              const leftIcon = (
                <LinearGradient
                  colors={[MODULE_COVER.blue, MODULE_COVER.blueDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.lessonNumberBadge}
                >
                  <Text style={styles.lessonNumberText}>{index + 1}</Text>
                </LinearGradient>
              );
              return (
                <TappableCard
                  key={lesson.id}
                  title={lesson.title}
                  subtitle={preview ?? undefined}
                  leftIcon={leftIcon}
                  metaRow={metaRow}
                  onPress={() => {
                    preloadSessionPlan(lesson.id).catch(() => {});
                    handleLessonPress();
                  }}
                  accessibilityLabel={`Open lesson ${lesson.title}`}
                  accessibilityHint="Starts a session for this lesson"
                  style={styles.lessonCardSpacing}
                />
              );
            })}
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: theme.colors.mutedText }]}>
            No lessons available yet
          </Text>
        </View>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bannerRow: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 96,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonMenu: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  navButtonPressed: {
    backgroundColor: '#F1F5F9',
  },
  modulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: MODULE_COVER.pillBg,
    borderWidth: 1,
    borderColor: MODULE_COVER.pillBorder,
    borderRadius: 999,
    marginBottom: 12,
  },
  modulePillText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: MODULE_COVER.blue,
  },
  moduleTitle: {
    fontFamily: theme.typography.bold,
    fontSize: 40,
    letterSpacing: -1,
    lineHeight: 42,
    color: MODULE_COVER.title,
    marginBottom: 12,
  },
  progressBlock: {
    marginBottom: 20,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontFamily: theme.typography.medium,
    fontSize: 14,
    color: MODULE_COVER.muted,
  },
  progressPercent: {
    fontFamily: theme.typography.bold,
    fontSize: 14,
    color: MODULE_COVER.blue,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: MODULE_COVER.progressBg,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: MODULE_COVER.progressBorder,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: MODULE_COVER.blue,
    borderRadius: 4,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  metaPillText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 13,
    color: MODULE_COVER.metaText,
  },
  summaryDescription: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    lineHeight: 22,
    color: MODULE_COVER.mutedDesc,
    textAlign: 'center',
    maxWidth: 280,
  },
  primaryCtaWrap: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: MODULE_COVER.blue,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryCtaGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  primaryCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryCtaLabel: {
    fontFamily: theme.typography.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  primaryCtaSubtitle: {
    fontFamily: theme.typography.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  secondaryCta: {
    width: '100%',
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: MODULE_COVER.secondaryBorder,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  secondaryCtaText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 15,
    color: MODULE_COVER.title,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
  },
  tipIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: MODULE_COVER.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  tipTextWrap: {
    flex: 1,
  },
  tipTitle: {
    fontFamily: theme.typography.bold,
    fontSize: 14,
    color: MODULE_COVER.title,
    marginBottom: 2,
  },
  tipDescription: {
    fontFamily: theme.typography.regular,
    fontSize: 13,
    color: MODULE_COVER.mutedDesc,
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  lessonsSectionTitle: {
    fontFamily: theme.typography.bold,
    fontSize: 24,
    color: MODULE_COVER.title,
    marginBottom: 16,
  },
  lessonsSection: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  lessonsList: {
    gap: 12,
  },
  lessonCardSpacing: {
    marginBottom: 12,
  },
  lessonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: MODULE_COVER.cardBorder,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  lessonCardPressed: {
    opacity: 0.96,
  },
  lessonCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  lessonNumberWrap: {
    flexShrink: 0,
  },
  lessonNumberBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonNumberText: {
    fontFamily: theme.typography.bold,
    fontSize: 28,
    color: '#FFFFFF',
  },
  lessonCardBody: {
    flex: 1,
    minWidth: 0,
  },
  lessonTitle: {
    fontFamily: theme.typography.bold,
    fontSize: 16,
    color: MODULE_COVER.title,
    marginBottom: 8,
  },
  lessonDescription: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: MODULE_COVER.mutedDesc,
    lineHeight: 20,
    marginBottom: 10,
  },
  lessonMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  lessonStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: MODULE_COVER.metaBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MODULE_COVER.metaBorder,
  },
  lessonStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  lessonMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lessonMetaText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 12,
    color: MODULE_COVER.mutedDesc,
  },
  lessonChevronWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: MODULE_COVER.metaBg,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
  },
  errorText: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    textAlign: 'center',
  },
});
