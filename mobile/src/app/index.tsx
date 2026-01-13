import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { routes } from '@/services/navigation/routes';
import { theme } from '@/services/theme/tokens';

export default function LandingScreen() {
  // For unauthenticated users, show the landing page (sign up/sign in buttons)
  // For authenticated users, RouteGuard will handle redirecting to home
  // We don't navigate here to avoid "navigate before mounting" errors
  // The RouteGuard component handles all authenticated user redirects

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
