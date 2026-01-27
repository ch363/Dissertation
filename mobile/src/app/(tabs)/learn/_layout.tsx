import { Stack } from 'expo-router';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useAppTheme } from '@/services/theme/ThemeProvider';

export default function LearnLayout() {
  const { theme } = useAppTheme();
  const reduceMotion = useReducedMotion();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        contentStyle: { backgroundColor: theme.colors.background },
        // Respect the user's Reduce Motion preference.
        animation: reduceMotion ? 'none' : 'default',
        animationDuration: reduceMotion ? 0 : 600,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Learn' }} />
      <Stack.Screen name="list" options={{ title: 'Lessons', headerBackTitle: 'Learn' }} />
      <Stack.Screen name="review" options={{ title: 'Review', headerBackTitle: 'Learn' }} />
    </Stack>
  );
}
