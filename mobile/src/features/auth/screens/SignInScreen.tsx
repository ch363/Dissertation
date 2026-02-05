import * as Linking from 'expo-linking';
import { Link, router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, LoadingScreen, ScrollView, StaticCard } from '@/components/ui';
import {
  resolvePostAuthDestination,
  resolvePostLoginDestination,
  setSessionFromEmailLink,
  signInWithEmailPassword,
} from '@/services/api/auth';
import { createLogger } from '@/services/logging';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import { announce } from '@/utils/a11y';

const logger = createLogger('SignIn');

const emailRegex = /\S+@\S+\.\S+/;

type TokenResult = { accessToken: string; refreshToken: string };

const parseTokens = (raw?: string | null): TokenResult => {
  if (!raw) return { accessToken: '', refreshToken: '' };
  try {
    const normalized = raw.startsWith('http') ? raw : raw.replace('fluentia://', 'https://');
    const url = new URL(normalized);
    const combined = `${url.search}${url.hash}`.replace('#', '&');
    const params = new URLSearchParams(combined);
    return {
      accessToken: params.get('access_token') || '',
      refreshToken: params.get('refresh_token') || '',
    };
  } catch {
    return { accessToken: '', refreshToken: '' };
  }
};

export default function SignIn() {
  const { theme } = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingEmailCallback, setProcessingEmailCallback] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const url = Linking.useURL();

  const trimmedEmail = email.trim();
  const emailError =
    trimmedEmail.length > 0 && !emailRegex.test(trimmedEmail)
      ? 'Enter a valid email address.'
      : null;
  const passwordError =
    password.length > 0 && password.length < 6 ? 'Password must be at least 6 characters.' : null;
  const canSubmit = emailRegex.test(trimmedEmail) && password.length >= 6 && !loading;

  const handleEmailConfirmation = useCallback(async (incomingUrl?: string | null) => {
    if (!incomingUrl) return;
    setProcessingEmailCallback(true);
    setError(null);
    const { accessToken, refreshToken } = parseTokens(incomingUrl);
    if (!accessToken || !refreshToken) {
      setProcessingEmailCallback(false);
      return;
    }
    try {
      logger.info('Processing email confirmation callback', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
      });
      await setSessionFromEmailLink(accessToken, refreshToken);
      logger.info('Session set successfully');

      await new Promise((resolve) => setTimeout(resolve, 500));

      const { getCurrentUser } = await import('@/services/api/auth');
      const user = await getCurrentUser();
      logger.info('Got user after email confirmation', {
        userId: user?.id,
        hasUser: !!user,
      });

      if (user?.id) {
        logger.info('Email confirmed, redirecting to destination');
        const destination = await resolvePostAuthDestination(user.id);
        logger.info('Resolved destination', { destination });
        router.replace(destination);
      } else {
        logger.warn('User not found immediately, waiting and retrying...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const retryUser = await getCurrentUser();
        if (retryUser?.id) {
          const destination = await resolvePostAuthDestination(retryUser.id);
          router.replace(destination);
        } else {
          throw new Error(
            'Unable to get user after email confirmation. Please try signing in manually.',
          );
        }
      }
    } catch (sessionError: any) {
      logger.error('Error processing email confirmation', sessionError as Error, {
        message: sessionError?.message,
        code: sessionError?.code,
      });
      setProcessingEmailCallback(false);
      setError('Email confirmation failed. Please try signing in with your email and password.');
    }
  }, []);

  useEffect(() => {
    Linking.getInitialURL().then((initial) => {
      if (initial) {
        handleEmailConfirmation(initial);
      }
    });
  }, [handleEmailConfirmation]);

  useEffect(() => {
    if (url) {
      handleEmailConfirmation(url);
    }
  }, [url, handleEmailConfirmation]);

  useEffect(() => {
    if (error) announce(error);
  }, [error]);

  const handleSignIn = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      setError(null);
      const { session } = await signInWithEmailPassword(trimmedEmail, password);
      const userId = session?.user?.id;
      if (!userId) throw new Error('No session returned. Please try again.');
      const destination = await resolvePostLoginDestination(userId);
      router.replace(destination);
    } catch (e: any) {
      setError(e?.message ?? 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (processingEmailCallback) {
    return (
      <LoadingScreen
        title="Verifying your email..."
        subtitle="Please wait while we confirm your account."
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        testID="signin-scroll"
        contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <StaticCard style={styles.card}>
          <Image
            source={require('@/assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessible={false}
          />
          <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
            Welcome back
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
            Choose how you’d like to continue
          </Text>

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <Text style={[styles.dividerText, { color: theme.colors.mutedText }]}>Email</Text>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          </View>

          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Email</Text>
          <TextInput
            testID="signin-email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            placeholderTextColor={theme.colors.mutedText}
            accessibilityLabel="Email"
            accessibilityHint="Enter your email address"
            accessibilityState={{ invalid: !!emailError }}
            autoComplete="email"
            textContentType="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          {emailError ? (
            <Text style={[styles.error, { color: theme.colors.error }]} accessibilityRole="alert">
              {emailError}
            </Text>
          ) : null}
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Password</Text>
          <TextInput
            testID="signin-password"
            ref={passwordRef}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            placeholderTextColor={theme.colors.mutedText}
            accessibilityLabel="Password"
            accessibilityHint="Enter your password"
            accessibilityState={{ invalid: !!passwordError }}
            autoComplete="password"
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
          />

          {passwordError ? (
            <Text style={[styles.error, { color: theme.colors.error }]} accessibilityRole="alert">
              {passwordError}
            </Text>
          ) : null}
          {error ? (
            <Text style={[styles.error, { color: theme.colors.error }]} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          <Button
            testID="signin-submit"
            title={loading ? 'Signing in…' : 'Sign in with Email'}
            onPress={handleSignIn}
            disabled={!canSubmit}
            loading={loading}
            accessibilityHint="Signs you in with your email and password"
          />

          <Link href="/sign-up" style={[styles.link, { color: theme.colors.link }]}>
            New here? Create account
          </Link>
          <Link href="/forgot-password" style={[styles.link, { color: theme.colors.link }]}>
            Forgot password?
          </Link>
        </StaticCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: baseTheme.spacing.lg,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: baseTheme.spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  logo: {
    width: 64,
    height: 64,
    alignSelf: 'center',
    marginBottom: baseTheme.spacing.md,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: baseTheme.spacing.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: baseTheme.spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: baseTheme.typography.semiBold,
  },
  inputLabel: {
    fontFamily: baseTheme.typography.semiBold,
    marginBottom: baseTheme.spacing.xs,
  },
  input: {
    borderRadius: baseTheme.radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: baseTheme.spacing.md,
  },
  error: {
    marginTop: baseTheme.spacing.xs,
    marginBottom: baseTheme.spacing.xs,
  },
  link: {
    fontFamily: baseTheme.typography.semiBold,
    textAlign: 'center',
    marginTop: baseTheme.spacing.md,
  },
});
