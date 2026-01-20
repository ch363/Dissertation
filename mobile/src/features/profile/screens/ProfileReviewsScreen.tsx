import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ScrollView } from '@/components/ui';
import { Card } from '@/components/profile/Card';
import { Button } from '@/components/ui/Button';
import { getDueReviewsLatest, type DueReviewLatest } from '@/services/api/progress';
import { makeSessionId } from '@/features/session/sessionBuilder';
import { routeBuilders, routes } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type LessonGroup = {
  lessonId: string;
  lessonTitle: string;
  due: DueReviewLatest[];
};

type ModuleGroup = {
  moduleId: string;
  moduleTitle: string;
  lessons: LessonGroup[];
};

function safeTitle(s?: string | null, fallback: string = 'Unknown') {
  const t = (s || '').trim();
  return t.length > 0 ? t : fallback;
}

export default function ProfileReviewsScreen() {
  const { theme } = useAppTheme();
  const [due, setDue] = useState<DueReviewLatest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getDueReviewsLatest();
        if (!cancelled) setDue(data || []);
      } catch (e: any) {
        console.error('Failed to load due reviews:', e);
        if (!cancelled) setError(e?.message || 'Failed to load due reviews');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped: ModuleGroup[] = useMemo(() => {
    const moduleMap = new Map<string, { title: string; lessonMap: Map<string, LessonGroup> }>();

    for (const r of due || []) {
      const lesson = r.question?.teaching?.lesson;
      const module = lesson?.module;

      const moduleId = module?.id || 'unknown-module';
      const moduleTitle = safeTitle(module?.title, 'Unknown module');
      const lessonId = lesson?.id || 'unknown-lesson';
      const lessonTitle = safeTitle(lesson?.title, 'Unknown lesson');

      const existingModule = moduleMap.get(moduleId) || {
        title: moduleTitle,
        lessonMap: new Map<string, LessonGroup>(),
      };

      const existingLesson =
        existingModule.lessonMap.get(lessonId) || { lessonId, lessonTitle, due: [] };

      existingLesson.due.push(r);
      existingModule.lessonMap.set(lessonId, existingLesson);
      moduleMap.set(moduleId, existingModule);
    }

    const modules: ModuleGroup[] = Array.from(moduleMap.entries()).map(([moduleId, v]) => ({
      moduleId,
      moduleTitle: v.title,
      lessons: Array.from(v.lessonMap.values()),
    }));

    // Sort: most due first, then title
    modules.sort((a, b) => {
      const aCount = a.lessons.reduce((sum, l) => sum + l.due.length, 0);
      const bCount = b.lessons.reduce((sum, l) => sum + l.due.length, 0);
      if (bCount !== aCount) return bCount - aCount;
      return a.moduleTitle.localeCompare(b.moduleTitle);
    });
    modules.forEach((m) => {
      m.lessons.sort((a, b) => {
        if (b.due.length !== a.due.length) return b.due.length - a.due.length;
        return a.lessonTitle.localeCompare(b.lessonTitle);
      });
      // Sort due items by due date ascending (earliest first)
      m.lessons.forEach((l) => {
        l.due.sort((x, y) => new Date(x.nextReviewDue).getTime() - new Date(y.nextReviewDue).getTime());
      });
    });

    return modules;
  }, [due]);

  const startReview = (opts: { lessonId?: string; moduleId?: string }) => {
    const sessionId = makeSessionId('review');
    router.push({
      pathname: routeBuilders.sessionDetail(sessionId),
      params: {
        kind: 'review',
        returnTo: routes.tabs.profile.reviews,
        ...(opts.lessonId ? { lessonId: opts.lessonId } : {}),
        ...(opts.moduleId ? { moduleId: opts.moduleId } : {}),
      },
    });
  };

  const totalDue = due?.length || 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Reviews</Text>
        <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
          {loading ? 'Loading due items…' : `${totalDue} due ${totalDue === 1 ? 'item' : 'items'}`}
        </Text>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.mutedText }]}>Loading…</Text>
          </View>
        ) : error ? (
          <Card>
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={20} color={theme.colors.error} />
              <Text style={[styles.errorText, { color: theme.colors.text }]}>{error}</Text>
            </View>
          </Card>
        ) : totalDue === 0 ? (
          <Card>
            <Text style={[styles.emptyText, { color: theme.colors.mutedText }]}>
              No reviews due right now. Check back later!
            </Text>
          </Card>
        ) : (
          <View style={styles.modules}>
            {grouped.map((m) => {
              const moduleDueCount = m.lessons.reduce((sum, l) => sum + l.due.length, 0);
              const moduleIsUnknown = m.moduleId === 'unknown-module';
              return (
                <Card key={m.moduleId} style={styles.moduleCard}>
                  <View style={styles.moduleHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.moduleTitle, { color: theme.colors.text }]}>
                        {m.moduleTitle}
                      </Text>
                      <Text style={[styles.moduleMeta, { color: theme.colors.mutedText }]}>
                        {moduleDueCount} due in {m.lessons.length} {m.lessons.length === 1 ? 'lesson' : 'lessons'}
                      </Text>
                    </View>
                    <Button
                      title="Start module"
                      onPress={() => startReview({ moduleId: moduleIsUnknown ? undefined : m.moduleId })}
                      disabled={moduleIsUnknown}
                      style={styles.moduleButton}
                    />
                  </View>

                  <View style={styles.lessonList}>
                    {m.lessons.map((l) => {
                      const lessonIsUnknown = l.lessonId === 'unknown-lesson';
                      return (
                        <View key={l.lessonId} style={styles.lessonRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.lessonTitle, { color: theme.colors.text }]}>
                              {l.lessonTitle}
                            </Text>
                            <Text style={[styles.lessonMeta, { color: theme.colors.mutedText }]}>
                              {l.due.length} due
                            </Text>

                            {/* Preview a few items */}
                            <View style={styles.previewList}>
                              {l.due.slice(0, 3).map((r) => {
                                const phrase = r.question?.teaching?.learningLanguageString;
                                const translation = r.question?.teaching?.userLanguageString;
                                const label = phrase
                                  ? translation
                                    ? `${phrase} — ${translation}`
                                    : phrase
                                  : `Question ${r.questionId}`;
                                return (
                                  <Text
                                    key={r.id}
                                    style={[styles.previewItem, { color: theme.colors.mutedText }]}
                                    numberOfLines={1}
                                  >
                                    • {label}
                                  </Text>
                                );
                              })}
                            </View>
                          </View>

                          <Button
                            title="Start"
                            onPress={() => startReview({ lessonId: lessonIsUnknown ? undefined : l.lessonId })}
                            disabled={lessonIsUnknown}
                            style={styles.lessonButton}
                          />
                        </View>
                      );
                    })}
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.md,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    marginTop: -baseTheme.spacing.sm,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
    paddingVertical: baseTheme.spacing.md,
  },
  loadingText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
  },
  modules: {
    gap: baseTheme.spacing.lg,
  },
  moduleCard: {
    gap: baseTheme.spacing.md,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.md,
  },
  moduleTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 16,
  },
  moduleMeta: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
    marginTop: 2,
  },
  moduleButton: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  lessonList: {
    gap: baseTheme.spacing.md,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: baseTheme.spacing.md,
  },
  lessonTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 15,
  },
  lessonMeta: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
    marginTop: 1,
  },
  lessonButton: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  previewList: {
    marginTop: baseTheme.spacing.xs,
    gap: 2,
  },
  previewItem: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 12,
  },
  emptyText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: baseTheme.spacing.md,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
  },
  errorText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    flex: 1,
  },
});

