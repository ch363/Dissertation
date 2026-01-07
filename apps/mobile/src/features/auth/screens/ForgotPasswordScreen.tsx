import { Link } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';

import { sendPasswordReset } from '@/features/auth/api';
import { theme } from '@/services/theme/tokens';

const emailRegex = /\S+@\S+\.\S+/;
const RESET_REDIRECT = 'fluentia://update-password';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = emailRegex.test(email.trim()) && !loading;

  const handleReset = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      await sendPasswordReset(email.trim(), RESET_REDIRECT);
      setMessage('Check your email for a reset link.');
    } catch (e: any) {
      setError(e?.message ?? 'Unable to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot password</Text>
      <Text style={styles.subtitle}>
        Enter your email to receive a reset link. It will open the app to update your password.
      </Text>

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={theme.colors.mutedText}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}

      <Pressable
        style={[styles.button, canSubmit ? styles.primary : styles.disabled]}
        onPress={handleReset}
        disabled={!canSubmit}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send reset email</Text>
        )}
      </Pressable>

      <Link href="/sign-in" style={styles.link}>
        Back to sign in
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 24,
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    color: theme.colors.mutedText,
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
  },
  error: {
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  success: {
    color: theme.colors.secondary,
    marginTop: theme.spacing.xs,
  },
});
