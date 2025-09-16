import { useEffect, useState } from 'react';
import { router, Link } from 'expo-router';
import { getCurrentUser } from '@/modules/auth';
import { hasOnboarding } from '@/modules/onboarding';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '@/theme';

export default function Index() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          // Show login/signup screen
          return;
        }
        const done = await hasOnboarding(user.id);
        if (!done) {
          router.replace('/onboarding/welcome');
        } else {
          router.replace('/(tabs)/home');
        }
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      {checking && (
        <View style={{ position: 'absolute', top: 12, right: 12 }}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      )}
      <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Fluentia</Text>
      <Text style={styles.subtitle}>Personalised learning, one step at a time.</Text>

      <Link href="/auth/signup" style={[styles.button, styles.primary]}>Get Started</Link>
      <Link href="/auth/login" style={[styles.button, styles.secondary]}>Log In</Link>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 28,
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    fontFamily: theme.typography.regular,
    color: theme.colors.mutedText,
  },
  button: {
    width: '100%',
    textAlign: 'center',
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.md,
    fontFamily: theme.typography.semiBold,
    overflow: 'hidden',
  },
  primary: {
    backgroundColor: theme.colors.primary,
    color: '#fff',
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
    color: '#fff',
  },
});
