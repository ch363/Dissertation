import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScrollView } from '@/components/ui';

import { getMyProfile, getRecentActivity, getDashboard, getStats } from '@/services/api/profile';
import { WelcomeContinueCard } from '@/features/home/components/WelcomeContinueCard';
import { DueTodayGrid } from '@/features/home/components/due-today/DueTodayGrid';
import type { DueTodayTileItem } from '@/features/home/components/due-today/DueTodayTile';
import { PickPathList } from '@/features/home/components/pick-path/PickPathList';
import { routes } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import { getUserLessons, type UserLessonProgress } from '@/services/api/progress';
import { getLessons, getModules, type Lesson, type Module } from '@/services/api/modules';
import { makeSessionId } from '@/features/session/sessionBuilder';
import { routeBuilders } from '@/services/navigation/routes';

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<UserLessonProgress[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [streakDays, setStreakDays] = useState<number>(0);
  const [minutesToday, setMinutesToday] = useState<number>(0);
  const [dueTodayItems, setDueTodayItems] = useState<DueTodayTileItem[]>([]);
  const [pickPaths, setPickPaths] = useState<DueTodayTileItem[]>([]);

  const [continueLesson, setContinueLesson] = useState<{
    lessonTitle: string;
    lessonProgress: string;
    estTime: string;
    onContinue: () => void;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [profile, progressData, lessonsData, modulesData, dashboardData, statsData, recentActivity] = await Promise.all([
        getMyProfile().catch(() => null),
        getUserLessons().catch(() => [] as UserLessonProgress[]),
        getLessons().catch(() => [] as Lesson[]),
        getModules().catch(() => [] as Module[]),
        getDashboard().catch(() => ({ streak: 0, dueReviewCount: 0, activeLessonCount: 0, xpTotal: 0 })),
        getStats().catch(() => ({ minutesToday: 0 })),
        getRecentActivity().catch(() => null),
      ]);
      
      if (profile) {
        const name = profile?.name?.trim();
        if (name) setDisplayName(name);
      }
      setUserProgress(progressData);
      setLessons(lessonsData);
      setModules(modulesData);
      setStreakDays(dashboardData.streak || 0);
      setMinutesToday(statsData.minutesToday || 0);

      // Set continue lesson if there's a partially completed lesson
      if (recentActivity?.recentLesson) {
        const recent = recentActivity.recentLesson;
        const totalTeachings = recent.totalTeachings ?? (recent.completedTeachings || 1);
        
        // Only show if lesson is partially completed
        if (recent.completedTeachings < totalTeachings) {
          const progressLabel = `${recent.completedTeachings}/${totalTeachings} complete`;
          
          // Estimate time based on remaining teachings (assuming ~2 min per teaching)
          const remainingTeachings = totalTeachings - recent.completedTeachings;
          const minutesAway = Math.max(1, Math.ceil(remainingTeachings * 2));
          
          const sessionId = makeSessionId('learn');
          setContinueLesson({
            lessonTitle: recent.lesson.title,
            lessonProgress: progressLabel,
            estTime: `${minutesAway} min`,
            onContinue: () => {
              router.push({
                pathname: routeBuilders.sessionDetail(sessionId),
                params: { lessonId: recent.lesson.id, kind: 'learn' },
              });
            },
          });
        } else {
          setContinueLesson(null);
        }
      } else {
        setContinueLesson(null);
      }
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

  // Helper function to get icon for module
  const getModuleIcon = (title: string): keyof typeof Ionicons.glyphMap => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('basic')) return 'star';
    if (titleLower.includes('travel')) return 'airplane';
    if (titleLower.includes('food')) return 'restaurant';
    if (titleLower.includes('work')) return 'briefcase';
    return 'book';
  };

  // Helper function to generate slug from module title
  const getSlugFromTitle = (title: string): string => {
    return title.toLowerCase().replace(/\s+/g, '-');
  };

  // Calculate module completion status
  const calculateModuleCompletion = useCallback(() => {
    // Create a map of module ID to lessons in that module
    const lessonsByModuleId = new Map<string, Lesson[]>();
    lessons.forEach((lesson) => {
      const existing = lessonsByModuleId.get(lesson.moduleId) || [];
      existing.push(lesson);
      lessonsByModuleId.set(lesson.moduleId, existing);
    });

    // Create a map of lesson ID to progress
    const progressByLessonId = new Map<string, UserLessonProgress>();
    userProgress.forEach((progress) => {
      progressByLessonId.set(progress.lesson.id, progress);
    });

    // Calculate completion for each module
    const moduleCompletion = new Map<string, { completed: boolean; lessonCount: number }>();
    modules.forEach((module) => {
      const moduleLessons = lessonsByModuleId.get(module.id) || [];
      let completedLessons = 0;
      
      moduleLessons.forEach((lesson) => {
        const progress = progressByLessonId.get(lesson.id);
        if (progress && progress.completedTeachings >= progress.totalTeachings) {
          completedLessons++;
        }
      });

      moduleCompletion.set(module.id, {
        completed: moduleLessons.length > 0 && completedLessons === moduleLessons.length,
        lessonCount: moduleLessons.length,
      });
    });

    return moduleCompletion;
  }, [modules, lessons, userProgress]);

  // Build dynamic module lists
  useEffect(() => {
    if (modules.length === 0) {
      setDueTodayItems([]);
      setPickPaths([]);
      return;
    }

    const moduleCompletion = calculateModuleCompletion();
    
    // Sort modules by creation date
    const sortedModules = [...modules].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Build pick paths - all modules are unlocked
    const paths: DueTodayTileItem[] = sortedModules.map((module) => {
      const completion = moduleCompletion.get(module.id);
      const isCompleted = completion?.completed || false;
      const lessonCount = completion?.lessonCount || 0;

      // Calculate ETA: estimate 2 minutes per lesson
      const estimatedMinutes = Math.max(1, Math.ceil(lessonCount * 2));
      const eta = lessonCount > 0 ? `≈${estimatedMinutes} min` : '≈1 min';

      return {
        title: module.title,
        lessons: lessonCount > 0 ? `${lessonCount} ${lessonCount === 1 ? 'lesson' : 'lessons'}` : '0 lessons',
        eta,
        icon: getModuleIcon(module.title),
        locked: false,
        completed: isCompleted,
        route: routeBuilders.courseDetail(getSlugFromTitle(module.title)),
      };
    });

    setPickPaths(paths);

    // Build due today items: modules with due reviews or incomplete lessons
    const dueItems: DueTodayTileItem[] = [];
    sortedModules.forEach((module) => {
      const completion = moduleCompletion.get(module.id);
      const moduleLessons = lessons.filter((l) => l.moduleId === module.id);
      
      // Check if module has due reviews or incomplete lessons
      let hasDueReviews = false;
      let hasIncompleteLessons = false;
      
      moduleLessons.forEach((lesson) => {
        const progress = userProgress.find((p) => p.lesson.id === lesson.id);
        if (progress) {
          if (progress.dueReviewCount > 0) {
            hasDueReviews = true;
          }
          if (progress.completedTeachings < progress.totalTeachings) {
            hasIncompleteLessons = true;
          }
        } else {
          // Lesson not started yet
          hasIncompleteLessons = true;
        }
      });

      if (hasDueReviews || hasIncompleteLessons) {
        const lessonCount = completion?.lessonCount || 0;
        const estimatedMinutes = Math.max(1, Math.ceil(lessonCount * 2));
        const eta = lessonCount > 0 ? `≈${estimatedMinutes} min` : '≈1 min';

        dueItems.push({
          title: module.title,
          lessons: lessonCount > 0 ? `${lessonCount} ${lessonCount === 1 ? 'lesson' : 'lessons'}` : '0 lessons',
          eta,
          icon: getModuleIcon(module.title),
          route: routeBuilders.courseDetail(getSlugFromTitle(module.title)),
        });
      }
    });

    // Limit to first 2 for "due today" section
    setDueTodayItems(dueItems.slice(0, 2));
  }, [modules, lessons, userProgress, calculateModuleCompletion]);

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
          streakDays={streakDays}
          minutesToday={minutesToday}
          displayName={displayName}
          lesson={continueLesson}
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
