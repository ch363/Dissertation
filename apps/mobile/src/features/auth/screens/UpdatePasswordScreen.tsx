import * as Linking from 'expo-linking';
import { Link, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';

import {
  getCurrentUser,
  resolvePostAuthDestination,
  setSessionFromEmailLink,
  updatePassword,
} from '@/app/api/auth';
import { theme } from '@/services/theme/tokens';

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
    [setProcessing]
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set a new password</Text>
      {statusText ? <Text style={styles.subtitle}>{statusText}</Text> : null}

      {processing ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: theme.spacing.md }} />
      ) : (
        <>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password (min 6 chars)"
            secureTextEntry
            placeholderTextColor={theme.colors.mutedText}
          />
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            secureTextEntry
            placeholderTextColor={theme.colors.mutedText}
          />
          {!passwordsMatch && confirmPassword.length > 0 ? (
            <Text style={styles.error}>Passwords do not match.</Text>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, canSubmit ? styles.primary : styles.disabled]}
            onPress={handleUpdate}
            disabled={!canSubmit}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Update password</Text>
            )}
          </Pressable>
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
});
