import { Stack } from 'expo-router';

import { useAppTheme } from '@/services/theme/ThemeProvider';

export default function SessionLayout() {
  const { theme } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        contentStyle: { backgroundColor: theme.colors.background },
        // Slow down the slide animation to reveal home/learn page beneath
        animationDuration: 600, // Increased from default ~350ms to 600ms
      }}
    />
  );
}
