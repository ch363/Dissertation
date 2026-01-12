import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';

import SessionRunnerScreen from '@/features/session/screens/SessionRunnerScreen';
import { useAppTheme } from '@/services/theme/ThemeProvider';

export const options = { headerShown: false } as const;

/**
 * Wrapper component that maps course slug to the first lesson and uses SessionRunnerScreen
 * This standardizes content delivery across the app - only the card types (fill blank, type, etc.) differ
 */
export default function CourseRun() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { theme } = useAppTheme();
  const [firstLessonId, setFirstLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Replace with new API business layer
  // All learning API calls have been removed - screens are ready for new implementation
  // CourseRun needs to fetch the first lesson ID using the new API

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
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
