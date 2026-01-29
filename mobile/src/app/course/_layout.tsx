import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { theme } from '@/services/theme/tokens';
import { routes } from '@/services/navigation/routes';

export default function CourseLayout() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const handleBack = () => {
    router.back();
  };

  const handleHomePress = () => {
    // Dismiss all modals/stacks to reveal the home screen underneath
    router.dismissAll();
    // Navigate to home - this will slide the current screen right, revealing home underneath
    // Using navigate instead of replace to get the stack animation
    router.navigate(routes.tabs.home);
  };

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        // Respect the user's Reduce Motion preference.
        animation: reduceMotion ? 'none' : 'default',
        animationDuration: reduceMotion ? 0 : 600,
      }}
    />
  );
}

const styles = StyleSheet.create({
  backBtn: {
    marginLeft: 10,
    padding: 4,
  },
  homeBtn: {
    marginRight: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
