import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton, LoadingScreen, TappableCard } from '@/components/ui';
import { getCachedModules } from '@/services/api/learn-screen-cache';
import { getModules, type Module } from '@/services/api/modules';
import { theme } from '@/services/theme/tokens';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { useAsyncData } from '@/hooks/useAsyncData';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1596247290824-e9f12b8c574f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400';

function groupModulesByCategory(modules: Module[]): { category: string; modules: Module[] }[] {
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

export default function CourseIndex() {
  const { theme } = useAppTheme();
  
  const { data: modules, loading, error } = useAsyncData<Module[]>(
    'CourseIndexScreen',
    async () => {
      const cached = getCachedModules();
      if (cached) {
        // Refresh in background for next time
        getModules().catch(() => {});
        return cached;
      }
      return await getModules();
    },
    []
  );

  const groups = useMemo(() => groupModulesByCategory(modules ?? []), [modules]);
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  if (loading) {
    return (
      <LoadingScreen
        title="Loading modules..."
        subtitle="Please wait while we load your courses."
      />
    );
  }

  if (error && !modules) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <IconButton
          accessibilityLabel="Back"
          onPress={handleBack}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </IconButton>
        <Text style={[styles.screenTitle, { color: theme.colors.text }]}>Courses</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      {(modules?.length ?? 0) === 0 ? (
        <Text style={[styles.emptyText, { color: theme.colors.mutedText }]}>
          No courses available
        </Text>
      ) : (
        groups.map(({ category, modules: categoryModules }) => (
          <View key={category} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.mutedText }]}>
              {category}
            </Text>
            {categoryModules.map((module) => (
              <TappableCard
                key={module.id}
                title={module.title}
                subtitle={module.description ?? undefined}
                leftIcon={
                  <View style={styles.cardImageWrap}>
                    <Image
                      source={{ uri: module.imageUrl || PLACEHOLDER_IMAGE }}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                  </View>
                }
                onPress={() => router.push(`/course/${module.id}`)}
                accessibilityLabel={`${module.title}. ${module.description ?? ''}`}
                accessibilityHint="Opens course"
                style={styles.cardSpacing}
              />
            ))}
          </View>
        ))
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { marginRight: 8 },
  screenTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: 18,
  },
  headerSpacer: { width: 36, height: 36 },
  scroll: { flex: 1 },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  errorText: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  cardSpacing: {
    marginBottom: theme.spacing.md,
  },
  cardImageWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: theme.colors.border,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
});
