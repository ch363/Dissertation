import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getSupabaseClient } from '@/app/api/supabase/client';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type LessonRow = {
  id: string;
  title: string;
  name?: string | null;
  description?: string | null;
  display_order?: number | null;
  sortOrder?: number | null;
};

type ProgressState = {
  completedLessonIds: string[];
};

const fallbackLessons: LessonRow[] = [
  {
    id: 'basics',
    title: 'Basics',
    description: 'Greetings & essentials',
    sortOrder: 1,
  },
  {
    id: 'travel',
    title: 'Travel',
    description: 'Travel phrases',
    sortOrder: 2,
  },
];

export default function LessonListScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [lessons, setLessons] = React.useState<LessonRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [progress] = React.useState<ProgressState>({ completedLessonIds: ['basics'] });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = getSupabaseClient();
        const { data, error: fetchError } = await supabase
          .from('lessons')
          .select('id,title,name,description,display_order')
          .order('display_order', { ascending: true });
        if (fetchError) throw fetchError;
        const normalized =
          data?.map((row: any) => ({
            id: row.id,
            title: row.title ?? row.name ?? 'Lesson',
            description: row.description,
            sortOrder: row.display_order ?? row.id,
            display_order: row.display_order,
          })) ?? [];
        if (!cancelled) setLessons(normalized.length ? normalized : fallbackLessons);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? 'Unable to load lessons');
          setLessons(fallbackLessons);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const highestCompletedOrder = React.useMemo(() => {
    if (!lessons.length) return 0;
    const completedOrders = lessons
      .filter((l) => progress.completedLessonIds.includes(l.id))
      .map((l) => {
        const val = l.sortOrder ?? l.display_order ?? Number(l.id);
        return typeof val === 'number' && Number.isFinite(val) ? val : 0;
      });
    return completedOrders.length ? Math.max(...completedOrders) : 0;
  }, [lessons, progress.completedLessonIds]);

  const renderItem = ({ item }: { item: LessonRow }) => {
    const orderRaw = item.sortOrder ?? item.display_order ?? Number(item.id);
    const order = typeof orderRaw === 'number' && Number.isFinite(orderRaw) ? orderRaw : 0;
    const locked = typeof order === 'number' && order > Math.max(1, highestCompletedOrder);
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
          {locked ? <Ionicons name="lock-closed" size={16} color={theme.colors.mutedText} /> : null}
        </View>
        {item.description ? (
          <Text style={[styles.subtitle, { color: theme.colors.mutedText }]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: theme.colors.mutedText }]}>
            {order ? `Lesson ${order}` : 'A1'}
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
