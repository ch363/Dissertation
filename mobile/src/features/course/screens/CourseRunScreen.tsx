import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View, Text } from 'react-native';

import { LoadingScreen } from '@/components/ui';
import SessionRunnerScreen from '@/features/session/screens/SessionRunnerScreen';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getModuleLessons } from '@/services/api/modules';
import { useAppTheme } from '@/services/theme/ThemeProvider';

export const options = { headerShown: false } as const;

export default function CourseRun() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { theme } = useAppTheme();

  const {
    data: firstLessonId,
    loading,
    error,
  } = useAsyncData<string>(
    'CourseRunScreen',
    async () => {
      if (!slug) {
        throw new Error('Course slug is required');
      }
      const lessons = await getModuleLessons(slug);
      if (lessons.length === 0) {
        throw new Error('No lessons found in this course');
      }
      return lessons[0].id;
    },
    [slug],
  );

  if (loading) {
    return (
      <LoadingScreen
        title="Loading course..."
        subtitle="Please wait while we load your first lesson."
        safeArea={false}
      />
    );
  }

  if (error || !firstLessonId) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ color: theme.colors.error, textAlign: 'center' }}>
          {error || 'Course functionality requires new API implementation'}
        </Text>
      </View>
    );
  }

  return <SessionRunnerScreen lessonId={firstLessonId} kind="learn" />;
}
