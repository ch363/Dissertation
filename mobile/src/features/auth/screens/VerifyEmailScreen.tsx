import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { resendConfirmationEmail } from '@/services/api/auth';
import { createLogger } from '@/services/logging';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme } from '@/services/theme/tokens';
import { announce } from '@/utils/a11y';

const logger = createLogger('VerifyEmailScreen');

export default function VerifyEmail() {
  const { theme } = useAppTheme();
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
      logger.error('Error resending email', e);
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
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
          Check your email
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
          We sent a confirmation link to {email || 'your email address'}. Tap the link to activate
          your account, then log in.
        </Text>

        {resendMessage && (
          <Text
            style={[styles.successMessage, { color: theme.colors.success }]}
            accessibilityRole="alert"
          >
            {resendMessage}
          </Text>
        )}
        {resendError && (
          <Text
            style={[styles.errorMessage, { color: theme.colors.error }]}
            accessibilityRole="alert"
          >
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
            style={[styles.secondaryButton, { borderColor: theme.colors.primary }]}
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
  safe: { flex: 1 },
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 24,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    marginBottom: theme.spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
  successMessage: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.regular,
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.regular,
  },
});
