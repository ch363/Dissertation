import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import { getLessons, getLessonTeachings, type Lesson } from '@/services/api/modules';
import { getUserLessons, type UserLessonProgress } from '@/services/api/progress';
import { LessonMicroProgress } from '@/components/learn/LessonMicroProgress';
import { buildLessonOutcome } from '@/features/learn/utils/lessonOutcome';

export default function LessonListScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [userProgress, setUserProgress] = React.useState<UserLessonProgress[]>([]);
  const [lessonOutcomes, setLessonOutcomes] = React.useState<Record<string, string>>({});
  const outcomeRequestsRef = React.useRef(new Set<string>());

  const preloadLessonOutcomes = useCallback(async (lessonsData: Lesson[]) => {
    const missing = lessonsData
      .map((l) => l.id)
      .filter((id) => !lessonOutcomes[id] && !outcomeRequestsRef.current.has(id))
      .slice(0, 25);

    if (missing.length === 0) return;

    missing.forEach((id) => outcomeRequestsRef.current.add(id));

    const results = await Promise.allSettled(
      missing.map(async (lessonId) => {
        const teachings = await getLessonTeachings(lessonId).catch(() => []);
        const outcome = buildLessonOutcome(teachings);
        return outcome ? { lessonId, outcome } : null;
      }),
    );

    setLessonOutcomes((prev) => {
      const next = { ...prev };
      for (const r of results) {
        if (r.status !== 'fulfilled') continue;
        const v = r.value;
        if (!v) continue;
        next[v.lessonId] = v.outcome;
      }
      return next;
    });

    missing.forEach((id) => outcomeRequestsRef.current.delete(id));
  }, [lessonOutcomes]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lessonsData, progressData] = await Promise.all([
        getLessons(),
        getUserLessons().catch(() => [] as UserLessonProgress[]), // Gracefully handle if no progress
      ]);
      setLessons(lessonsData);
      setUserProgress(progressData);
      // Best-effort: populate motivating “what you'll learn” lines for cards.
      void preloadLessonOutcomes(lessonsData);
    } catch (err: any) {
      console.error('Failed to load lessons:', err);
      setError(err?.message || 'Failed to load lessons');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh data when screen comes into focus (e.g., returning from a session)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const completedLessonIds = React.useMemo(() => {
    return new Set(
      userProgress
        .filter((p) => p.completedTeachings >= p.totalTeachings && p.totalTeachings > 0)
        .map((p) => p.lesson.id),
    );
  }, [userProgress]);

  const renderItem = ({ item }: { item: Lesson }) => {
    const progress = userProgress.find((p) => p.lesson.id === item.id);
    const isCompleted = completedLessonIds.has(item.id);
    const locked = false; // Remove locking logic for now - can be re-implemented if needed
    const total = progress?.totalTeachings ?? item.numberOfItems ?? 0;
    const completed = progress?.completedTeachings ?? 0;
    const preview = lessonOutcomes[item.id] ?? item.description ?? null;
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          if (locked) return;
          router.push(`/(tabs)/learn/${item.id}`);
        }}
        disabled={locked}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            opacity: locked ? 0.6 : pressed ? 0.9 : 1,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          {locked ? (
            <Ionicons name="lock-closed" size={16} color={theme.colors.mutedText} />
          ) : (
            <Ionicons name="chevron-forward" size={16} color={theme.colors.mutedText} />
          )}
        </View>

        <View style={styles.progressRow}>
          <LessonMicroProgress completed={completed} total={total} />
          {isCompleted ? (
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
          ) : null}
        </View>

        {preview ? (
          <Text style={[styles.subtitle, { color: theme.colors.mutedText }]} numberOfLines={1}>
            {preview}
          </Text>
        ) : null}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: theme.colors.text }]}>Lessons</Text>
        <Text style={[styles.screenSubtitle, { color: theme.colors.mutedText }]}>
          CEFR A1 pathway
        </Text>
      </View>
      {loading ? (
        <View style={styles.stateRow}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={[styles.stateText, { color: theme.colors.mutedText }]}>Loading…</Text>
        </View>
      ) : error ? (
        <View style={styles.stateRow}>
          <Text style={[styles.stateText, { color: theme.colors.error }]}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={lessons}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: baseTheme.spacing.lg, gap: baseTheme.spacing.md }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: baseTheme.spacing.lg,
    paddingTop: baseTheme.spacing.lg,
    paddingBottom: baseTheme.spacing.sm,
    gap: 4,
  },
  screenTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 24,
  },
  screenSubtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: baseTheme.spacing.md,
    gap: baseTheme.spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
    flexShrink: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
  },
  stateRow: {
    padding: baseTheme.spacing.lg,
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
  },
  stateText: {
    fontFamily: baseTheme.typography.regular,
  },
});
