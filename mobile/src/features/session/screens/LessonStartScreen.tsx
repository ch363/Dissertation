import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { makeSessionId } from '@/features/session/sessionBuilder';
import { routeBuilders, routes } from '@/services/navigation/routes';
import { theme } from '@/services/theme/tokens';
import { getLesson, getLessonTeachings, type Lesson } from '@/services/api/modules';
import { useAppTheme } from '@/services/theme/ThemeProvider';

export default function LessonStartScreen() {
  const params = useLocalSearchParams<{ lessonId?: string }>();
  const lessonId = (params.lessonId as string | undefined) ?? 'demo';
  const { theme: appTheme } = useAppTheme();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [cardCount, setCardCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLesson = async () => {
      if (!lessonId || lessonId === 'demo') {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const [lessonData, teachingsData] = await Promise.all([
          getLesson(lessonId),
          getLessonTeachings(lessonId).catch(() => []),
        ]);
        setLesson(lessonData);
        setCardCount(teachingsData.length);
      } catch (err: any) {
        console.error('Failed to load lesson:', err);
        setError(err?.message || 'Failed to load lesson');
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [lessonId]);

  const sessionId = makeSessionId('learn');

  const handleStart = () => {
    router.push({
      pathname: routeBuilders.sessionDetail(sessionId),
      params: { lessonId, kind: 'learn' },
    });
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
      <SafeAreaView style={styles.safe}>
        <View style={styles.card}>
          <ActivityIndicator color={appTheme.colors.primary} />
          <Text style={styles.subtitle}>Loading lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !lesson) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.card}>
          <Text style={[styles.title, { color: appTheme.colors.error }]}>
            {error || 'Lesson not found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header with home button */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Lesson</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Home"
          onPress={handleHomePress}
          hitSlop={10}
          style={styles.homeButton}
        >
          <Ionicons name="home" size={22} color={appTheme.colors.mutedText} />
        </Pressable>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.title}>{lesson.title}</Text>
        <Text style={styles.subtitle}>
          {cardCount} cards • Mix of teach and practice cards
        </Text>
        <Pressable style={styles.primary} onPress={handleStart}>
          <Text style={styles.primaryLabel}>Start session</Text>
        </Pressable>
      </View>
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
  headerSpacer: {
    width: 36,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.typography.semiBold,
    fontSize: 18,
    color: theme.colors.text,
  },
  homeButton: {
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
