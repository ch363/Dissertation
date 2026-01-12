import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScrollView } from '@/components/ui';

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

  // TODO: Replace with new API business layer
  // All learning API calls have been removed - screens are ready for new implementation

  const [lesson, setLesson] = React.useState<LessonRow | null>(
    lessonId
      ? {
          id: String(lessonId),
          title: 'Lesson overview',
          description: 'Overview placeholder',
          sortOrder: 1,
        }
      : null,
  );
  const [infos, setInfos] = React.useState<InfoRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const highestCompletedOrder = 1; // simple stub gating (Basics unlocked)

  const orderVal = lesson?.sortOrder ?? lesson?.display_order ?? Number(lesson?.id ?? 0);
  const locked =
    typeof orderVal === 'number' ? orderVal > Math.max(1, highestCompletedOrder) : false;

  const handleStart = () => {
    if (!lessonId) return;
    // TODO: Replace with new API business layer navigation
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

        {infos.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              What you&apos;ll learn
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.mutedText }]}>
              {infos.length} phrase{infos.length !== 1 ? 's' : ''} to master
            </Text>
          </View>
        ) : null}

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
