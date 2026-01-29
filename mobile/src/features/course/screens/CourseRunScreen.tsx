import { useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { LoadingScreen } from '@/components/ui';

import SessionRunnerScreen from '@/features/session/screens/SessionRunnerScreen';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { getModuleLessons, type Lesson } from '@/services/api/modules';

export const options = { headerShown: false } as const;

/**
 * Wrapper component that maps course slug to the first lesson and uses SessionRunnerScreen
 * This standardizes content delivery across the app - only the card types (fill blank, type, etc.) differ
 */
export default function CourseRun() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { theme } = useAppTheme();
  const [firstLessonId, setFirstLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFirstLesson = async () => {
      if (!slug) {
        setError('Course slug is required');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Assuming slug is a module ID - get first lesson from module
        const lessons = await getModuleLessons(slug);
        if (lessons.length > 0) {
          setFirstLessonId(lessons[0].id);
        } else {
          setError('No lessons found in this course');
        }
      } catch (err: any) {
        console.error('Failed to load course:', err);
        setError(err?.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    loadFirstLesson();
  }, [slug]);

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

  // Use SessionRunnerScreen with the first lesson ID
  // This standardizes the content delivery - the SessionRunner component handles
  // different card types (FillBlank, MultipleChoice, etc.) based on the question data
  return <SessionRunnerScreen lessonId={firstLessonId} kind="learn" />;
}
