import { Link, router } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resolvePostAuthDestination, signUpWithEmail } from '@/modules/auth';
import { theme } from '@/theme';

const emailRegex = /\S+@\S+\.\S+/;
const MIN_PASSWORD = 8;

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const trimmedEmail = email.trim();
  const trimmedName = name.trim();
  const passwordsMatch = password === confirmPassword;
  const canSubmit =
    emailRegex.test(trimmedEmail) && password.length >= MIN_PASSWORD && passwordsMatch && !loading;

  const handleSignUp = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      setError(null);
      const { session, user } = await signUpWithEmail(trimmedName || null, trimmedEmail, password);
      const userId = session?.user?.id || user?.id;
      // If email confirmation is required, Supabase will not return a session.
      if (!session) {
        router.replace({ pathname: '/auth/verify-email', params: { email: trimmedEmail } });
        return;
      }
      if (userId) {
        const destination = await resolvePostAuthDestination(userId);
        router.replace(destination);
      } else {
        router.replace('/auth/sign-in');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepDotActive]} />
            <View style={styles.stepDot} />
            <View style={styles.stepDot} />
          </View>
          <Text style={styles.labelSmall}>Step 1 of 3</Text>
          <Text style={styles.title}>Create your account</Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={theme.colors.mutedText}
          />

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={theme.colors.mutedText}
          />

          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={`Min. ${MIN_PASSWORD} characters`}
            secureTextEntry
            placeholderTextColor={theme.colors.mutedText}
          />

          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm password"
            secureTextEntry
            placeholderTextColor={theme.colors.mutedText}
          />

          {!passwordsMatch && confirmPassword.length > 0 ? (
            <Text style={styles.error}>Passwords do not match.</Text>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, canSubmit ? styles.primary : styles.disabled]}
            onPress={handleSignUp}
            disabled={!canSubmit}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating account…' : 'Create Account'}
            </Text>
          </Pressable>

          <Link href="/auth/sign-in" style={styles.link}>
            Already have an account? Sign in
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
    backgroundColor: '#F5F7FB',
    padding: theme.spacing.lg,
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
  stepRow: {
    flexDirection: 'row',
    gap: 6,
    alignSelf: 'center',
    marginBottom: theme.spacing.sm,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.border,
  },
  stepDotActive: {
    backgroundColor: theme.colors.primary,
  },
  labelSmall: {
    textAlign: 'center',
    color: theme.colors.mutedText,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.semiBold,
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 22,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
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
  link: {
    color: theme.colors.secondary,
    fontFamily: theme.typography.semiBold,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  error: {
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
});
