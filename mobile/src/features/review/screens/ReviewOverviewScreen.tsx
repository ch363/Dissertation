import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { makeSessionId } from '@/features/session/sessionBuilder';
import { routeBuilders } from '@/services/navigation/routes';
import { getProgressSummary, type ProgressSummary } from '@/services/api/progress';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

export default function ReviewOverviewScreen() {
  const { theme } = useAppTheme();
  const [dueReviewCount, setDueReviewCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchDueReviewCount() {
      try {
        setLoading(true);
        const summary: ProgressSummary = await getProgressSummary(null);
        if (!cancelled) {
          setDueReviewCount(summary.dueReviewCount || 0);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch due review count:', error);
          setDueReviewCount(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDueReviewCount();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleStartReview = () => {
    const sessionId = makeSessionId('review');
    router.push({
      pathname: routeBuilders.sessionDetail(sessionId),
      params: { kind: 'review' },
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.card}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Review</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.primary} size="small" />
            <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
              Loading...
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
              {dueReviewCount === 0
                ? 'No cards due for review'
                : `${dueReviewCount} ${dueReviewCount === 1 ? 'card' : 'cards'} due for review`}
            </Text>
            <View style={styles.buttonContainer}>
              <Button
                title="Start Review"
                onPress={handleStartReview}
                disabled={dueReviewCount === 0}
                accessibilityLabel="Start review session"
              />
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    padding: baseTheme.spacing.lg,
  },
  card: {
    borderRadius: baseTheme.radius.lg,
    backgroundColor: baseTheme.colors.card,
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
  },
  buttonContainer: {
    marginTop: baseTheme.spacing.sm,
  },
});
