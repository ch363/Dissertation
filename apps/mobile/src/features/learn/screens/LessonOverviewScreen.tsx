import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

type InfoRow = {
  id: string;
  prompt?: string | null;
  media_url?: string | null;
  media_id?: string | null;
};

export default function LessonOverviewScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId?: string }>();
  const { theme } = useAppTheme();
  const router = useRouter();

  const [lesson, setLesson] = React.useState<LessonRow | null>(null);
  const [infos, setInfos] = React.useState<InfoRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [prefetching, setPrefetching] = React.useState(false);

  const highestCompletedOrder = 1; // simple stub gating (Basics unlocked)

  React.useEffect(() => {
    if (!lessonId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = getSupabaseClient();
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('id,title,name,description,display_order')
          .eq('id', lessonId)
          .maybeSingle();
        if (lessonError) throw lessonError;

        const { data: infoData, error: infoError } = await supabase
          .from('questions')
          .select('id,prompt,media_url,media_id')
          .eq('lesson_id', lessonId)
          .eq('type', 'info');
        if (infoError) throw infoError;

        if (!cancelled) {
          setLesson(
            lessonData
              ? {
                  id: lessonData.id,
                  title: lessonData.title ?? lessonData.name ?? 'Lesson overview',
                  description: lessonData.description,
                  sortOrder: lessonData.display_order ?? lessonData.id,
                  display_order: lessonData.display_order,
                }
              : {
                  id: String(lessonId),
                  title: 'Lesson overview',
                  description: 'Overview placeholder',
                  sortOrder: 1,
                },
          );
          setInfos(infoData ?? []);
        }

        // Prefetch any image media URLs
        const mediaUrls: string[] = [];
        (infoData ?? []).forEach((i) => {
          if (i.media_url) mediaUrls.push(i.media_url);
        });
        if (mediaUrls.length) {
          setPrefetching(true);
          await Promise.all(mediaUrls.map((url) => Image.prefetch(url)));
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'Unable to load lesson');
      } finally {
        if (!cancelled) {
          setPrefetching(false);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const orderVal = lesson?.sortOrder ?? lesson?.display_order ?? Number(lesson?.id ?? 0);
  const locked =
    typeof orderVal === 'number' ? orderVal > Math.max(1, highestCompletedOrder) : false;

  const handleStart = () => {
    if (!lessonId) return;
    router.push(`/(tabs)/learn/${lessonId}/start`);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.stateRow}>
          <Text style={[styles.stateText, { color: theme.colors.mutedText }]}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !lesson) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.stateRow}>
          <Text style={[styles.stateText, { color: theme.colors.error }]}>
            {error ?? 'Not found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          padding: baseTheme.spacing.lg,
          paddingBottom: baseTheme.spacing.xl,
          gap: baseTheme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{lesson.title}</Text>
          {lesson.description ? (
            <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
              {lesson.description}
            </Text>
          ) : null}
          {locked ? (
            <View style={styles.lockPill}>
              <Text style={[styles.lockText, { color: theme.colors.mutedText }]}>
                Locked until previous lesson is completed
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            What you&apos;ll learn
          </Text>
          {infos.length ? (
            infos.map((info) => (
              <View key={info.id} style={[styles.card, { borderColor: theme.colors.border }]}>
                {info.prompt ? (
                  <Text style={[styles.infoText, { color: theme.colors.text }]}>{info.prompt}</Text>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={[styles.infoText, { color: theme.colors.mutedText }]}>
              Lesson objectives coming soon.
            </Text>
          )}
          {prefetching ? (
            <Text style={[styles.meta, { color: theme.colors.mutedText }]}>Preloading media…</Text>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={locked ? undefined : handleStart}
          style={[
            styles.startButton,
            {
              backgroundColor: locked ? theme.colors.border : theme.colors.primary,
              borderColor: theme.colors.border,
            },
          ]}
          disabled={locked}
        >
          <Text style={[styles.startLabel, { color: locked ? theme.colors.mutedText : '#fff' }]}>
            {locked ? 'Locked' : 'Start Lesson'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  stateRow: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: baseTheme.spacing.lg,
  },
  stateText: {
    fontFamily: baseTheme.typography.regular,
  },
  hero: {
    gap: baseTheme.spacing.xs,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 24,
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 16,
  },
  lockPill: {
    marginTop: baseTheme.spacing.xs,
    paddingHorizontal: baseTheme.spacing.md,
    paddingVertical: baseTheme.spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: baseTheme.colors.border,
  },
  lockText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 13,
  },
  section: {
    gap: baseTheme.spacing.sm,
  },
  sectionTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 18,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: baseTheme.spacing.md,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  infoText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
  },
  meta: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
  },
  startButton: {
    paddingVertical: baseTheme.spacing.md,
    borderRadius: baseTheme.radius.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  startLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
});
