import { router, useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button, LoadingRow } from '@/components/ui';
import { routeBuilders, routes } from '@/services/navigation/routes';
import { theme } from '@/services/theme/tokens';
import { CardKind } from '@/types/session';
import { getCachedSessionPlan } from '@/services/api/session-plan-cache';
import { getLesson, getLessonTeachings, getModuleLessons, type Teaching, type Lesson } from '@/services/api/modules';
import { getUserLessons, type UserLessonProgress } from '@/services/api/progress';
import { createLogger } from '@/services/logging';

const Logger = createLogger('SessionSummaryScreen');

// Figma / Professional App Redesign: gradient and card colours (light)
const GRADIENT_BG = ['#f8fafc', '#eff6ff', '#eef2ff'] as const;
const CARD_GRADIENT = ['#eff6ff', '#e0e7ff', '#eff6ff'] as const;
const CARD_BORDER = 'rgba(147, 197, 253, 0.5)';
const USAGE_CARD_BG = 'rgba(248, 250, 252, 0.9)';
const USAGE_CARD_BORDER = 'rgba(226, 232, 240, 0.6)';
const HEADER_BUTTON_BG = 'rgba(255, 255, 255, 0.85)';
const SHADOW_COLOR = '#000';

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
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [moduleHasRemainingLessons, setModuleHasRemainingLessons] = useState<boolean | null>(null);

  const sessionPlan = useMemo(() => {
    if (lessonId && kind === 'learn') {
      return getCachedSessionPlan({
        lessonId,
        mode: planMode,
        timeBudgetSec: Number.isFinite(timeBudgetSec as number) ? timeBudgetSec : null,
      });
    }
    return null;
  }, [lessonId, kind, planMode, timeBudgetSec]);

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

  useEffect(() => {
    const fetchLesson = async () => {
      if (lessonId && kind === 'learn') {
        try {
          const lessonData = await getLesson(lessonId);
          setLesson(lessonData);
        } catch (error) {
          Logger.error('Failed to load lesson', error);
        }
      }
    };

    fetchLesson();
  }, [lessonId, kind]);

  useEffect(() => {
    const moduleId = lesson?.moduleId;
    if (!moduleId || kind !== 'learn') {
      setModuleHasRemainingLessons(null);
      setNextLesson(null);
      return;
    }

    let cancelled = false;
    setModuleHasRemainingLessons(null);
    setNextLesson(null);

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

        // Next lesson: first incomplete lesson after current (or next in list after current)
        const currentIndex = moduleLessons.findIndex((l) => l.id === lessonId);
        if (currentIndex >= 0 && currentIndex < moduleLessons.length - 1) {
          const candidate = moduleLessons[currentIndex + 1];
          if (candidate) {
            const p = progressByLessonId.get(candidate.id);
            const total = p?.totalTeachings ?? candidate.numberOfItems ?? 0;
            const completed = p?.completedTeachings ?? 0;
            const isComplete = total > 0 && completed >= total;
            if (!isComplete) setNextLesson(candidate);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setModuleHasRemainingLessons(null);
          setNextLesson(null);
        }
      }
    };

    loadModuleRemaining();
    return () => {
      cancelled = true;
    };
  }, [lesson?.moduleId, kind, lessonId]);

  useEffect(() => {
    const fetchTeachings = async () => {
      if (cachedTeachings.length > 0) {
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

      if (lessonId && kind === 'learn') {
        setLoadingTeachings(true);
        try {
          const teachingsData = await getLessonTeachings(lessonId);
          setTeachings(teachingsData);
        } catch (error) {
          Logger.error('Failed to load lesson teachings', error);
        } finally {
          setLoadingTeachings(false);
        }
      }
    };

    fetchTeachings();
  }, [lessonId, kind, cachedTeachings]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleBackToHome = useCallback(() => {
    router.replace(routes.tabs.home);
  }, []);

  const handleBackToLearn = useCallback(() => {
    router.replace(routes.tabs.learn);
  }, []);

  const handleBackToReview = useCallback(() => {
    router.replace(routes.tabs.review);
  }, []);

  const handleReturnTo = useCallback(() => {
    if (returnTo && typeof returnTo === 'string' && returnTo.trim().length > 0) {
      router.replace(returnTo as any);
      return;
    }
    if (kind === 'review') {
      handleBackToReview();
      return;
    }
    handleBackToLearn();
  }, [returnTo, kind, handleBackToReview, handleBackToLearn]);

  const handleBackToModule = useCallback(() => {
    const moduleId = lesson?.moduleId;
    if (!moduleId) {
      handleBackToLearn();
      return;
    }
    router.replace(routeBuilders.courseDetail(moduleId));
  }, [lesson?.moduleId, handleBackToLearn]);

  const handleContinueToNextLesson = useCallback(() => {
    if (nextLesson) {
      router.replace(routeBuilders.lessonStart(nextLesson.id) as any);
    }
  }, [nextLesson]);

  const showBackToModule = kind === 'learn' && moduleHasRemainingLessons === true;
  const headerTitle = lesson?.title || (kind === 'review' ? 'Review Summary' : 'Lesson Summary');

  return (
    <View style={styles.safe}>
      <LinearGradient colors={GRADIENT_BG} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Stack.Screen options={{ title: headerTitle, headerShown: false }} />
        {/* Header: back + title (Figma style) */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.headerButton, pressed && styles.headerButtonPressed]}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {headerTitle}
          </Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main card (Figma: rounded-[32px], blue-tinted gradient) */}
          <LinearGradient
            colors={CARD_GRADIENT}
            style={styles.card}
          >
            <View style={styles.cardInner}>
              <View style={styles.hero}>
                <Ionicons name="checkmark-circle" size={40} color={theme.colors.primary} />
                <Text style={styles.title}>You completed this lesson!</Text>
                <Text style={styles.subtitle}>
                  {kind === 'review'
                    ? 'Great job on your review session!'
                    : teachings.length > 0
                      ? "Here's a summary of what you learned:"
                      : "You've completed all the content in this lesson. Great work!"}
                </Text>
              </View>

              {(teachings.length > 0 || loadingTeachings) && (
                <View style={styles.learnedSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="book-outline" size={18} color={theme.colors.primary} />
                    <Text style={styles.learnedTitle}>Teachings</Text>
                  </View>

                  {loadingTeachings ? (
                    <LoadingRow label="Loading content…" />
                  ) : (
                    <View style={styles.contentGrid}>
                      {teachings.map((teaching, index) => (
                        <View key={teaching.id || index} style={styles.phraseCard}>
                          <View style={styles.phraseRow}>
                            {teaching.emoji ? (
                              <Text style={styles.emoji}>{teaching.emoji}</Text>
                            ) : (
                              <Ionicons name="book-outline" size={18} color={theme.colors.mutedText} style={styles.phraseIcon} />
                            )}
                            <View style={styles.phraseContent}>
                              <Text style={styles.phrase}>{teaching.learningLanguageString}</Text>
                              {teaching.userLanguageString ? (
                                <Text style={styles.translation}>{teaching.userLanguageString}</Text>
                              ) : null}
                            </View>
                          </View>
                          {teaching.tip ? (
                            <View style={styles.tipContainer}>
                              <Ionicons name="bulb-outline" size={12} color={theme.colors.mutedText} />
                              <Text style={styles.tipText}>{teaching.tip}</Text>
                            </View>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Actions: primary CTA then Back (USER_JOURNEYS) */}
              <View style={styles.actions}>
                {nextLesson ? (
                  <Button
                    title="Continue to next lesson"
                    onPress={handleContinueToNextLesson}
                    accessibilityHint="Starts the next lesson in this module"
                    style={styles.primaryButton}
                  />
                ) : null}
                <View style={styles.secondaryRow}>
                  <Button
                    title="Back to home"
                    onPress={handleBackToHome}
                    variant="secondary"
                    accessibilityHint="Returns to home"
                    style={styles.secondaryButton}
                  />
                  <Button
                    title={showBackToModule ? 'Back to module' : kind === 'review' ? 'Back to review' : 'Back to learn'}
                    onPress={showBackToModule ? handleBackToModule : handleReturnTo}
                    variant="secondary"
                    accessibilityHint={showBackToModule ? 'Returns to course' : 'Returns to learn or review'}
                    style={styles.secondaryButton}
                  />
                </View>
              </View>
            </View>
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const CARD_RADIUS = 32;
const BUTTON_RADIUS = 20;
const USAGE_RADIUS = 24;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: HEADER_BUTTON_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonPressed: {
    opacity: 0.8,
  },
  headerTitle: {
    flex: 1,
    fontFamily: theme.typography.semiBold,
    fontSize: 18,
    color: theme.colors.text,
    textAlign: 'center',
    marginHorizontal: theme.spacing.xs,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    flexGrow: 1,
  },
  card: {
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: SHADOW_COLOR,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    overflow: 'hidden',
  },
  cardInner: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  hero: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 22,
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: theme.typography.regular,
    fontSize: 15,
    color: theme.colors.mutedText,
    textAlign: 'center',
    lineHeight: 22,
  },
  learnedSection: {
    gap: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.xs,
  },
  learnedTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
    color: theme.colors.text,
  },
  contentGrid: {
    gap: theme.spacing.sm,
  },
  phraseCard: {
    padding: theme.spacing.md,
    backgroundColor: USAGE_CARD_BG,
    borderRadius: USAGE_RADIUS,
    borderWidth: 1,
    borderColor: USAGE_CARD_BORDER,
    gap: theme.spacing.xs,
  },
  phraseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  phraseIcon: {
    marginTop: 2,
  },
  emoji: {
    fontSize: 22,
    lineHeight: 24,
  },
  phraseContent: {
    flex: 1,
    gap: 2,
  },
  phrase: {
    fontFamily: theme.typography.bold,
    fontSize: 17,
    color: theme.colors.text,
    lineHeight: 22,
  },
  translation: {
    fontFamily: theme.typography.regular,
    fontSize: 15,
    color: theme.colors.mutedText,
    lineHeight: 20,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  tipText: {
    flex: 1,
    fontFamily: theme.typography.regular,
    fontSize: 13,
    color: theme.colors.mutedText,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actions: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: BUTTON_RADIUS,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
  },
});
