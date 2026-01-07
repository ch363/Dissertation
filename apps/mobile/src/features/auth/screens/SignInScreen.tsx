import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resolvePostAuthDestination, signInWithEmailPassword } from '@/features/auth/api';
import { theme } from '@/services/theme/tokens';

const emailRegex = /\S+@\S+\.\S+/;

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const trimmedEmail = email.trim();
  const canSubmit = emailRegex.test(trimmedEmail) && password.length >= 6 && !loading;

  const handleSignIn = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      setError(null);
      const { session } = await signInWithEmailPassword(trimmedEmail, password);
      const userId = session?.user?.id;
      if (!userId) throw new Error('No session returned. Please try again.');
      const destination = await resolvePostAuthDestination(userId);
      router.replace(destination);
    } catch (e: any) {
      setError(e?.message ?? 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Image source={require('@/assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Choose how you’d like to continue</Text>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Email</Text>
            <View style={styles.divider} />
          </View>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            placeholderTextColor={theme.colors.mutedText}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            style={styles.input}
            placeholderTextColor={theme.colors.mutedText}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, canSubmit ? styles.primary : styles.disabled]}
            onPress={handleSignIn}
            disabled={!canSubmit}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign in with Email</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.push('/sign-up')}>
            <Text style={styles.link}>New here? Create account</Text>
          </Pressable>
          <Link href="/forgot-password" style={styles.link}>
            Forgot password?
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FB' },
  container: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    backgroundColor: '#F5F7FB',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  logo: {
    width: 64,
    height: 64,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 22,
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: theme.colors.mutedText,
    marginBottom: theme.spacing.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    color: theme.colors.mutedText,
    fontFamily: theme.typography.semiBold,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  button: {
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  primary: { backgroundColor: theme.colors.primary },
  disabled: { backgroundColor: theme.colors.border },
  buttonText: {
    color: '#fff',
    fontFamily: theme.typography.semiBold,
  },
  error: {
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  link: {
    color: theme.colors.secondary,
    fontFamily: theme.typography.semiBold,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
});
