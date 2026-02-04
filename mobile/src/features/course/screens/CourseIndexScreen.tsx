import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui';
import {
  ModuleCard,
  SectionHeader,
  SearchField,
  FilterChips,
  CourseIndexLoadingState,
  CourseIndexEmptyState,
  CourseIndexErrorState,
} from '@/features/course/components';
import { getCachedModules } from '@/services/api/learn-screen-cache';
import { getModules, type Module } from '@/services/api/modules';
import { theme as baseTheme } from '@/services/theme/tokens';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { useAsyncData } from '@/hooks/useAsyncData';

function groupModulesByCategory(
  modules: Module[],
): { category: string; modules: Module[] }[] {
  const byCategory = new Map<string, Module[]>();
  for (const m of modules) {
    const key = m.category?.trim() || 'Other';
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(m);
  }
  return Array.from(byCategory.entries()).map(([category, mods]) => ({
    category,
    modules: mods,
  }));
}

function filterModulesBySearch(modules: Module[], query: string): Module[] {
  const q = query.trim().toLowerCase();
  if (!q) return modules;
  return modules.filter(
    (m) =>
      (m.title ?? '').toLowerCase().includes(q) ||
      (m.description ?? '').toLowerCase().includes(q),
  );
}

export default function CourseIndex() {
  const { theme } = useAppTheme();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const { data: modules, loading, error, reload } = useAsyncData<Module[]>(
    'CourseIndexScreen',
    async () => {
      const cached = getCachedModules();
      if (cached) {
        getModules().catch(() => {});
        return cached;
      }
      return await getModules();
    },
    [],
  );

  const filteredBySearch = useMemo(
    () => filterModulesBySearch(modules ?? [], searchQuery),
    [modules, searchQuery],
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    (modules ?? []).forEach((m) =>
      set.add(m.category?.trim() || 'Other'),
    );
    return ['All', ...Array.from(set)];
  }, [modules]);

  const filteredByCategory =
    filterCategory === 'All'
      ? filteredBySearch
      : filteredBySearch.filter(
          (m) => (m.category?.trim() || 'Other') === filterCategory,
        );

  const groups = useMemo(
    () => groupModulesByCategory(filteredByCategory),
    [filteredByCategory],
  );

  const handleBack = useCallback(() => {
    if (returnTo) {
      router.replace(returnTo);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/learn');
    }
  }, [returnTo]);

  const showEmpty =
    (modules?.length ?? 0) === 0 ||
    (filteredByCategory.length === 0 && (modules?.length ?? 0) > 0);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header - matches Figma: back, title, subtitle, search, filters */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <IconButton
            accessibilityLabel="Back"
            onPress={handleBack}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </IconButton>
          <View style={styles.headerTitles}>
            <Text style={[styles.screenTitle, { color: theme.colors.text }]}>
              Courses
            </Text>
            <Text
              style={[styles.screenSubtitle, { color: theme.colors.mutedText }]}
            >
              Choose a module to start learning
            </Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <SearchField
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search modules"
          />
        </View>

        <FilterChips
          options={categories}
          selected={filterCategory}
          onSelect={setFilterCategory}
        />
      </View>

      {/* Content */}
      {loading ? (
        <CourseIndexLoadingState />
      ) : error && !modules ? (
        <CourseIndexErrorState onRetry={() => reload()} />
      ) : showEmpty ? (
        <CourseIndexEmptyState
          onClearSearch={
            searchQuery.trim()
              ? () => {
                  setSearchQuery('');
                }
              : undefined
          }
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {groups.map(({ category, modules: categoryModules }) => (
            <View key={category} style={styles.section}>
              <SectionHeader title={category} />
              <View style={styles.cardList}>
                {categoryModules.map((module) => (
                  <ModuleCard
                    key={module.id}
                    title={module.title}
                    description={module.description ?? ''}
                    imageUrl={module.imageUrl ?? ''}
                    onPress={() => router.push({
                      pathname: `/course/${module.id}`,
                      params: { returnTo: returnTo ?? '/(tabs)/learn' },
                    })}
                    accessibilityLabel={`${module.title}. ${module.description ?? ''}. Opens course.`}
                    style={styles.cardSpacing}
                  />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: baseTheme.spacing.lg,
    paddingTop: baseTheme.spacing.sm,
    paddingBottom: baseTheme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  backBtn: {
    marginLeft: -4,
  },
  headerTitles: {
    flex: 1,
  },
  screenTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 24,
    lineHeight: 28,
  },
  screenSubtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    lineHeight: 18,
    marginTop: 2,
  },
  searchWrap: {
    marginBottom: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: baseTheme.spacing.lg,
    paddingTop: baseTheme.spacing.md,
    paddingBottom: baseTheme.spacing.xl * 2,
  },
  section: {
    marginBottom: baseTheme.spacing.md,
  },
  cardList: {
    marginBottom: 0,
  },
  cardSpacing: {
    marginBottom: 12,
  },
});
