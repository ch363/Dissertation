import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';

import { Button } from '@/components/ui';
import { sendPasswordReset } from '@/services/api/auth';
import { theme } from '@/services/theme/tokens';
import { announce } from '@/utils/a11y';

const emailRegex = /\S+@\S+\.\S+/;
const RESET_REDIRECT = 'fluentia://update-password';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trimmedEmail = email.trim();
  const emailError =
    trimmedEmail.length > 0 && !emailRegex.test(trimmedEmail) ? 'Enter a valid email address.' : null;
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

  useEffect(() => {
    if (error) announce(error);
    else if (message) announce(message);
  }, [error, message]);

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">Forgot password</Text>
      <Text style={styles.subtitle}>
        Enter your email to receive a reset link. It will open the app to update your password.
      </Text>

      <Text style={styles.inputLabel}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={theme.colors.mutedText}
        accessibilityLabel="Email"
        accessibilityHint="Enter the email address for your account"
        accessibilityState={{ invalid: !!emailError }}
        autoComplete="email"
        textContentType="username"
        returnKeyType="done"
        onSubmitEditing={handleReset}
      />

      {emailError ? (
        <Text style={styles.error} accessibilityRole="alert">
          {emailError}
        </Text>
      ) : null}
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      {message ? (
        <Text style={styles.success} accessibilityRole="alert">
          {message}
        </Text>
      ) : null}

      <Button
        title="Send reset email"
        onPress={handleReset}
        disabled={!canSubmit}
        loading={loading}
        accessibilityHint="Sends a password reset link to your email"
      />

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
  inputLabel: {
    color: theme.colors.text,
    fontFamily: theme.typography.semiBold,
    marginBottom: theme.spacing.xs,
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
  link: {
    color: theme.colors.link,
    fontFamily: theme.typography.semiBold,
    marginTop: theme.spacing.lg,
  },
  error: {
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  success: {
    color: theme.colors.success,
    marginTop: theme.spacing.xs,
  },
});
