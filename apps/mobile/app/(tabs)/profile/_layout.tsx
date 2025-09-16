import { Stack } from 'expo-router';

import { useAppTheme } from '@/modules/settings';

export default function ProfileStackLayout() {
  const { theme } = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="progress" options={{ headerShown: true, title: 'Progress' }} />
      <Stack.Screen name="edit" options={{ headerShown: true, title: 'Edit Profile' }} />
      <Stack.Screen name="achievements" options={{ headerShown: true, title: 'Achievements' }} />
    </Stack>
  );
}
