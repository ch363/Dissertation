import { router, useLocalSearchParams, Stack } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { LoadingRow } from '@/components/ui';
import { routeBuilders, routes } from '@/services/navigation/routes';
import { theme } from '@/services/theme/tokens';
import { CardKind, SessionPlan } from '@/types/session';
import { getCachedSessionPlan } from '@/services/api/session-plan-cache';
import { getLesson, getLessonTeachings, getModuleLessons, type Teaching, type Lesson, type Module } from '@/services/api/modules';
import { getUserLessons, type UserLessonProgress } from '@/services/api/progress';

export default function SessionSummaryScreen() {
  const params = useLocalSearchParams<{
    sessionId?: string;
    kind?: string;
    lessonId?: string;
    planMode?: string;
    timeBudgetSec?: string;
    returnTo?: string;
  }>();
  const kind = params.kind === 'review' ? 'review' : 'learn';
  const lessonId = params.lessonId;
  const planMode = params.planMode === 'learn' || params.planMode === 'review' || params.planMode === 'mixed'
    ? (params.planMode as 'learn' | 'review' | 'mixed')
    : 'learn';
  const timeBudgetSec = params.timeBudgetSec ? Number(params.timeBudgetSec) : null;
  const returnTo = params.returnTo;

  const [teachings, setTeachings] = useState<Teaching[]>([]);
  const [loadingTeachings, setLoadingTeachings] = useState(false);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [moduleHasRemainingLessons, setModuleHasRemainingLessons] = useState<boolean | null>(null);

  // Get the session plan from cache to extract teachings
  const sessionPlan = useMemo(() => {
    if (lessonId && kind === 'learn') {
      return getCachedSessionPlan({
        lessonId,
        mode: planMode,
        timeBudgetSec: Number.isFinite(timeBudgetSec as any) ? timeBudgetSec : null,
      });
    }
    return null;
  }, [lessonId, kind, planMode, timeBudgetSec]);

  // Extract teachings from cached session plan first
  const cachedTeachings = useMemo(() => {
    if (!sessionPlan) return [];
    return sessionPlan.cards
      .filter((card) => card.kind === CardKind.Teach)
      .map((card) => {
        if (card.kind === CardKind.Teach) {
          return {
            phrase: card.content.phrase,
            translation: card.content.translation,
            emoji: card.content.emoji,
          };
        }
        return null;
      })
      .filter((t) => t !== null) as Array<{
        phrase: string;
        translation?: string;
        emoji?: string;
      }>;
  }, [sessionPlan]);

  // Fetch lesson data to get the title
  useEffect(() => {
    const fetchLesson = async () => {
      if (lessonId && kind === 'learn') {
        try {
          const lessonData = await getLesson(lessonId);
          setLesson(lessonData);
        } catch (error) {
          console.error('Failed to load lesson:', error);
          // Continue without lesson title - not critical
        }
      }
    };

    fetchLesson();
  }, [lessonId, kind]);

  // Determine whether the parent module still has incomplete lessons.
  // If the module is fully complete, the secondary CTA should return to Learn hub instead.
  useEffect(() => {
    const moduleId = lesson?.moduleId;
    if (!moduleId || kind !== 'learn') {
      setModuleHasRemainingLessons(null);
      return;
    }

    let cancelled = false;
    setModuleHasRemainingLessons(null);

    const loadModuleRemaining = async () => {
      try {
        const [moduleLessons, progress] = await Promise.all([
          getModuleLessons(moduleId).catch(() => [] as Lesson[]),
          getUserLessons().catch(() => [] as UserLessonProgress[]),
        ]);
        if (cancelled) return;

        const progressByLessonId = new Map(progress.map((p) => [p.lesson.id, p] as const));
        const hasRemaining = moduleLessons.some((l) => {
          const p = progressByLessonId.get(l.id);
          const total = p?.totalTeachings ?? l.numberOfItems ?? 0;
          const completed = p?.completedTeachings ?? 0;
          const isComplete = total > 0 && completed >= total;
          return !isComplete;
        });

        setModuleHasRemainingLessons(hasRemaining);
      } catch (e) {
        if (!cancelled) setModuleHasRemainingLessons(null);
      }
    };

    loadModuleRemaining();
    return () => {
      cancelled = true;
    };
  }, [lesson?.moduleId, kind]);

  // Fetch teachings from API if we have a lessonId and no cached teachings
  useEffect(() => {
    const fetchTeachings = async () => {
      // If we have cached teachings, use those
      if (cachedTeachings.length > 0) {
        // Convert cached format to Teaching format for display
        const convertedTeachings: Teaching[] = cachedTeachings.map((t, idx) => ({
          id: `cached-${idx}`,
          knowledgeLevel: 'beginner',
          emoji: t.emoji || null,
          userLanguageString: t.translation || '',
          learningLanguageString: t.phrase,
          learningLanguageAudioUrl: null,
          tip: null,
          lessonId: lessonId || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        setTeachings(convertedTeachings);
        return;
      }

      // Otherwise fetch from API
      if (lessonId && kind === 'learn') {
        setLoadingTeachings(true);
        try {
          const teachingsData = await getLessonTeachings(lessonId);
          setTeachings(teachingsData);
        } catch (error) {
          console.error('Failed to load lesson teachings:', error);
          // Continue without teachings - not critical
        } finally {
          setLoadingTeachings(false);
        }
      }
    };

    fetchTeachings();
  }, [lessonId, kind, cachedTeachings]);

  const handleBackToHome = () => {
    router.replace(routes.tabs.home);
  };

  const handleBackToLearn = () => {
    router.replace(routes.tabs.learn);
  };

  const handleBackToReview = () => {
    router.replace(routes.tabs.review);
  };

  const handleReturnTo = () => {
    if (returnTo && typeof returnTo === 'string' && returnTo.trim().length > 0) {
      router.replace(returnTo as any);
      return;
    }
    if (kind === 'review') {
      handleBackToReview();
      return;
    }
    handleBackToLearn();
  };

  const handleBackToModule = () => {
    const moduleId = lesson?.moduleId;
    if (!moduleId) {
      handleBackToLearn();
      return;
    }
    router.replace(routeBuilders.courseDetail(moduleId));
  };

  const showBackToModule = kind === 'learn' && moduleHasRemainingLessons === true;

  // Determine header title
  const headerTitle = lesson?.title || (kind === 'review' ? 'Review Summary' : 'Lesson Summary');

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: headerTitle }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Ionicons name="checkmark-circle" size={36} color={theme.colors.primary} />
            <Text style={styles.title}>You completed this lesson!</Text>
            <Text style={styles.subtitle}>
              {kind === 'review'
                ? 'Great job on your review session!'
                : teachings.length > 0
                  ? "Here's a summary of what you learned:"
                  : 'You\'ve completed all the content in this lesson. Great work!'}
            </Text>
          </View>

          {(teachings.length > 0 || loadingTeachings) && (
            <View style={styles.learnedSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="book-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.learnedTitle}>Lesson Summary</Text>
              </View>
              
              {loadingTeachings ? (
                <LoadingRow label="Loading content…" />
              ) : (
                <View style={styles.contentGrid}>
                  {teachings.map((teaching, index) => (
                    <View key={teaching.id || index} style={styles.phraseCard}>
                      <View style={styles.phraseHeader}>
                        {teaching.emoji && (
                          <Text style={styles.emoji}>{teaching.emoji}</Text>
                        )}
                        <View style={styles.phraseContent}>
                          <Text style={styles.phrase}>{teaching.learningLanguageString}</Text>
                          {teaching.userLanguageString && (
                            <Text style={styles.translation}>{teaching.userLanguageString}</Text>
                          )}
                        </View>
                      </View>
                      {teaching.tip && (
                        <View style={styles.tipContainer}>
                          <Ionicons name="bulb-outline" size={12} color={theme.colors.mutedText} />
                          <Text style={styles.tipText}>{teaching.tip}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={styles.actions}>
            <Pressable style={styles.primary} onPress={handleBackToHome}>
              <Text style={styles.primaryLabel}>Back to home</Text>
            </Pressable>
            <Pressable style={styles.secondary} onPress={showBackToModule ? handleBackToModule : handleReturnTo}>
              <Text style={styles.secondaryLabel}>
                {showBackToModule ? 'Back to module' : kind === 'review' ? 'Back to review' : 'Back to learn'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.md,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  header: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 20,
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.mutedText,
    textAlign: 'center',
  },
  learnedSection: {
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.xs,
  },
  learnedTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
    color: theme.colors.text,
  },
  contentGrid: {
    gap: theme.spacing.xs,
  },
  phraseCard: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  phraseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
  },
  emoji: {
    fontSize: 20,
    lineHeight: 22,
  },
  phraseContent: {
    flex: 1,
    gap: 2,
  },
  phrase: {
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 20,
  },
  translation: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.mutedText,
    lineHeight: 18,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 4,
    paddingTop: theme.spacing.xs,
    paddingLeft: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  tipText: {
    flex: 1,
    fontFamily: theme.typography.regular,
    fontSize: 12,
    color: theme.colors.mutedText,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  primary: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  primaryLabel: {
    color: '#fff',
    fontFamily: theme.typography.semiBold,
    fontSize: 15,
  },
  secondary: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  secondaryLabel: {
    fontFamily: theme.typography.semiBold,
    fontSize: 15,
    color: theme.colors.text,
  },
});
