import { Stack } from 'expo-router';

import { useAppTheme } from '@/services/theme/ThemeProvider';

export default function ProfileStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="progress" options={{ headerShown: false }} />
      <Stack.Screen name="skills" options={{ headerShown: false }} />
      <Stack.Screen name="reviews" options={{ headerShown: false }} />
    </Stack>
  );
}
