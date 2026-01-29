import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { LoadingScreen } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { getModule, getModuleLessons, getLessonTeachings, type Module, type Lesson } from '@/services/api/modules';
import { getSuggestions } from '@/services/api/learn';
import { getRecentActivity, type RecentActivity } from '@/services/api/profile';
import { routeBuilders, routes } from '@/services/navigation/routes';
import { theme } from '@/services/theme/tokens';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { makeSessionId } from '@/features/session/sessionBuilder';
import { preloadSessionPlan } from '@/services/api/session-plan-cache';
import { getUserLessons, type UserLessonProgress } from '@/services/api/progress';
import { LessonMicroProgress } from '@/components/learn/LessonMicroProgress';
import { buildLessonOutcome } from '@/features/learn/utils/lessonOutcome';
import { ScreenHeader } from '@/components/navigation';
import { FirstLessonNudge, ModuleCompleteBanner, OfflineNotice } from '@/components/course';

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
  const { theme: appTheme } = useAppTheme();
  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [userProgress, setUserProgress] = useState<UserLessonProgress[]>([]);
  const [lessonOutcomes, setLessonOutcomes] = useState<Record<string, string>>({});
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null);
  const [suggestedLessonId, setSuggestedLessonId] = useState<string | null>(null);
  const [suggestedLessonTitle, setSuggestedLessonTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonsLoadError, setLessonsLoadError] = useState<string | null>(null);

  const outcomeRequestsRef = useRef(new Set<string>());

  const preloadLessonOutcomes = (lessonsData: Lesson[]) => {
    const missing = lessonsData
      .map((l) => l.id)
      .filter((id) => !lessonOutcomes[id] && !outcomeRequestsRef.current.has(id))
      .slice(0, 25);

    if (missing.length === 0) return;

    missing.forEach((id, index) => {
      outcomeRequestsRef.current.add(id);
      // Stagger slightly to avoid overwhelming the network.
      setTimeout(() => {
        getLessonTeachings(id)
          .then((teachings) => {
            const outcome = buildLessonOutcome(teachings);
            if (!outcome) return;
            setLessonOutcomes((prev) => ({ ...prev, [id]: outcome }));
          })
          .catch(() => {
            // best-effort
          })
          .finally(() => {
            outcomeRequestsRef.current.delete(id);
          });
      }, index * 40);
    });
  };

  useEffect(() => {
    const loadModule = async () => {
      if (!slug) {
        setError('Course slug is required');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setLessonsLoadError(null);
      try {
        // Treat the route param as a module identifier. Backend supports either:
        // - UUID module ID (preferred)
        // - module title (case-insensitive)
        const moduleData = await getModule(String(slug));
        setModule(moduleData);
        
        // Fetch all lessons for this module
        try {
          const [lessonsData, progressData, recent, suggestions] = await Promise.all([
            getModuleLessons(moduleData.id),
            getUserLessons().catch(() => [] as UserLessonProgress[]),
            getRecentActivity().catch(() => null),
            getSuggestions({ moduleId: moduleData.id, limit: 1 }).catch(() => ({ lessons: [], modules: [] })),
          ]);
          console.log('Loaded lessons:', lessonsData.length, lessonsData);
          setLessons(lessonsData);
          setUserProgress(progressData);
          setRecentActivity(recent);
          const first = suggestions?.lessons?.[0];
          setSuggestedLessonId(first?.lesson?.id ?? null);
          setSuggestedLessonTitle(first?.lesson?.title ?? null);
          
          // Preload session plans for a limited set of lessons to avoid timeouts
          // (backend can be slow under many concurrent session-plan requests)
          const lessonsToPreload = lessonsData.slice(0, 5);
          lessonsToPreload.forEach((lesson, index) => {
            setTimeout(() => {
              preloadSessionPlan(lesson.id).catch(() => {
                // Best-effort; failure already logged in session-plan-cache
              });
            }, index * 100);
          });

          // Best-effort: fetch lesson teachings to generate a motivating outcome line.
          preloadLessonOutcomes(lessonsData);
        } catch (lessonErr) {
          console.error('Failed to load lessons:', lessonErr);
          setLessonsLoadError(lessonErr instanceof Error ? lessonErr.message : String(lessonErr));
          // Still try to populate recent activity / suggestions so CTA can work.
          void Promise.all([
            getRecentActivity().catch(() => null),
            getSuggestions({ moduleId: moduleData.id, limit: 1 }).catch(() => ({ lessons: [], modules: [] })),
          ]).then(([recent, suggestions]) => {
            setRecentActivity(recent);
            const first = suggestions?.lessons?.[0];
            setSuggestedLessonId(first?.lesson?.id ?? null);
            setSuggestedLessonTitle(first?.lesson?.title ?? null);
          });
          // Continue without lesson data
        }
      } catch (err: any) {
        console.error('Failed to load module:', err);
        setError(err?.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    loadModule();
  }, [slug]);

  // Use module title and description for the header
  const displayTitle = module?.title ?? '';
  const displayDescription = module?.description || 'A tailored course based on your onboarding preferences.';
  
  // Calculate total items across all lessons
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

  const isFirstEverLesson = useMemo(() => {
    // “First-ever lesson” = no progress recorded at all, or everything is at 0.
    if (userProgress.length === 0) return true;
    return userProgress.every((p) => (p.completedTeachings ?? 0) === 0);
  }, [userProgress]);

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
      return {
        kind: 'continue',
        label: 'Continue lesson',
        lessonId: inProgressInThisModule.lesson.id,
        helperText: `${inProgressInThisModule.completedTeachings}/${inProgressInThisModule.totalTeachings} complete`,
      };
    }

    // Continue (module-only) if user's recent lesson is in this module and has partial progress (not 0, not complete)
    const recentLesson = recentActivity?.recentLesson ?? null;
    const isRecentInThisModule = recentLesson?.lesson?.module?.id === moduleId;
    const hasPartialProgress =
      typeof recentLesson?.completedTeachings === 'number' &&
      typeof recentLesson?.totalTeachings === 'number' &&
      recentLesson.completedTeachings > 0 &&
      recentLesson.completedTeachings < recentLesson.totalTeachings;

    if (isRecentInThisModule && hasPartialProgress && recentLesson?.lesson?.id) {
      const helperText =
        typeof recentLesson.completedTeachings === 'number' && typeof recentLesson.totalTeachings === 'number'
          ? `${recentLesson.completedTeachings}/${recentLesson.totalTeachings} complete`
          : undefined;
      return {
        kind: 'continue',
        label: 'Continue lesson',
        lessonId: recentLesson.lesson.id,
        helperText,
      };
    }

    // Start recommended lesson (module-scoped suggestions), else fallback to first lesson in list
    const startLessonId = suggestedLessonId ?? lessons[0]?.id ?? null;
    if (!startLessonId) return null;
    return { kind: 'start', label: 'Start lessons', lessonId: startLessonId };
  }, [lessons, module?.id, recentActivity, suggestedLessonId, userProgress]);

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
      console.debug('Preload failed (non-critical):', error);
    });
  };

  const handleRetry = () => {
    // Trigger a full reload by re-running the effect.
    // (Expo Router screens re-run effect on param changes; we keep it simple by just calling the API path again.)
    setLoading(true);
    setError(null);
    setLessonsLoadError(null);
    // Reuse the module slug; the effect will re-run because `slug` is stable, so call the internal loader again via navigation refresh.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      try {
        const moduleData = await getModule(String(slug));
        setModule(moduleData);
        const [lessonsData, progressData] = await Promise.all([
          getModuleLessons(moduleData.id),
          getUserLessons().catch(() => [] as UserLessonProgress[]),
        ]);
        setLessons(lessonsData);
        setUserProgress(progressData);
        preloadLessonOutcomes(lessonsData);
      } catch (e: any) {
        setError(e?.message || 'Failed to reload course');
      } finally {
        setLoading(false);
      }
    })();
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
      <SafeAreaView style={[styles.container, { backgroundColor: appTheme.colors.background }]}>
        <ScreenHeader
          title="Course"
          subtitle="Unable to load course"
          icon="book-outline"
          label="Learning"
          showHome
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: appTheme.colors.error }]} accessibilityRole="alert">
            {error || 'Course not found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appTheme.colors.background }]}>
      <ScreenHeader
        title={module.title}
        subtitle={`${lessonsCompleteLabel || 'Start your learning journey'}`}
        icon="book-outline"
        label="Modules"
        showHome
      />
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      {/* Module overview – icon, title, info pills */}
      <View style={styles.headerSection}>
        <View style={[styles.iconContainer, { backgroundColor: appTheme.colors.primary }]}>
          <Ionicons name="book-outline" size={48} color="#FFFFFF" accessible={false} importantForAccessibility="no" />
        </View>
        <Text style={[styles.title, { color: appTheme.colors.text }]} accessibilityRole="header">
          {displayTitle}
        </Text>
        {lessons.length > 0 && (
          <View style={styles.infoPillsRow}>
            <View style={[styles.infoPill, { backgroundColor: appTheme.colors.card, borderColor: appTheme.colors.border }]}>
              <Ionicons name="time-outline" size={18} color={appTheme.colors.text} accessible={false} importantForAccessibility="no" />
              <Text style={[styles.infoPillText, { color: appTheme.colors.text }]}>
                ~{Math.ceil(totalItems * 1.5)} min
              </Text>
            </View>
            <View style={[styles.infoPill, { backgroundColor: appTheme.colors.card, borderColor: appTheme.colors.border }]}>
              <Ionicons name="book-outline" size={18} color={appTheme.colors.text} accessible={false} importantForAccessibility="no" />
              <Text style={[styles.infoPillText, { color: appTheme.colors.text }]}>
                {totalItems} {totalItems === 1 ? 'exercise' : 'exercises'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Module description */}
      {displayDescription ? (
        <Text style={[styles.subtitle, { color: appTheme.colors.mutedText }]}>
          {displayDescription}
        </Text>
      ) : null}

      {/* Future-proof empty states */}
      {moduleCompleted ? (
        <View style={styles.bannerRow}>
          <ModuleCompleteBanner moduleTitle={module.title} exampleOutcome={completionExampleOutcome} />
        </View>
      ) : lessons.length === 0 && lessonsLoadError ? (
        <View style={styles.bannerRow}>
          <OfflineNotice onRetry={handleRetry} />
        </View>
      ) : isFirstEverLesson && primaryAction?.kind === 'start' ? (
        <View style={styles.bannerRow}>
          <FirstLessonNudge onStart={handlePrimaryActionPress} />
        </View>
      ) : null}

      {/* Primary Action CTA (reduce choice friction) */}
      {primaryAction ? (
        <View style={styles.primaryActionSection}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={primaryAction.label}
            onPress={handlePrimaryActionPress}
            onPressIn={handlePrimaryActionPressIn}
            hitSlop={6}
            style={({ pressed }) => [
              styles.primaryCta,
              { backgroundColor: appTheme.colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Text style={[styles.primaryCtaText, { color: appTheme.colors.onPrimary }]}>
              {primaryAction.label}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={appTheme.colors.onPrimary}
              style={styles.primaryCtaIcon}
              accessible={false}
              importantForAccessibility="no"
            />
          </Pressable>
          {primaryAction.kind === 'start' && recommendedLessonTitle ? (
            <View
              style={[
                styles.recommendationPill,
                { backgroundColor: appTheme.colors.primary + '10', borderColor: appTheme.colors.primary + '2A' },
              ]}
              accessibilityLabel={`Recommended next: ${recommendedLessonTitle}`}
              accessible
            >
              <Ionicons name="sparkles" size={14} color={appTheme.colors.primary} accessible={false} importantForAccessibility="no" />
              <Text style={[styles.recommendationLabel, { color: appTheme.colors.primary }]}>Recommended next</Text>
              <Text style={[styles.recommendationTitle, { color: appTheme.colors.text }]} numberOfLines={1}>
                {recommendedLessonTitle}
              </Text>
            </View>
          ) : null}
          {lessonsCompleteLabel ? (
            <Text style={[styles.primaryCtaHelper, { color: appTheme.colors.mutedText }]}>
              {lessonsCompleteLabel}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Lessons List Section */}
      {lessons.length > 0 ? (
        <View style={styles.lessonsSection}>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>
            Lessons
          </Text>
          <View style={styles.lessonsList}>
            {lessons.map((lesson, index) => {
              const progress = progressByLessonId.get(lesson.id);
              const preview = lessonOutcomes[lesson.id] ?? lesson.description ?? null;

              const handleLessonPress = () => {
                const sessionId = makeSessionId('learn');
                router.push({
                  pathname: routeBuilders.sessionDetail(sessionId),
                  params: { lessonId: lesson.id, kind: 'learn' },
                });
              };

              const handleLessonPressIn = () => {
                // Start preloading the session plan when user presses down
                preloadSessionPlan(lesson.id).catch((error) => {
                  // Silently fail - preloading is best effort
                  console.debug('Preload failed (non-critical):', error);
                });
              };

              return (
              <Pressable
                key={lesson.id}
                accessibilityRole="button"
                accessibilityLabel={`Open lesson ${lesson.title}`}
                accessibilityHint="Starts a session for this lesson"
                style={[styles.lessonCard, { backgroundColor: appTheme.colors.card, borderColor: appTheme.colors.border }]}
                onPress={handleLessonPress}
                onPressIn={handleLessonPressIn}
              >
                <View style={styles.lessonCardContent}>
                  <View style={styles.lessonCardLeft}>
                    <LinearGradient
                      colors={[appTheme.colors.primary + '22', appTheme.colors.primary + '10']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.lessonNumber, { borderColor: appTheme.colors.primary + '33' }]}
                      accessible={false}
                    >
                      <Text style={[styles.lessonNumberText, { color: appTheme.colors.primary }]}>
                        {index + 1}
                      </Text>
                    </LinearGradient>
                    <View style={styles.lessonCardText}>
                      <Text style={[styles.lessonTitle, { color: appTheme.colors.text }]}>
                        {lesson.title}
                      </Text>
                      <View style={styles.lessonMetaRow}>
                        <LessonMicroProgress
                          completed={progress?.completedTeachings ?? 0}
                          total={progress?.totalTeachings ?? (lesson.numberOfItems || 0)}
                        />
                      </View>
                      {preview ? (
                        <Text style={[styles.lessonDescription, { color: appTheme.colors.mutedText }]} numberOfLines={1}>
                          {preview}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.lessonCardRight}>
                    <Ionicons name="chevron-forward" size={20} color={appTheme.colors.mutedText} accessible={false} importantForAccessibility="no" />
                  </View>
                </View>
              </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: appTheme.colors.mutedText }]}>
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
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 28,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  infoPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoPillText: {
    fontFamily: theme.typography.regular,
    fontSize: 15,
  },
  subtitle: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  primaryActionSection: {
    width: '100%',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    width: '100%',
    minHeight: 52,
    gap: theme.spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  primaryCtaText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
  },
  primaryCtaIcon: {
    marginRight: -4,
  },
  primaryCtaHelper: {
    fontFamily: theme.typography.regular,
    fontSize: 13,
    textAlign: 'center',
  },
  recommendationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'center',
    maxWidth: '100%',
  },
  recommendationLabel: {
    fontFamily: theme.typography.semiBold,
    fontSize: 12,
  },
  recommendationTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: 12,
    maxWidth: 220,
  },
  sectionTitle: {
    fontFamily: theme.typography.bold,
    fontSize: 18,
    marginBottom: theme.spacing.md,
  },
  lessonsSection: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  lessonsList: {
    gap: theme.spacing.md,
  },
  lessonCard: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
  lessonCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lessonCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: theme.spacing.md,
  },
  lessonNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  lessonNumberText: {
    fontFamily: theme.typography.bold,
    fontSize: 16,
  },
  lessonCardText: {
    flex: 1,
  },
  lessonTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
  },
  lessonMetaRow: {
    marginTop: 6,
  },
  lessonDescription: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    marginTop: 6,
  },
  lessonCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  lessonStats: {
    fontFamily: theme.typography.regular,
    fontSize: 12,
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
