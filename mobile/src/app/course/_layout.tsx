import { Stack } from 'expo-router';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { theme } from '@/services/theme/tokens';

export default function CourseLayout() {
  const reduceMotion = useReducedMotion();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        // Respect the user's Reduce Motion preference.
        animation: reduceMotion ? 'none' : 'default',
        animationDuration: reduceMotion ? 0 : 300,
      }}
    />
  );
}
