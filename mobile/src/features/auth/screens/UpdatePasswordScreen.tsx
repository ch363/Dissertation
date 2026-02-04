import * as Linking from 'expo-linking';
import { Link, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator } from 'react-native';

import { Button } from '@/components/ui';
import {
  getCurrentUser,
  resolvePostAuthDestination,
  setSessionFromEmailLink,
  updatePassword,
} from '@/services/api/auth';
import { theme } from '@/services/theme/tokens';
import { announce } from '@/utils/a11y';

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

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [processing, setProcessing] = useState(true);

  const confirmRef = useRef<TextInput>(null);

  const url = Linking.useURL();

  const ensureSessionFromUrl = useCallback(
    async (incomingUrl?: string | null) => {
      if (!incomingUrl) return;
      setProcessing(true);
      setError(null);
      const { accessToken, refreshToken } = parseTokens(incomingUrl);
      if (!accessToken || !refreshToken) {
        setError('Missing access token. Open the reset link from your email.');
        setProcessing(false);
        return;
      }
      try {
        await setSessionFromEmailLink(accessToken, refreshToken);
        setSessionReady(true);
      } catch (sessionError: any) {
        setError(sessionError?.message ?? 'Unable to restore your session from the reset link.');
        setProcessing(false);
        return;
      }
      setProcessing(false);
    },
    [setProcessing],
  );

  useEffect(() => {
    Linking.getInitialURL().then((initial) => {
      if (initial) {
        ensureSessionFromUrl(initial);
      } else {
        setProcessing(false);
        setError('Open the password reset link from your email to continue.');
      }
    });
  }, [ensureSessionFromUrl]);

  useEffect(() => {
    if (url) ensureSessionFromUrl(url);
  }, [url, ensureSessionFromUrl]);

  const passwordsMatch = newPassword === confirmPassword;
  const passwordError =
    newPassword.length > 0 && newPassword.length < 6
      ? 'Password must be at least 6 characters.'
      : null;
  const confirmError =
    !passwordsMatch && confirmPassword.length > 0 ? 'Passwords do not match.' : null;
  const canSubmit = sessionReady && passwordsMatch && newPassword.length >= 6 && !loading;

  const handleUpdate = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      setError(null);
      const { user } = await updatePassword(newPassword);
      const userId = user?.id || (await getCurrentUser())?.id;
      if (userId) {
        const destination = await resolvePostAuthDestination(userId);
        router.replace(destination);
      } else {
        router.replace('/sign-in');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Unable to update password.');
    } finally {
      setLoading(false);
    }
  };

  const statusText = useMemo(() => {
    if (processing) return 'Preparing your session…';
    if (sessionReady) return null;
    return error || 'Open the password reset link from your email to continue.';
  }, [processing, sessionReady, error]);

  useEffect(() => {
    if (error) announce(error);
  }, [error]);

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Set a new password
      </Text>
      {statusText ? <Text style={styles.subtitle}>{statusText}</Text> : null}

      {processing ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: theme.spacing.md }} />
      ) : (
        <>
          <Text style={styles.inputLabel}>New password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password (min 6 chars)"
            secureTextEntry
            placeholderTextColor={theme.colors.mutedText}
            accessibilityLabel="New password"
            accessibilityHint="Create a new password"
            accessibilityState={{ invalid: !!passwordError }}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
          />
          {passwordError ? (
            <Text style={styles.error} accessibilityRole="alert">
              {passwordError}
            </Text>
          ) : null}
          <Text style={styles.inputLabel}>Confirm new password</Text>
          <TextInput
            ref={confirmRef}
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            secureTextEntry
            placeholderTextColor={theme.colors.mutedText}
            accessibilityLabel="Confirm new password"
            accessibilityHint="Re-enter your new password to confirm"
            accessibilityState={{ invalid: !!confirmError }}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={handleUpdate}
          />
          {confirmError ? (
            <Text style={styles.error} accessibilityRole="alert">
              {confirmError}
            </Text>
          ) : null}
          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          <Button
            title="Update password"
            onPress={handleUpdate}
            disabled={!canSubmit}
            loading={loading}
            accessibilityHint="Updates your password"
          />
        </>
      )}

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
});
