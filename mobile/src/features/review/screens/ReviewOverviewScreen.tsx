import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LoadingRow, ScrollView } from '@/components/ui';
import { ScreenHeader } from '@/components/navigation';
import { makeSessionId } from '@/features/session/sessionBuilder';
import { routeBuilders, routes } from '@/services/navigation/routes';
import { getDashboard, type DashboardData } from '@/services/api/profile';
import { getDueReviewsLatest, type DueReviewLatest } from '@/services/api/progress';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

function formatDueCount(n: number) {
  if (n === 0) return 'No cards due for review';
  return `${n} ${n === 1 ? 'card' : 'cards'} due today`;
}

function safeText(s?: string | null) {
  const t = (s ?? '').trim();
  return t.length > 0 ? t : undefined;
}

/** Due-item cards use the app primary (blue) palette for consistency with PRACTICE tag and Learn tab. */
const DUE_ITEM_CARD_PALETTE = {
  bg: '#EFF6FF',
  border: 'rgba(38,79,212,0.25)',
} as const;

export default function ReviewOverviewScreen() {
  const { theme } = useAppTheme();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [due, setDue] = useState<DueReviewLatest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardRes, dueItems] = await Promise.all([
        getDashboard(),
        getDueReviewsLatest().catch(() => []),
      ]);
      setDashboard(dashboardRes ?? null);
      setDue(dueItems || []);
    } catch (error) {
      console.error('Failed to fetch review data:', error);
      setDashboard(null);
      setDue([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        if (cancelled) return;
        await load();
      })();
      return () => {
        cancelled = true;
      };
    }, [load]),
  );

  const handleStartReview = () => {
    const sessionId = makeSessionId('review');
    router.push({
      pathname: routeBuilders.sessionDetail(sessionId),
      params: { kind: 'review', returnTo: routes.tabs.review },
    });
  };

  const dueReviewCount = dashboard?.dueReviewCount ?? 0;
  const streak = dashboard?.streak ?? 0;
  const xpTotal = dashboard?.xpTotal ?? 0;
  // Accuracy not yet provided by dashboard API; show placeholder until backend supports it
  const accuracyDisplay = '—';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title="Review"
        subtitle="Master your knowledge with spaced repetition"
        icon="sparkles"
        label="Practice"
        showHelp
        showHome
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: baseTheme.spacing.xl + 32 }]}
      >
        {/* Stats row: Day Streak, Accuracy, Total XP */}
        <View style={styles.statsRow}>
          <View style={styles.statCardWrapper}>
            <LinearGradient
              colors={['#F97316', '#EF4444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.statCard, styles.statCardShadow]}
            >
              <Ionicons name="flame" size={24} color="#FFF" style={styles.statIcon} />
              <Text style={styles.statValue}>
                {loading ? '—' : streak}
              </Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCardWrapper}>
            <LinearGradient
              colors={['#10B981', '#14B8A6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.statCard, styles.statCardShadow]}
            >
              <Ionicons name="locate" size={24} color="#FFF" style={styles.statIcon} />
              <Text style={styles.statValue}>
                {loading ? '—' : accuracyDisplay}
              </Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCardWrapper}>
            <LinearGradient
              colors={['#2563EB', '#264FD4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.statCard, styles.statCardShadow]}
            >
              <Ionicons name="trophy" size={24} color="#FFF" style={styles.statIcon} />
              <Text style={styles.statValue}>
                {loading ? '—' : xpTotal}
              </Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Hero: Ready to Review CTA card */}
        <View style={styles.heroCardWrapper}>
          <LinearGradient
            colors={['#1D4ED8', '#2563EB', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            {/* Decorative pattern overlay */}
            <View style={styles.heroPattern}>
              <View style={[styles.heroPatternCircle, styles.heroPatternCircle1]} />
              <View style={[styles.heroPatternCircle, styles.heroPatternCircle2]} />
              <View style={[styles.heroPatternSquare]} />
            </View>
            <View style={styles.heroGlow1} />
            <View style={styles.heroGlow2} />

            <View style={styles.heroContent}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroIconBox}>
                  <Ionicons name="sparkles" size={20} color="#FDE047" />
                </View>
                <Text style={styles.heroLabel}>Ready to Review</Text>
              </View>
              <Text style={styles.heroTitle}>Review</Text>
              {loading ? (
                <View style={styles.heroLoadingRow}>
                  <ActivityIndicator color="rgba(255,255,255,0.9)" size="small" />
                  <Text style={styles.heroSubtitle}>Loading…</Text>
                </View>
              ) : (
                <Text style={styles.heroSubtitle}>{formatDueCount(dueReviewCount)}</Text>
              )}

              <View style={styles.heroButtonContainer}>
                <Pressable
                  onPress={handleStartReview}
                  disabled={dueReviewCount === 0}
                  accessibilityRole="button"
                  accessibilityLabel="Start review session"
                  style={({ pressed }) => [
                    styles.heroButton,
                    (dueReviewCount === 0 || pressed) && styles.heroButtonDisabled,
                  ]}
                >
                  <Text style={[styles.heroButtonText, { color: theme.colors.primary }]}>
                    Start Review
                  </Text>
                </Pressable>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Due Items section */}
        <View style={styles.listSection}>
          <Text style={[styles.listTitle, { color: theme.colors.text }]} accessibilityRole="header">
            Due Items
          </Text>
          <Text style={[styles.listSubtitle, { color: theme.colors.mutedText }]}>
            You'll review these across your sessions.
          </Text>

          {loading ? (
            <LoadingRow label="Loading due items…" />
          ) : (
            <View style={styles.list}>
              {(due || []).map((r, index) => {
                const phrase = safeText(r.question?.teaching?.learningLanguageString);
                const translation = safeText(r.question?.teaching?.userLanguageString);
                const lessonTitle = safeText(r.question?.teaching?.lesson?.title);
                const category = lessonTitle ?? 'Review';
                const colors = DUE_ITEM_CARD_COLORS[index % DUE_ITEM_CARD_COLORS.length];

                return (
                  <Pressable
                    key={r.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Review item: ${phrase ?? 'card'}`}
                    onPress={handleStartReview}
                    style={({ pressed }) => [
                      styles.dueItemCard,
                      {
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                        opacity: pressed ? 0.92 : 1,
                      },
                    ]}
                  >
                    <View style={styles.dueItemInner}>
                      <View style={styles.dueItemTextBlock}>
                        <Text style={[styles.itemPhrase, { color: theme.colors.text }]} numberOfLines={1}>
                          {phrase ?? `Question ${r.questionId}`}
                        </Text>
                        {!!translation && (
                          <Text style={[styles.itemTranslation, { color: theme.colors.mutedText }]} numberOfLines={1}>
                            {translation}
                          </Text>
                        )}
                        <View style={[styles.categoryPill, { backgroundColor: 'rgba(255,255,255,0.85)', borderColor: colors.border }]}>
                          <Text style={[styles.categoryPillText, { color: colors.accent }]} numberOfLines={1}>
                            {category}
                          </Text>
                        </View>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={theme.colors.mutedText}
                        style={styles.dueItemChevron}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: baseTheme.spacing.lg,
    paddingTop: baseTheme.spacing.md,
    gap: baseTheme.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCardWrapper: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  statCard: {
    borderRadius: 20,
    padding: baseTheme.spacing.md,
    minHeight: 100,
  },
  statCardShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 24,
    color: '#FFFFFF',
  },
  statLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  heroCardWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  heroGradient: {
    borderRadius: 28,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  heroPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.12,
  },
  heroPatternCircle: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    borderRadius: 999,
  },
  heroPatternCircle1: {
    width: 128,
    height: 128,
    top: -32,
    right: -32,
  },
  heroPatternCircle2: {
    width: 160,
    height: 160,
    bottom: -40,
    left: -40,
  },
  heroPatternSquare: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -24,
    marginTop: -24,
    width: 48,
    height: 48,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },
  heroGlow1: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
    // blur in RN is limited; rely on shadow for depth
  },
  heroGlow2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(37,99,235,0.25)',
  },
  heroContent: {
    position: 'relative',
    zIndex: 10,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  heroIconBox: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  heroLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
  },
  heroTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
  },
  heroLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroButtonContainer: {
    marginTop: 24,
  },
  heroButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  heroButtonDisabled: {
    opacity: 0.7,
  },
  heroButtonText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 17,
  },
  listSection: {
    gap: 4,
  },
  listTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
  },
  listSubtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
  },
  list: {
    marginTop: baseTheme.spacing.sm,
    gap: 12,
  },
  dueItemCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  dueItemInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  dueItemTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  dueItemChevron: {
    marginLeft: 8,
    marginTop: 2,
  },
  itemPhrase: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 17,
  },
  itemTranslation: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 8,
  },
  categoryPillText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 13,
  },
});
