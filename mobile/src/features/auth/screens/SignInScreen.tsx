import * as Linking from 'expo-linking';
import { Link, router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, LoadingScreen, ScrollView } from '@/components/ui';

import {
  resolvePostAuthDestination,
  resolvePostLoginDestination,
  setSessionFromEmailLink,
  signInWithEmailPassword,
} from '@/services/api/auth';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme } from '@/services/theme/tokens';
import { announce } from '@/utils/a11y';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingEmailCallback, setProcessingEmailCallback] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const url = Linking.useURL();

  const trimmedEmail = email.trim();
  const emailError =
    trimmedEmail.length > 0 && !emailRegex.test(trimmedEmail) ? 'Enter a valid email address.' : null;
  const passwordError =
    password.length > 0 && password.length < 6 ? 'Password must be at least 6 characters.' : null;
  const canSubmit = emailRegex.test(trimmedEmail) && password.length >= 6 && !loading;

  // Handle email confirmation callback
  const handleEmailConfirmation = useCallback(async (incomingUrl?: string | null) => {
    if (!incomingUrl) return;
    setProcessingEmailCallback(true);
    setError(null);
    const { accessToken, refreshToken } = parseTokens(incomingUrl);
    if (!accessToken || !refreshToken) {
      // No tokens in URL, this is a normal sign-in screen load
      setProcessingEmailCallback(false);
      return;
    }
    try {
      console.log('SignIn: Processing email confirmation callback', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
      });
      await setSessionFromEmailLink(accessToken, refreshToken);
      console.log('SignIn: Session set successfully');

      // Wait a moment for session to be available
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get the user ID from the session
      const { getCurrentUser } = await import('@/services/api/auth');
      const user = await getCurrentUser();
      console.log('SignIn: Got user after email confirmation', {
        userId: user?.id,
        hasUser: !!user,
      });

      if (user?.id) {
        console.log('SignIn: Email confirmed, redirecting to destination');
        const destination = await resolvePostAuthDestination(user.id);
        console.log('SignIn: Resolved destination', destination);
        router.replace(destination);
      } else {
        // User not found - might need to wait for session to propagate
        console.warn('SignIn: User not found immediately, waiting and retrying...');
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
      console.error('SignIn: Error processing email confirmation', {
        error: sessionError,
        message: sessionError?.message,
        code: sessionError?.code,
      });
      // Don't show error screen - redirect to sign-in with error message
      setProcessingEmailCallback(false);
      setError('Email confirmation failed. Please try signing in with your email and password.');
      // Give user a chance to see the error, then they can sign in manually
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
      // Login always goes to home - existing users should not see onboarding again
      const destination = await resolvePostLoginDestination(userId);
      router.replace(destination);
    } catch (e: any) {
      setError(e?.message ?? 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while processing email confirmation
  if (processingEmailCallback) {
    return (
      <LoadingScreen
        title="Verifying your email..."
        subtitle="Please wait while we confirm your account."
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: appTheme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: appTheme.colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: appTheme.colors.card, borderColor: appTheme.colors.border }]}>
          <Image
            source={require('@/assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessible={false}
          />
          <Text style={[styles.title, { color: appTheme.colors.text }]} accessibilityRole="header">
            Welcome back
          </Text>
          <Text style={[styles.subtitle, { color: appTheme.colors.mutedText }]}>Choose how you’d like to continue</Text>

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: appTheme.colors.border }]} />
            <Text style={[styles.dividerText, { color: appTheme.colors.mutedText }]}>Email</Text>
            <View style={[styles.divider, { backgroundColor: appTheme.colors.border }]} />
          </View>

          <Text style={[styles.inputLabel, { color: appTheme.colors.text }]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            style={[styles.input, { backgroundColor: appTheme.colors.card, borderColor: appTheme.colors.border, color: appTheme.colors.text }]}
            placeholderTextColor={appTheme.colors.mutedText}
            accessibilityLabel="Email"
            accessibilityHint="Enter your email address"
            accessibilityState={{ invalid: !!emailError }}
            autoComplete="email"
            textContentType="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          {emailError ? (
            <Text style={[styles.error, { color: appTheme.colors.error }]} accessibilityRole="alert">
              {emailError}
            </Text>
          ) : null}
          <Text style={[styles.inputLabel, { color: appTheme.colors.text }]}>Password</Text>
          <TextInput
            ref={passwordRef}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            style={[styles.input, { backgroundColor: appTheme.colors.card, borderColor: appTheme.colors.border, color: appTheme.colors.text }]}
            placeholderTextColor={appTheme.colors.mutedText}
            accessibilityLabel="Password"
            accessibilityHint="Enter your password"
            accessibilityState={{ invalid: !!passwordError }}
            autoComplete="password"
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
          />

          {passwordError ? (
            <Text style={[styles.error, { color: appTheme.colors.error }]} accessibilityRole="alert">
              {passwordError}
            </Text>
          ) : null}
          {error ? (
            <Text style={[styles.error, { color: appTheme.colors.error }]} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          <Button
            title={loading ? 'Signing in…' : 'Sign in with Email'}
            onPress={handleSignIn}
            disabled={!canSubmit}
            loading={loading}
            accessibilityHint="Signs you in with your email and password"
          />

          <Link href="/sign-up" style={[styles.link, { color: appTheme.colors.link }]}>
            New here? Create account
          </Link>
          <Link href="/forgot-password" style={[styles.link, { color: appTheme.colors.link }]}>
            Forgot password?
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: theme.spacing.lg,
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
    marginBottom: theme.spacing.md,
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 22,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
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
  },
  dividerText: {
    fontFamily: theme.typography.semiBold,
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
  error: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  link: {
    fontFamily: theme.typography.semiBold,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
});
