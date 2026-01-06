import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { HomeHeader } from '@/components/home/HomeHeader';
import { DueTodayGrid } from '@/components/home/due-today/DueTodayGrid';
import type { DueTodayTileItem } from '@/components/home/due-today/DueTodayTile';
import { PickPathList } from '@/components/home/pick-path/PickPathList';
import { WelcomeContinueCard } from '@/components/home/WelcomeContinueCard';
import { getMyProfile } from '@/lib/profile';
import { useAppTheme } from '@/providers/ThemeProvider';
import { theme as baseTheme } from '@/theme';

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState<string | null>(null);

  const dueTodayItems: DueTodayTileItem[] = [
    { title: 'Basics', lessons: '8 lessons', eta: '≈2 min', icon: 'star', route: '/course/basics' },
    { title: 'Travel', lessons: '4 lessons', eta: '≈1 min', icon: 'play', route: '/course/travel' },
  ];

  const pickPaths = [
    { title: 'Basics', lessons: '8 lessons', locked: false, route: '/course/basics' },
    {
      title: 'Travel',
      lessons: '4 lessons',
      locked: true,
      lockCopy: 'Complete Basics to unlock',
      route: '/course/travel',
    },
  ];

  useEffect(() => {
    (async () => {
      try {
        const profile = await getMyProfile();
        const name = profile?.name?.trim();
        if (name) setDisplayName(name);
      } catch {
        setDisplayName(null);
      }
    })();
  }, []);

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
        <HomeHeader onPressSettings={() => router.push('/nav-bar/settings')} />

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
          onPressTile={(routePath) => router.push(routePath)}
          onPressMore={() => router.push('/course')}
        />

        <PickPathList
          items={pickPaths}
          onPressItem={(routePath) => router.push(routePath)}
          headerLabel="Pick a path"
        />

        {/* Spacer to avoid overlap with tab bar wave */}
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

