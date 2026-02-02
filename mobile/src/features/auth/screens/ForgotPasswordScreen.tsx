import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { sendPasswordReset } from '@/services/api/auth';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme } from '@/services/theme/tokens';
import { announce } from '@/utils/a11y';

const emailRegex = /\S+@\S+\.\S+/;
const RESET_REDIRECT = 'fluentia://update-password';

export default function ForgotPassword() {
  const { theme } = useAppTheme();
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
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">Forgot password</Text>
      <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
        Enter your email to receive a reset link. It will open the app to update your password.
      </Text>

      <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Email</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
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

      <Link href="/sign-in" style={[styles.link, { color: theme.colors.link }]}>
        Back to sign in
      </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 24,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontFamily: theme.typography.semiBold,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: theme.spacing.md,
  },
  link: {
    fontFamily: theme.typography.semiBold,
    marginTop: theme.spacing.lg,
  },
  error: {
    marginTop: theme.spacing.xs,
  },
  success: {
    marginTop: theme.spacing.xs,
  },
});
