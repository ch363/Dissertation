import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import { getLessons, type Lesson } from '@/services/api/modules';
import { getUserLessons, type UserLessonProgress } from '@/services/api/progress';

export default function LessonListScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [userProgress, setUserProgress] = React.useState<UserLessonProgress[]>([]);

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [lessonsData, progressData] = await Promise.all([
          getLessons(),
          getUserLessons().catch(() => [] as UserLessonProgress[]), // Gracefully handle if no progress
        ]);
        setLessons(lessonsData);
        setUserProgress(progressData);
      } catch (err: any) {
        console.error('Failed to load lessons:', err);
        setError(err?.message || 'Failed to load lessons');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
          <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
          {isCompleted ? (
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
          ) : locked ? (
            <Ionicons name="lock-closed" size={16} color={theme.colors.mutedText} />
          ) : null}
        </View>
        {item.description ? (
          <Text style={[styles.subtitle, { color: theme.colors.mutedText }]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: theme.colors.mutedText }]}>
            {progress
              ? `${progress.completedTeachings}/${progress.totalTeachings} completed`
              : `${item.numberOfItems} items`}
          </Text>
          {!locked ? (
            <Ionicons name="chevron-forward" size={16} color={theme.colors.mutedText} />
          ) : (
            <Text style={[styles.meta, { color: theme.colors.mutedText }]}>Locked</Text>
          )}
        </View>
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
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: baseTheme.spacing.xs,
  },
  meta: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 12,
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
