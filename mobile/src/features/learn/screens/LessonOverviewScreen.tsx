import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { LoadingScreen, ScrollView } from '@/components/ui';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import { getLesson, getLessonTeachings, type Lesson, type Teaching } from '@/services/api/modules';
import { routes } from '@/services/navigation/routes';

export default function LessonOverviewScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId?: string }>();
  const { theme } = useAppTheme();
  const router = useRouter();

  const [lesson, setLesson] = React.useState<Lesson | null>(null);
  const [teachings, setTeachings] = React.useState<Teaching[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadLesson = async () => {
      if (!lessonId) {
        setError('Lesson ID is required');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const [lessonData, teachingsData] = await Promise.all([
          getLesson(lessonId),
          getLessonTeachings(lessonId).catch(() => [] as Teaching[]),
        ]);
        setLesson(lessonData);
        setTeachings(teachingsData);
      } catch (err: any) {
        console.error('Failed to load lesson:', err);
        setError(err?.message || 'Failed to load lesson');
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [lessonId]);

  const locked = false; // Remove locking for now

  const handleStart = () => {
    if (!lessonId) return;
    // TODO: Replace with new API business layer navigation
    router.push(`/(tabs)/learn/${lessonId}/start`);
  };

  const handleHomePress = () => {
    // Dismiss all modals/stacks to reveal the home screen underneath
    router.dismissAll();
    // Navigate to home - this will slide the current screen right, revealing home underneath
    // Using navigate instead of replace to get the stack animation
    router.navigate(routes.tabs.home);
  };

  if (loading) {
    return (
      <LoadingScreen
        title="Loading lesson..."
        subtitle="Please wait while we load this lesson."
      />
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
      {/* Header with home button */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={[styles.headerTitle, { color: theme.colors.text }]} accessibilityRole="header">
          Lesson
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Home"
          onPress={handleHomePress}
          hitSlop={10}
          style={styles.homeButton}
        >
          <Ionicons name="home" size={22} color={theme.colors.mutedText} accessible={false} importantForAccessibility="no" />
        </Pressable>
      </View>
      
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

        {teachings.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              What you&apos;ll learn
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.mutedText }]}>
              {teachings.length} phrase{teachings.length !== 1 ? 's' : ''} to master
            </Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={locked ? 'Start lesson, locked' : 'Start lesson'}
          accessibilityHint={locked ? 'Complete the previous lesson to unlock' : 'Starts this lesson'}
          accessibilityState={{ disabled: locked }}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: baseTheme.spacing.lg,
    paddingTop: baseTheme.spacing.md,
    paddingBottom: baseTheme.spacing.sm,
  },
  headerSpacer: {
    width: 36,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 18,
  },
  homeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
