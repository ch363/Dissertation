import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ScrollView } from '@/components/ui';
import { makeSessionId } from '@/features/session/sessionBuilder';
import { routeBuilders, routes } from '@/services/navigation/routes';
import { getDashboard } from '@/services/api/profile';
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

export default function ReviewOverviewScreen() {
  const { theme } = useAppTheme();
  const [dueReviewCount, setDueReviewCount] = useState<number>(0);
  const [due, setDue] = useState<DueReviewLatest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboard, dueItems] = await Promise.all([
        getDashboard(),
        getDueReviewsLatest().catch(() => []),
      ]);
      setDueReviewCount(dashboard?.dueReviewCount || 0);
      setDue(dueItems || []);
    } catch (error) {
      console.error('Failed to fetch due review count:', error);
      setDueReviewCount(0);
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
            Review
          </Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={theme.colors.primary} size="small" />
              <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>Loading…</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
                {formatDueCount(dueReviewCount)}
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

        {!loading && dueReviewCount > 0 && (
          <View style={styles.listSection}>
            <Text style={[styles.listTitle, { color: theme.colors.text }]}>Due items</Text>
            <Text style={[styles.listSubtitle, { color: theme.colors.mutedText }]}>
              You’ll review these across your sessions.
            </Text>

            <View style={styles.list}>
              {(due || []).map((r) => {
                const phrase = safeText(r.question?.teaching?.learningLanguageString);
                const translation = safeText(r.question?.teaching?.userLanguageString);
                const lessonTitle = safeText(r.question?.teaching?.lesson?.title);

                return (
                  <Pressable
                    key={r.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Review item: ${phrase ?? 'card'}`}
                    onPress={handleStartReview}
                    style={({ pressed }) => [
                      styles.item,
                      {
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                        opacity: pressed ? 0.92 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.itemPhrase, { color: theme.colors.text }]} numberOfLines={1}>
                      {phrase ?? `Question ${r.questionId}`}
                    </Text>
                    {!!translation && (
                      <Text style={[styles.itemTranslation, { color: theme.colors.mutedText }]} numberOfLines={1}>
                        {translation}
                      </Text>
                    )}
                    {!!lessonTitle && (
                      <Text style={[styles.itemMeta, { color: theme.colors.mutedText }]} numberOfLines={1}>
                        {lessonTitle}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.lg,
  },
  headerCard: {
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
  listSection: {
    gap: baseTheme.spacing.xs,
  },
  listTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 18,
  },
  listSubtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
  },
  list: {
    marginTop: baseTheme.spacing.sm,
    gap: baseTheme.spacing.sm,
  },
  item: {
    borderWidth: 1,
    borderRadius: 16,
    padding: baseTheme.spacing.md,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  itemPhrase: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 15,
  },
  itemTranslation: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
  },
  itemMeta: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 12,
    marginTop: 2,
  },
});
