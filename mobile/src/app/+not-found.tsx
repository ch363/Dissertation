import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';

import { getCurrentUser } from '@/app/api/auth';
import { resolvePostAuthDestination } from '@/features/auth/flows/resolvePostAuthDestination';
import { routes } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

export default function GlobalError() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);

  const handleGoHome = async () => {
    try {
      setCheckingOnboarding(true);
      const user = await getCurrentUser();
      if (user?.id) {
        // Check onboarding status and route appropriately
        const destination = await resolvePostAuthDestination(user.id);
        router.replace(destination);
      } else {
        // No user - go to sign in
        router.replace(routes.auth.signIn);
      }
    } catch (err) {
      console.error('GlobalError: Error checking onboarding', err);
      // On error, default to onboarding to be safe
      router.replace('/(onboarding)/welcome');
    } finally {
      setCheckingOnboarding(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Something went wrong</Text>
      <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
        We hit an unexpected issue. You can go back and try again.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => router.back()}
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
      >
        <Text style={styles.buttonText}>Go back</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go home"
        onPress={handleGoHome}
        disabled={checkingOnboarding}
        style={[styles.button, styles.secondary, checkingOnboarding && styles.disabled]}
      >
        {checkingOnboarding ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Go home</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: baseTheme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: baseTheme.spacing.sm,
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    marginTop: baseTheme.spacing.md,
    paddingVertical: 14,
    paddingHorizontal: baseTheme.spacing.lg,
    borderRadius: baseTheme.radius.md,
  },
  secondary: {
    backgroundColor: baseTheme.colors.secondary,
  },
  buttonText: {
    color: '#fff',
    fontFamily: baseTheme.typography.semiBold,
  },
  disabled: {
    opacity: 0.6,
  },
});
