import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { resendConfirmationEmail } from '@/services/api/auth';
import { theme } from '@/services/theme/tokens';
import { announce } from '@/utils/a11y';

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

  useEffect(() => {
    if (resendError) announce(resendError);
    else if (resendMessage) announce(resendMessage);
  }, [resendError, resendMessage]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title} accessibilityRole="header">Check your email</Text>
        <Text style={styles.subtitle}>
          We sent a confirmation link to {email || 'your email address'}. Tap the link to activate
          your account, then log in.
        </Text>

        {resendMessage && (
          <Text style={styles.successMessage} accessibilityRole="alert">
            {resendMessage}
          </Text>
        )}
        {resendError && (
          <Text style={styles.errorMessage} accessibilityRole="alert">
            {resendError}
          </Text>
        )}

        {email && (
          <Button
            title="Resend Email"
            onPress={handleResend}
            loading={resending}
            variant="ghost"
            accessibilityHint="Resends the confirmation email"
            style={styles.secondaryButton}
          />
        )}

        <Button
          title="Back to Log In"
          onPress={() => router.replace('/sign-in')}
          accessibilityHint="Returns to the sign in screen"
        />
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
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
  successMessage: {
    color: theme.colors.success,
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
