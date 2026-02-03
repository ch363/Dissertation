import { Stack, router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button, LoadingScreen, StaticCard } from '@/components/ui';
import { makeSessionId } from '@/features/session/sessionBuilder';
import { routeBuilders, routes } from '@/services/navigation/routes';
import { theme } from '@/services/theme/tokens';
import { getLesson, getLessonTeachings, type Lesson } from '@/services/api/modules';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { useAsyncData } from '@/hooks/useAsyncData';

export default function LessonStartScreen() {
  const params = useLocalSearchParams<{ lessonId?: string }>();
  const lessonId = (params.lessonId as string | undefined) ?? 'demo';
  const { theme } = useAppTheme();
  
  const { data, loading, error } = useAsyncData<{ lesson: Lesson; cardCount: number }>(
    'LessonStartScreen',
    async () => {
      if (!lessonId || lessonId === 'demo') {
        throw new Error('Invalid lesson ID');
      }
      const [lessonData, teachingsData] = await Promise.all([
        getLesson(lessonId),
        getLessonTeachings(lessonId).catch(() => []),
      ]);
      return { lesson: lessonData, cardCount: teachingsData.length };
    },
    [lessonId],
    { skip: !lessonId || lessonId === 'demo' }
  );

  const lesson = data?.lesson ?? null;
  const cardCount = data?.cardCount ?? 0;

  const sessionId = makeSessionId('learn');

  const handleStart = () => {
    router.push({
      pathname: routeBuilders.sessionDetail(sessionId),
      params: { lessonId, kind: 'learn', returnTo: routes.tabs.learn },
    });
  };

  const handleBackToLearn = () => {
    // Hard guarantee: never trap the user on a deep learn route.
    router.replace(routes.tabs.learn);
  };

  const handleExitPress = () => {
    Alert.alert(
      'Leave lesson?',
      'You haven’t started the session yet. Go back to learn?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => router.replace(routes.tabs.learn),
        },
      ]
    );
  };

  if (loading) {
    return (
      <LoadingScreen
        title="Loading lesson..."
        subtitle="Please wait while we load your exercises."
      />
    );
  }

  if (error || !lesson) {
    return (
      <SafeAreaView style={styles.safe}>
        <StaticCard style={styles.card}>
          <Text style={[styles.title, { color: theme.colors.error }]}>
            {error || 'Lesson not found'}
          </Text>
        </StaticCard>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header with exit button */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to learn"
          onPress={handleBackToLearn}
          hitSlop={10}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.mutedText} />
        </Pressable>
        <Text style={styles.headerTitle}>Lesson</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Exit"
          onPress={handleExitPress}
          hitSlop={10}
          style={styles.exitButton}
        >
          <Ionicons name="close" size={22} color={theme.colors.mutedText} />
        </Pressable>
      </View>
      
      <StaticCard style={styles.card}>
        <Text style={styles.title}>{lesson.title}</Text>
        <Text style={styles.subtitle}>
          {cardCount} cards • Mix of teach and practice cards
        </Text>
        <Button title="Start session" onPress={handleStart} accessibilityHint="Starts the lesson session" />
      </StaticCard>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.typography.semiBold,
    fontSize: 18,
    color: theme.colors.text,
  },
  exitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  title: {
    fontFamily: theme.typography.semiBold,
    fontSize: 22,
    color: theme.colors.text,
  },
  subtitle: {
    fontFamily: theme.typography.regular,
    color: theme.colors.mutedText,
  },
  primary: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  primaryLabel: {
    color: '#fff',
    fontFamily: theme.typography.semiBold,
  },
});
