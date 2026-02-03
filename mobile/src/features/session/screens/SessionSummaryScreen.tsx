import { router, useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button, LoadingRow } from '@/components/ui';
import { routeBuilders, routes } from '@/services/navigation/routes';
import { getCachedSessionPlan } from '@/services/api/session-plan-cache';
import { getLesson, getLessonTeachings, getModuleLessons, type Teaching, type Lesson } from '@/services/api/modules';
import { getUserLessons, type UserLessonProgress } from '@/services/api/progress';
import { theme } from '@/services/theme/tokens';
import { CardKind } from '@/types/session';
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
    totalXp?: string;
    teachingsMastered?: string;
    reviewedTeachings?: string;
  }>();
  const kind = params.kind === 'review' ? 'review' : 'learn';
  const lessonId = params.lessonId;
  const planMode = params.planMode === 'learn' || params.planMode === 'review' || params.planMode === 'mixed'
    ? (params.planMode as 'learn' | 'review' | 'mixed')
    : 'learn';
  const timeBudgetSec = params.timeBudgetSec ? Number(params.timeBudgetSec) : null;
  const returnTo = params.returnTo;
  const totalXp = params.totalXp != null && params.totalXp !== '' ? parseInt(params.totalXp, 10) : null;
  const teachingsMastered = params.teachingsMastered != null && params.teachingsMastered !== '' ? parseInt(params.teachingsMastered, 10) : null;
  const showStats = typeof totalXp === 'number' || typeof teachingsMastered === 'number';
  const reviewedTeachingsJson = params.reviewedTeachings;

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

  // Do not fetch dashboard for review: we only navigate here when there are zero due
  // (SessionRunner checks and continues to next session otherwise). Showing "X more due"
  // here caused wrong counts and a "Continue reviewing" loop back to this screen.

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
      // Review: use teachings passed from SessionRunner (phrases just reviewed)
      if (kind === 'review' && reviewedTeachingsJson) {
        try {
          const parsed = JSON.parse(reviewedTeachingsJson) as Array<{
            phrase: string;
            translation?: string;
            emoji?: string;
          }>;
          const converted: Teaching[] = (parsed || []).map((t, idx) => ({
            id: `reviewed-${idx}`,
            knowledgeLevel: 'beginner',
            emoji: t.emoji ?? null,
            userLanguageString: t.translation ?? '',
            learningLanguageString: t.phrase,
            learningLanguageAudioUrl: null,
            tip: null,
            lessonId: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
          setTeachings(converted);
        } catch (e) {
          Logger.error('Failed to parse reviewed teachings', e);
        }
        return;
      }

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
  }, [lessonId, kind, cachedTeachings, reviewedTeachingsJson]);

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
      router.replace(returnTo as Parameters<typeof router.replace>[0]);
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
      router.replace(routeBuilders.lessonStart(nextLesson.id) as Parameters<typeof router.replace>[0]);
    }
  }, [nextLesson]);

  const showBackToModule = kind === 'learn' && moduleHasRemainingLessons === true;
  // Review: we only navigate here when there are zero due (SessionRunner checks first).
  // Never show "Continue reviewing" on this screen to avoid wrong counts and loops.
  const showContinueReviewing = false;
  const headerTitle = lesson?.title || (kind === 'review' ? 'Review Summary' : 'Lesson Summary');

  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scale = useMemo(() => {
    const reserved = 140; // header + safe area
    const heroEst = 180;
    const statsEst = showStats ? 56 : 0;
    const actionsEst = 150;
    const paddingEst = 48;
    const perTeaching = 88;
    const teachingCount = Math.max(1, teachings.length + (loadingTeachings ? 1 : 0));
    const estimatedHeight = heroEst + statsEst + actionsEst + paddingEst + teachingCount * perTeaching;
    const available = windowHeight - reserved;
    const raw = available / estimatedHeight;
    return Math.min(1, Math.max(0.72, raw));
  }, [windowHeight, teachings.length, loadingTeachings, showStats]);

  const scaled = useMemo(
    () => ({
      cardInnerPadding: Math.round(theme.spacing.lg * scale),
      cardInnerGap: Math.round(theme.spacing.lg * scale),
      heroGap: Math.round(theme.spacing.sm * scale),
      titleSize: Math.round(24 * scale),
      subtitleSize: Math.round(15 * scale),
      subtitleLineHeight: Math.round(22 * scale),
      sectionGap: Math.round(theme.spacing.sm * scale),
      sectionHeaderGap: Math.round(8 * scale),
      learnedTitleSize: Math.round(16 * scale),
      contentGridGap: Math.round(theme.spacing.sm * scale),
      phraseCardPadding: Math.round(theme.spacing.md * scale),
      phraseCardGap: Math.round(theme.spacing.xs * scale),
      phraseRowGap: Math.round(12 * scale),
      emojiSize: Math.round(22 * scale),
      phraseSize: Math.round(17 * scale),
      phraseLineHeight: Math.round(22 * scale),
      translationSize: Math.round(15 * scale),
      translationLineHeight: Math.round(20 * scale),
      tipSize: Math.round(13 * scale),
      tipLineHeight: Math.round(18 * scale),
      actionsGap: Math.round(theme.spacing.md * scale),
      actionsMarginTop: Math.round(theme.spacing.md * scale),
      primaryButtonMinHeight: Math.round(56 * scale),
      secondaryMinHeight: Math.round(50 * scale),
      secondaryGap: Math.round(theme.spacing.sm * scale),
      statsGap: Math.round(theme.spacing.sm * scale),
      statValueSize: Math.round(20 * scale),
      statLabelSize: Math.round(12 * scale),
    }),
    [scale],
  );

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
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(theme.spacing.xl, insets.bottom + theme.spacing.md) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Main card (Figma: rounded-[32px], blue-tinted gradient) */}
          <LinearGradient
            colors={CARD_GRADIENT}
            style={styles.card}
          >
            <View style={[styles.cardInner, { padding: scaled.cardInnerPadding, gap: scaled.cardInnerGap }]}>
              <View style={[styles.hero, { gap: scaled.heroGap }]}>
                <View style={styles.heroIconWrap}>
                  <Ionicons name="checkmark-circle" size={Math.round(48 * scale)} color={theme.colors.primary} />
                </View>
                <Text style={[styles.title, { fontSize: scaled.titleSize }]}>
                  {kind === 'review' ? 'You completed this review!' : 'You completed this lesson!'}
                </Text>
                <Text style={[styles.subtitle, { fontSize: scaled.subtitleSize, lineHeight: scaled.subtitleLineHeight }]}>
                  {kind === 'review'
                    ? 'Great job on your review session!'
                    : teachings.length > 0
                      ? "Here's a summary of what you learned:"
                      : "You've completed all the content in this lesson. Great work!"}
                </Text>
                {showStats && (
                  <View style={[styles.statsRow, { gap: scaled.statsGap }]}>
                    {typeof totalXp === 'number' && (
                      <View style={styles.statPill}>
                        <Ionicons name="star" size={Math.round(18 * scale)} color={theme.colors.primary} />
                        <Text style={[styles.statValue, { fontSize: scaled.statValueSize }]}>{totalXp}</Text>
                        <Text style={[styles.statLabel, { fontSize: scaled.statLabelSize }]}>XP</Text>
                      </View>
                    )}
                    {typeof teachingsMastered === 'number' && (
                      <View style={styles.statPill}>
                        <Ionicons name="book" size={Math.round(18 * scale)} color={theme.colors.primary} />
                        <Text style={[styles.statValue, { fontSize: scaled.statValueSize }]}>{teachingsMastered}</Text>
                        <Text style={[styles.statLabel, { fontSize: scaled.statLabelSize }]}>
                          {teachingsMastered === 1 ? 'Teaching' : 'Teachings'}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {(teachings.length > 0 || loadingTeachings) && (
                <View style={[styles.learnedSection, { gap: scaled.sectionGap }]}>
                  <View style={[styles.sectionHeader, { gap: scaled.sectionHeaderGap }]}>
                    <Ionicons name="book-outline" size={Math.round(18 * scale)} color={theme.colors.primary} />
                    <Text style={[styles.learnedTitle, { fontSize: scaled.learnedTitleSize }]}>
                      {kind === 'review' ? 'Phrases you reviewed' : 'What you learned'}
                    </Text>
                  </View>

                  {loadingTeachings ? (
                    <LoadingRow label="Loading content…" />
                  ) : (
                    <View style={[styles.contentGrid, { gap: scaled.contentGridGap }]}>
                      {teachings.map((teaching, index) => (
                        <View key={teaching.id || index} style={[styles.phraseCard, { padding: scaled.phraseCardPadding, gap: scaled.phraseCardGap }]}>
                          <View style={[styles.phraseRow, { gap: scaled.phraseRowGap }]}>
                            {teaching.emoji ? (
                              <Text style={[styles.emoji, { fontSize: scaled.emojiSize, lineHeight: scaled.emojiSize + 2 }]}>{teaching.emoji}</Text>
                            ) : (
                              <Ionicons name="book-outline" size={Math.round(18 * scale)} color={theme.colors.mutedText} style={styles.phraseIcon} />
                            )}
                            <View style={styles.phraseContent}>
                              <Text style={[styles.phrase, { fontSize: scaled.phraseSize, lineHeight: scaled.phraseLineHeight }]}>{teaching.learningLanguageString}</Text>
                              {teaching.userLanguageString ? (
                                <Text style={[styles.translation, { fontSize: scaled.translationSize, lineHeight: scaled.translationLineHeight }]}>{teaching.userLanguageString}</Text>
                              ) : null}
                            </View>
                          </View>
                          {teaching.tip ? (
                            <View style={styles.tipContainer}>
                              <Ionicons name="bulb-outline" size={Math.round(12 * scale)} color={theme.colors.mutedText} />
                              <Text style={[styles.tipText, { fontSize: scaled.tipSize, lineHeight: scaled.tipLineHeight }]}>{teaching.tip}</Text>
                            </View>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Actions: primary CTA then Back (USER_JOURNEYS) */}
              <View style={[styles.actions, { gap: scaled.actionsGap, marginTop: scaled.actionsMarginTop }]}>
                {showContinueReviewing ? (
                  <Button
                    title="Continue reviewing"
                    onPress={handleContinueReviewing}
                    accessibilityHint="Starts another review session with remaining due items"
                    style={[styles.primaryButton, { minHeight: scaled.primaryButtonMinHeight }]}
                  />
                ) : nextLesson ? (
                  <Button
                    title="Continue to next lesson"
                    onPress={handleContinueToNextLesson}
                    accessibilityHint="Starts the next lesson in this module"
                    style={[styles.primaryButton, { minHeight: scaled.primaryButtonMinHeight }]}
                  />
                ) : null}
                <View style={[styles.secondaryRow, { gap: scaled.secondaryGap, minHeight: scaled.secondaryMinHeight }]}>
                  <Button
                    title="Back to home"
                    onPress={handleBackToHome}
                    variant="secondary"
                    accessibilityHint="Returns to home"
                    style={[styles.secondaryButton, { minHeight: scaled.secondaryMinHeight, backgroundColor: theme.colors.success }]}
                  />
                  <Button
                    title={showBackToModule ? 'Back to module' : kind === 'review' ? 'Back to review' : 'Back to learn'}
                    onPress={showBackToModule ? handleBackToModule : handleReturnTo}
                    variant="secondary"
                    accessibilityHint={showBackToModule ? 'Returns to course' : 'Returns to learn or review'}
                    style={[styles.secondaryButton, { minHeight: scaled.secondaryMinHeight, backgroundColor: theme.colors.success }]}
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
  headerSpacer: {
    width: 44,
    height: 44,
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
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    ...(Platform.OS === 'android' && { elevation: 8 }),
    overflow: 'hidden',
  },
  cardInner: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  hero: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  heroIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 24,
    color: theme.colors.text,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  subtitle: {
    fontFamily: theme.typography.regular,
    fontSize: 15,
    color: theme.colors.mutedText,
    textAlign: 'center',
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: theme.radius.round,
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.4)',
  },
  statValue: {
    fontFamily: theme.typography.bold,
    color: theme.colors.text,
  },
  statLabel: {
    fontFamily: theme.typography.regular,
    color: theme.colors.mutedText,
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
    paddingBottom: theme.spacing.sm,
  },
  phraseCard: {
    padding: theme.spacing.md,
    backgroundColor: USAGE_CARD_BG,
    borderRadius: USAGE_RADIUS,
    borderWidth: 1,
    borderColor: USAGE_CARD_BORDER,
    gap: theme.spacing.xs,
    ...(Platform.OS === 'android' && { elevation: 2 }),
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
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: BUTTON_RADIUS,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 50,
  },
  secondaryButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    borderRadius: 12,
  },
});
