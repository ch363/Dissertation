import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { FlatList, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingRow, TappableCard } from '@/components/ui';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import { getLessons, getLessonTeachings, type Lesson } from '@/services/api/modules';
import { getUserLessons, type UserLessonProgress } from '@/services/api/progress';
import { LessonMicroProgress } from '@/components/learn/LessonMicroProgress';
import { buildLessonOutcome } from '@/features/learn/utils/lessonOutcome';
import { useAsyncData } from '@/hooks/useAsyncData';

type LessonFilter = 'all' | 'not_started' | 'in_progress' | 'completed';

const FILTER_OPTIONS: Array<{ value: LessonFilter; label: string }> = [
  { value: 'all', label: 'All lessons' },
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

function getStatus(completed: number, total: number): Exclude<LessonFilter, 'all'> {
  if (total <= 0) return 'not_started';
  if (completed >= total) return 'completed';
  if (completed > 0) return 'in_progress';
  return 'not_started';
}

export default function LessonListScreen() {
  const { theme, isDark } = useAppTheme();
  const router = useRouter();
  const [lessonOutcomes, setLessonOutcomes] = React.useState<Record<string, string>>({});
  const outcomeRequestsRef = React.useRef(new Set<string>());
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filter, setFilter] = React.useState<LessonFilter>('all');
  const [filterOpen, setFilterOpen] = React.useState(false);

  const { data, loading, error, reload } = useAsyncData<{
    lessons: Lesson[];
    userProgress: UserLessonProgress[];
  }>(
    'LessonListScreen',
    async () => {
      const [lessonsData, progressData] = await Promise.all([
        getLessons(),
        getUserLessons().catch(() => [] as UserLessonProgress[]),
      ]);
      return { lessons: lessonsData, userProgress: progressData };
    },
    []
  );

  const lessons = data?.lessons ?? [];
  const userProgress = data?.userProgress ?? [];

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

  React.useEffect(() => {
    if (lessons.length > 0) {
      void preloadLessonOutcomes(lessons);
    }
  }, [lessons, preloadLessonOutcomes]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const progressByLessonId = React.useMemo(() => {
    return new Map(userProgress.map((p) => [p.lesson.id, p] as const));
  }, [userProgress]);

  const filteredLessons = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return lessons.filter((lesson) => {
      const progress = progressByLessonId.get(lesson.id);
      const total = progress?.totalTeachings ?? lesson.numberOfItems ?? 0;
      const completed = progress?.completedTeachings ?? 0;
      const status = getStatus(completed, total);

      if (filter !== 'all' && status !== filter) return false;

      if (!q) return true;
      const preview = lessonOutcomes[lesson.id] ?? lesson.description ?? '';
      const haystack = `${lesson.title} ${preview}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [filter, lessonOutcomes, lessons, progressByLessonId, searchQuery]);

  const filterLabel = React.useMemo(() => {
    return FILTER_OPTIONS.find((o) => o.value === filter)?.label ?? 'Filter';
  }, [filter]);

  const hasActiveSearch = searchQuery.trim().length > 0;
  const hasActiveFilter = filter !== 'all';

  const renderItem = ({ item }: { item: Lesson }) => {
    const progress = progressByLessonId.get(item.id);
    const locked = false; // Remove locking logic for now - can be re-implemented if needed
    const total = progress?.totalTeachings ?? item.numberOfItems ?? 0;
    const completed = progress?.completedTeachings ?? 0;
    const status = getStatus(completed, total);
    const isCompleted = status === 'completed';
    const preview = lessonOutcomes[item.id] ?? item.description ?? null;
    const metaRow = (
      <View style={styles.progressRow} accessibilityLabel="Lesson progress">
        <LessonMicroProgress completed={completed} total={total} />
        {isCompleted ? (
          <Ionicons name="checkmark-circle" size={16} color={theme.colors.secondary} accessible={false} importantForAccessibility="no" />
        ) : null}
      </View>
    );
    return (
      <TappableCard
        title={item.title}
        subtitle={preview ?? undefined}
        leftIcon={locked ? 'lock-closed' : undefined}
        metaRow={metaRow}
        onPress={() => {
          if (locked) return;
          router.push(`/(tabs)/learn/${item.id}`);
        }}
        accessibilityLabel={`${item.title}${status === 'completed' ? ', completed' : status === 'in_progress' ? ', in progress' : ''}`}
        accessibilityHint="Opens lesson details"
        style={locked ? styles.cardDisabled : styles.cardSpacing}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View pointerEvents="none" style={styles.backgroundLayer}>
        <View
          style={[
            styles.washBlob,
            {
              backgroundColor: `${theme.colors.primary}${isDark ? '1A' : '12'}`,
            },
          ]}
        />
        <View
          style={[
            styles.washBlobSecondary,
            {
              backgroundColor: `${theme.colors.secondary}${isDark ? '14' : '0F'}`,
            },
          ]}
        />
      </View>
      <View style={styles.controls}>
        <Text style={[styles.pathwayLabel, { color: theme.colors.mutedText }]}>CEFR A1 pathway</Text>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: hasActiveSearch
                ? `${theme.colors.primary}${isDark ? '18' : '0A'}`
                : theme.colors.card,
              borderColor: hasActiveSearch ? `${theme.colors.primary}${isDark ? '55' : '33'}` : theme.colors.border,
            },
          ]}
        >
          <Ionicons name="search" size={16} color={theme.colors.mutedText} accessible={false} importantForAccessibility="no" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search lessons"
            placeholderTextColor={theme.colors.mutedText}
            style={[styles.searchInput, { color: theme.colors.text }]}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="never"
            accessibilityLabel="Search lessons"
          />
          {searchQuery.trim().length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setSearchQuery('')}
              hitSlop={10}
              style={styles.iconButton}
            >
              <Ionicons name="close-circle" size={18} color={theme.colors.mutedText} accessible={false} importantForAccessibility="no" />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.controlRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter lessons"
            onPress={() => setFilterOpen(true)}
            style={({ pressed }) => [
              styles.filterButton,
              {
                backgroundColor: hasActiveFilter
                  ? `${theme.colors.primary}${isDark ? '18' : '0A'}`
                  : theme.colors.card,
                borderColor: hasActiveFilter ? `${theme.colors.primary}${isDark ? '55' : '33'}` : theme.colors.border,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Ionicons
              name="funnel-outline"
              size={16}
              color={hasActiveFilter ? theme.colors.primary : theme.colors.mutedText}
              accessible={false}
              importantForAccessibility="no"
            />
            <Text style={[styles.filterLabel, { color: theme.colors.text }]} numberOfLines={1}>
              {filterLabel}
            </Text>
            <Ionicons name="chevron-down" size={14} color={theme.colors.mutedText} accessible={false} importantForAccessibility="no" />
          </Pressable>

          <Text style={[styles.countText, { color: theme.colors.mutedText }]} numberOfLines={1}>
            {filteredLessons.length} {filteredLessons.length === 1 ? 'lesson' : 'lessons'}
          </Text>
        </View>
      </View>
      {loading ? (
        <LoadingRow label="Loading lessons…" />
      ) : error ? (
        <View style={styles.stateRow}>
          <Text style={[styles.stateText, { color: theme.colors.error }]}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLessons}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: baseTheme.spacing.lg,
            paddingTop: baseTheme.spacing.sm,
            paddingBottom: baseTheme.spacing.xl,
            gap: baseTheme.spacing.md,
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No lessons found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.mutedText }]}>
                Try a different search or filter.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={filterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterOpen(false)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close filter menu"
          style={styles.modalOverlay}
          onPress={() => setFilterOpen(false)}
        >
          <Pressable
            accessibilityRole="menu"
            onPress={() => {}}
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Filter</Text>
            {FILTER_OPTIONS.map((opt) => {
              const selected = opt.value === filter;
              return (
                <Pressable
                  key={opt.value}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter: ${opt.label}`}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setFilter(opt.value);
                    setFilterOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.modalOption,
                    {
                      backgroundColor: selected
                        ? `${theme.colors.primary}${isDark ? '22' : '10'}`
                        : pressed
                          ? theme.colors.border
                          : 'transparent',
                    },
                  ]}
                >
                  <Text style={[styles.modalOptionText, { color: theme.colors.text }]}>{opt.label}</Text>
                  {selected ? (
                    <Ionicons name="checkmark" size={18} color={theme.colors.primary} accessible={false} importantForAccessibility="no" />
                  ) : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  washBlob: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 280,
    height: 280,
    borderRadius: 280 / 2,
    transform: [{ rotate: '18deg' }],
  },
  washBlobSecondary: {
    position: 'absolute',
    top: 80,
    right: -140,
    width: 320,
    height: 320,
    borderRadius: 320 / 2,
    transform: [{ rotate: '-12deg' }],
  },
  controls: {
    paddingHorizontal: baseTheme.spacing.lg,
    paddingTop: baseTheme.spacing.lg,
    paddingBottom: baseTheme.spacing.xs,
    gap: baseTheme.spacing.sm,
  },
  pathwayLabel: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
    borderWidth: 1,
    borderRadius: baseTheme.radius.md,
    paddingHorizontal: baseTheme.spacing.md,
    paddingVertical: Platform.select({ ios: 12, android: 10 }) as number,
  },
  searchInput: {
    flex: 1,
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    paddingVertical: 0,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: baseTheme.spacing.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.xs,
    borderWidth: 1,
    borderRadius: baseTheme.radius.md,
    paddingHorizontal: baseTheme.spacing.md,
    paddingVertical: 10,
    flexShrink: 1,
    maxWidth: '70%',
  },
  filterLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 13,
    flexShrink: 1,
  },
  countText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
  },
  cardSpacing: {
    marginBottom: baseTheme.spacing.sm,
  },
  cardDisabled: {
    opacity: 0.55,
    marginBottom: baseTheme.spacing.sm,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: baseTheme.spacing.md,
    paddingHorizontal: baseTheme.spacing.md,
    gap: baseTheme.spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    ...(Platform.OS === 'android' ? { elevation: 2 } : null),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16.5,
    flexShrink: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13.5,
    lineHeight: 18,
  },
  stateRow: {
    padding: baseTheme.spacing.lg,
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
  },
  stateText: {
    fontFamily: baseTheme.typography.regular,
  },
  emptyState: {
    paddingVertical: baseTheme.spacing.xl,
    alignItems: 'center',
    gap: baseTheme.spacing.xs,
  },
  emptyTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
  emptySubtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    padding: baseTheme.spacing.lg,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: baseTheme.radius.lg,
    padding: baseTheme.spacing.md,
    gap: baseTheme.spacing.xs,
  },
  modalTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 16,
    marginBottom: baseTheme.spacing.xs,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: baseTheme.spacing.sm,
    borderRadius: baseTheme.radius.md,
  },
  modalOptionText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
  },
});
