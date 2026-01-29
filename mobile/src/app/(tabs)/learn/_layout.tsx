import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { routes } from '@/services/navigation/routes';
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
        animationDuration: reduceMotion ? 0 : 300,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Learn' }} />
      <Stack.Screen name="list" options={{ title: 'Lessons', headerBackTitle: 'Learn' }} />
      <Stack.Screen
        name="review"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backTitle: {
    fontSize: 17,
  },
});
