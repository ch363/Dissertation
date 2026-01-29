import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton, LoadingScreen } from '@/components/ui';
import { getCachedModules } from '@/services/api/learn-screen-cache';
import { getModules, type Module } from '@/services/api/modules';
import { theme } from '@/services/theme/tokens';
import { useAppTheme } from '@/services/theme/ThemeProvider';

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
  const { theme: appTheme } = useAppTheme();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => groupModulesByCategory(modules), [modules]);
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  useEffect(() => {
    const loadModules = async () => {
      setError(null);
      const cached = getCachedModules();
      if (cached) {
        setModules(cached);
        setLoading(false);
        // Refresh in background for next time
        getModules()
          .then(setModules)
          .catch(() => {});
        return;
      }
      setLoading(true);
      try {
        const modulesData = await getModules();
        setModules(modulesData);
      } catch (err: any) {
        console.error('Failed to load modules:', err);
        setError(err?.message || 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    loadModules();
  }, []);

  if (loading) {
    return (
      <LoadingScreen
        title="Loading modules..."
        subtitle="Please wait while we load your courses."
      />
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: appTheme.colors.background }]}>
        <Text style={[styles.errorText, { color: appTheme.colors.error }]}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appTheme.colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: appTheme.colors.border }]}>
        <IconButton
          accessibilityLabel="Back"
          onPress={handleBack}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={appTheme.colors.text} />
        </IconButton>
        <Text style={[styles.screenTitle, { color: appTheme.colors.text }]}>Courses</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      {modules.length === 0 ? (
        <Text style={[styles.emptyText, { color: appTheme.colors.mutedText }]}>
          No courses available
        </Text>
      ) : (
        groups.map(({ category, modules: categoryModules }) => (
          <View key={category} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: appTheme.colors.mutedText }]}>
              {category}
            </Text>
            {categoryModules.map((module) => (
              <Pressable
                key={module.id}
                style={[styles.card, { backgroundColor: appTheme.colors.card }]}
                onPress={() => router.push(`/course/${module.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`${module.title}. ${module.description ?? ''}`}
              >
                <View style={styles.cardImageWrap}>
                  <Image
                    source={{ uri: module.imageUrl || PLACEHOLDER_IMAGE }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.cardTitle, { color: appTheme.colors.text }]} numberOfLines={1}>
                    {module.title}
                  </Text>
                  {module.description ? (
                    <Text
                      style={[styles.cardDescription, { color: appTheme.colors.mutedText }]}
                      numberOfLines={2}
                    >
                      {module.description}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
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
  card: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardImageWrap: {
    height: 120,
    width: '100%',
    backgroundColor: '#E2E8F0',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardBody: {
    padding: theme.spacing.md,
  },
  cardTitle: {
    fontFamily: theme.typography.bold,
    fontSize: 18,
    marginBottom: 4,
  },
  cardDescription: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    lineHeight: 20,
  },
});
