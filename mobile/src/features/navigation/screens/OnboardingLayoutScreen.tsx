import { Stack } from 'expo-router';

import { theme } from '@/services/theme/tokens';

export default function OnboardingLayout() {
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
      <Stack.Screen name="completion" options={{ title: '' }} />
    </Stack>
  );
}
