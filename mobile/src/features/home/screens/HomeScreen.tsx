import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScrollView } from '@/components/ui';

import { getMyProfile } from '@/services/api/profile';
import { WelcomeContinueCard } from '@/features/home/components/WelcomeContinueCard';
import { DueTodayGrid } from '@/features/home/components/due-today/DueTodayGrid';
import type { DueTodayTileItem } from '@/features/home/components/due-today/DueTodayTile';
import { PickPathList } from '@/features/home/components/pick-path/PickPathList';
import { routes } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import { getUserLessons, type UserLessonProgress } from '@/services/api/progress';
import { getLessons, type Lesson } from '@/services/api/modules';

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<UserLessonProgress[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [profile, progressData, lessonsData] = await Promise.all([
        getMyProfile().catch(() => null),
        getUserLessons().catch(() => [] as UserLessonProgress[]),
        getLessons().catch(() => [] as Lesson[]),
      ]);
      
      if (profile) {
        const name = profile?.name?.trim();
        if (name) setDisplayName(name);
      }
      setUserProgress(progressData);
      setLessons(lessonsData);
    } catch (error) {
      console.error('Failed to load home data:', error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh data when screen comes into focus (e.g., returning from a session)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Build due today items
  // Note: Completion status would require module-to-lesson mapping
  // For now, completion is shown on the Learn screen where we have actual lesson data
  const dueTodayItems: DueTodayTileItem[] = [
    { 
      title: 'Basics', 
      lessons: '8 lessons', 
      eta: '≈2 min', 
      icon: 'star', 
      route: '/course/basics',
    },
    { 
      title: 'Travel', 
      lessons: '4 lessons', 
      eta: '≈1 min', 
      icon: 'play', 
      route: '/course/travel',
    },
  ];

  const pickPaths: DueTodayTileItem[] = [
    {
      title: 'Basics',
      lessons: '8 lessons',
      eta: '≈2 min',
      icon: 'star',
      locked: false,
      route: '/course/basics',
    },
    {
      title: 'Travel',
      lessons: '4 lessons',
      eta: '≈1 min',
      icon: 'lock-closed',
      locked: true,
      lockCopy: 'Complete Basics to unlock',
      route: '/course/travel',
    },
  ];

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.safeArea]}>
      <View
        style={[
          styles.topBackdrop,
          {
            backgroundColor: '#EAF2FF',
            shadowColor: theme.colors.text,
          },
        ]}
        pointerEvents="none"
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <WelcomeContinueCard
          streakDays={4}
          minutesToday={22}
          lessonTitle="Basic Greetings"
          lessonProgress="Lesson 1 of 10"
          estTime="4 min"
          displayName={displayName}
          onContinue={() => router.push('/course/basics/run')}
        />

        <DueTodayGrid
          items={dueTodayItems}
          onPressTile={(routePath: string) => router.push(routePath)}
          onPressMore={() => router.push('/course')}
        />

        <PickPathList
          items={pickPaths}
          onPressItem={(routePath: string) => router.push(routePath)}
          headerLabel="Pick a path"
        />

        {/* Spacer to avoid overlap with the tab bar */}
        <View style={{ height: baseTheme.spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 4,
  },
  scrollContent: {
    paddingHorizontal: baseTheme.spacing.md,
    gap: baseTheme.spacing.md,
  },
});
