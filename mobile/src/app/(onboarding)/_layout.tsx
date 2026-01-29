import { Stack } from 'expo-router';

import { useAppTheme } from '@/services/theme/ThemeProvider';

export default function OnboardingLayout() {
  const { theme } = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitle: '',
        // Show back by default for question screens
        headerBackVisible: true,
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: theme.colors.background },
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
    </Stack>
  );
}
