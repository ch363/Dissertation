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
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        contentStyle: { backgroundColor: theme.colors.background },
        // Respect the user's Reduce Motion preference.
        animation: reduceMotion ? 'none' : 'default',
        animationDuration: reduceMotion ? 0 : 600,
        headerLeft: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={12}
            onPress={handleBack}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.mutedText} />
          </Pressable>
        ),
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Home"
            hitSlop={12}
            onPress={handleHomePress}
            style={styles.homeBtn}
          >
            <Ionicons name="home" size={22} color={theme.colors.mutedText} />
          </Pressable>
        ),
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
