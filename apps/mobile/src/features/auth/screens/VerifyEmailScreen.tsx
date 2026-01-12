import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resendConfirmationEmail } from '@/app/api/auth';
import { theme } from '@/services/theme/tokens';

export default function VerifyEmail() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' ? params.email : '';
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email || resending) return;
    try {
      setResending(true);
      setResendError(null);
      setResendMessage(null);
      await resendConfirmationEmail(email);
      setResendMessage('Confirmation email sent! Please check your inbox.');
    } catch (e: any) {
      console.error('VerifyEmail: Error resending email', e);
      setResendError(e?.message ?? 'Unable to resend email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We sent a confirmation link to {email || 'your email address'}. Tap the link to activate
          your account, then log in.
        </Text>

        {resendMessage && <Text style={styles.successMessage}>{resendMessage}</Text>}
        {resendError && <Text style={styles.errorMessage}>{resendError}</Text>}

        {email && (
          <Pressable
            style={[styles.button, styles.secondary, resending && styles.disabled]}
            onPress={handleResend}
            disabled={resending}
          >
            {resending ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <Text style={[styles.buttonText, styles.secondaryText]}>Resend Email</Text>
            )}
          </Pressable>
        )}

        <Pressable
          style={[styles.button, styles.primary]}
          onPress={() => router.replace('/sign-in')}
        >
          <Text style={styles.buttonText}>Back to Log In</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FB' },
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    backgroundColor: '#F5F7FB',
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 24,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.mutedText,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  button: {
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  primary: { backgroundColor: theme.colors.primary },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontFamily: theme.typography.semiBold,
  },
  secondaryText: {
    color: theme.colors.primary,
  },
  successMessage: {
    color: '#28a745',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.regular,
  },
  errorMessage: {
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.regular,
  },
});
