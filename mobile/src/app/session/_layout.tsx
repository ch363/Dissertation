import { Stack } from 'expo-router';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useAppTheme } from '@/services/theme/ThemeProvider';

export default function SessionLayout() {
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
        animationDuration: reduceMotion ? 0 : 300,
      }}
    />
  );
}
