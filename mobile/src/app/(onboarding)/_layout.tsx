import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useCallback } from 'react';
import { TouchableOpacity } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';

export default function OnboardingLayout() {
  const { theme } = useAppTheme();
  const openHelp = useCallback(() => router.push('/(onboarding)/help'), []);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitle: '',
        headerBackVisible: true,
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: theme.colors.background },
        headerRight: () => (
          <TouchableOpacity
            onPress={openHelp}
            style={{ padding: 8, marginRight: 8 }}
            accessibilityLabel="Help"
            accessibilityRole="button"
            accessibilityHint="Opens getting started and tips"
          >
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen name="welcome" options={{ headerBackVisible: false }} />
      <Stack.Screen name="1_motivation-goals" options={{ title: '' }} />
      <Stack.Screen name="2_preferred-learning" options={{ title: '' }} />
      <Stack.Screen name="3_memory-habits" options={{ title: '' }} />
      <Stack.Screen name="4_difficulty" options={{ title: '' }} />
      <Stack.Screen name="5_gamification" options={{ title: '' }} />
      <Stack.Screen name="6_feedback-style" options={{ title: '' }} />
      <Stack.Screen name="7_session-style" options={{ title: '' }} />
      <Stack.Screen name="8_tone" options={{ title: '' }} />
      <Stack.Screen name="9_experience-level" options={{ title: '' }} />
      <Stack.Screen name="completion" options={{ title: '' }} />
      <Stack.Screen name="help" options={{ title: 'Help' }} />
    </Stack>
  );
}
