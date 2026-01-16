import { Stack } from 'expo-router';

import { useAppTheme } from '@/services/theme/ThemeProvider';

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
    </Stack>
  );
}
