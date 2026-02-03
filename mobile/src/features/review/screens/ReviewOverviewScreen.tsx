import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingRow, TappableCard } from '@/components/ui';
import { ScreenHeader } from '@/components/navigation';
import { makeSessionId } from '@/features/session/sessionBuilder';
import { routeBuilders, routes } from '@/services/navigation/routes';
import {
  clearReviewScreenCache,
  getCachedReviewScreenData,
  preloadReviewScreenData,
  type ReviewScreenCacheData,
} from '@/services/api/review-screen-cache';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

function formatDueCount(n: number) {
  if (n === 0) return 'Nothing to review';
  return `${n} ${n === 1 ? 'review' : 'reviews'} due today`;
}

function safeText(s?: string | null) {
  const t = (s ?? '').trim();
  return t.length > 0 ? t : undefined;
}

const TAB_BAR_HEIGHT = 84;

export default function ReviewOverviewScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [data, setData] = React.useState<ReviewScreenCacheData | null>(() =>
    getCachedReviewScreenData()
  );
  const [loading, setLoading] = React.useState(!getCachedReviewScreenData());
  const hasDataRef = React.useRef(!!getCachedReviewScreenData());

  const reload = useCallback(async (options?: { forceRefresh?: boolean }) => {
    if (options?.forceRefresh) {
      clearReviewScreenCache();
      setLoading(true);
    } else if (!hasDataRef.current) {
      setLoading(true);
    }
    const result = await preloadReviewScreenData();
    if (result) {
      setData(result);
      hasDataRef.current = true;
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Always refetch when screen gains focus so "reviews due" count is up to date after a session
      reload({ forceRefresh: true });
    }, [reload])
  );

  const dashboard = data?.dashboard ?? null;
  const due = data?.due ?? [];

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
  const accuracyDisplay = '—';

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.content,
        styles.scrollContent,
        {
          paddingTop: insets.top,
          paddingBottom: baseTheme.spacing.xl + insets.bottom + TAB_BAR_HEIGHT,
          paddingLeft: baseTheme.spacing.lg + insets.left,
          paddingRight: baseTheme.spacing.lg + insets.right,
        },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader
        title="Review"
        subtitle="Master your knowledge with spaced repetition"
        showHelp
        showHome
      />
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
              <Text style={styles.statLabel}>Accuracy (30d)</Text>
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
              {(due || []).map((r) => {
                const phrase = safeText(r.question?.teaching?.learningLanguageString);
                const translation = safeText(r.question?.teaching?.userLanguageString);
                const lessonTitle = safeText(r.question?.teaching?.lesson?.title);
                const category = lessonTitle ?? 'Review';

                return (
                  <TappableCard
                    key={r.id}
                    title={phrase ?? `Question ${r.questionId}`}
                    subtitle={translation}
                    overline={category}
                    onPress={handleStartReview}
                    accessibilityLabel={`Review item: ${phrase ?? 'card'}`}
                    accessibilityHint="Starts review session"
                    style={styles.dueItemCardSpacing}
                  />
                );
              })}
            </View>
          )}
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
  dueItemCardSpacing: {},
});
