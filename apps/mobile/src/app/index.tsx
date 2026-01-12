import { router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resolvePostAuthDestination } from '@/features/auth/flows/resolvePostAuthDestination';
import { useAuth } from '@/services/auth/AuthProvider';
import { routes } from '@/services/navigation/routes';
import { theme } from '@/services/theme/tokens';

export default function LandingScreen() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const isOnboarding = segments[0] === 'onboarding';

  // Redirect authenticated users to their appropriate destination
  // (RouteGuard only handles public routes, so we need to handle index route here)
  // Skip redirects when already on onboarding routes - let onboarding stack handle its own navigation
  useEffect(() => {
    if (loading || !session?.user?.id || isOnboarding) return;
    (async () => {
      try {
        const dest = await resolvePostAuthDestination(session.user.id);
        if (dest) {
          router.replace(dest);
        }
      } catch (err) {
        // If there's an error, default to onboarding
        console.error('LandingScreen: Error resolving destination', err);
        router.replace('/(onboarding)/welcome');
      }
    })();
  }, [session, loading, isOnboarding]);

  const goSignUp = () => router.push(routes.auth.signUp);
  const goSignIn = () => router.push(routes.auth.signIn);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Image source={require('@/assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Fluentia</Text>
        <Text style={styles.subtitle}>Personalised learning, one step at a time.</Text>

        <View style={styles.buttons}>
          <Pressable style={[styles.button, styles.primary]} onPress={goSignUp}>
            <Text style={styles.buttonText}>Get Started</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.secondary]} onPress={goSignIn}>
            <Text style={styles.buttonText}>Log In</Text>
          </Pressable>
        </View>
        <StatusBar style="auto" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: '#F5F7FB',
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 32,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  subtitle: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    fontFamily: theme.typography.regular,
    color: theme.colors.mutedText,
    textAlign: 'center',
  },
  buttons: {
    width: '100%',
    marginTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  buttonText: {
    color: '#fff',
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
  },
});
