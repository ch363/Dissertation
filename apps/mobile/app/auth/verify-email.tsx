import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';

import {
  PENDING_LOGIN_EMAIL_KEY,
  PENDING_LOGIN_PASSWORD_KEY,
  resendVerificationEmail,
  signInWithEmail,
  getSession,
} from '@/modules/auth';
import { ensureProfileSeed } from '@/modules/profile';
import { theme } from '@/theme';

export default function VerifyEmail() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);

  const onOpenMail = async () => {
    // Best-effort open mail app
    await Linking.openURL('message:')
      .catch(() => Linking.openURL('mailto:'))
      .catch(() => {});
  };

  const onResend = async () => {
    try {
      setLoading(true);
      setErr(null);
      setMsg(null);
      await resendVerificationEmail(String(email || ''));
      setMsg('Verification email sent.');
    } catch (e: any) {
      setErr(e?.message || 'Failed to resend.');
    } finally {
      setLoading(false);
    }
  };

  const tryDevBypass = async () => {
    try {
      setLoading(true);
      setErr(null);
      const [emailKv, passKv] = await AsyncStorage.multiGet([
        PENDING_LOGIN_EMAIL_KEY,
        PENDING_LOGIN_PASSWORD_KEY,
      ]);
      const savedEmail = emailKv?.[1] || '';
      const savedPass = passKv?.[1] || '';
      if (!savedEmail || !savedPass) {
        setErr('No saved credentials. Please sign up again.');
        return;
      }
      await signInWithEmail(savedEmail, savedPass).catch((e: any) => {
        throw e;
      });
      const session = await getSession();
      if (session) {
        if (!navigating) {
          setNavigating(true);
          await ensureProfileSeed();
          await AsyncStorage.multiRemove([PENDING_LOGIN_EMAIL_KEY, PENDING_LOGIN_PASSWORD_KEY]);
          router.replace('/(tabs)/home');
        }
        return;
      }
      setErr('Could not establish session after sign-in.');
    } catch (e: any) {
      const msg = e?.message || '';
      if (/confirm/i.test(msg)) {
        setErr(
          'Supabase email confirmations are enabled. Disable them in Auth → Email → Confirm email to use bypass.'
        );
      } else {
        setErr(msg || 'Bypass failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onIConfirmed = async () => {
    try {
      setLoading(true);
      setErr(null);
      // Dev bypass: attempt a direct sign-in with saved credentials
      const [emailKv, passKv] = await AsyncStorage.multiGet([
        PENDING_LOGIN_EMAIL_KEY,
        PENDING_LOGIN_PASSWORD_KEY,
      ]);
      const savedEmail = emailKv?.[1] || '';
      const savedPass = passKv?.[1] || '';
      if (savedEmail && savedPass) {
        try {
          await signInWithEmail(savedEmail, savedPass);
        } catch {}
      }
      const session = await getSession();
      if (session) {
        if (!navigating) {
          setNavigating(true);
          await ensureProfileSeed();
          await AsyncStorage.multiRemove([PENDING_LOGIN_EMAIL_KEY, PENDING_LOGIN_PASSWORD_KEY]);
          router.replace('/(tabs)/home');
        }
        return;
      }
      setErr('Still waiting for confirmation. For dev, ensure credentials are correct.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-poll for session and advance when confirmed
  useEffect(() => {
    let mounted = true;
    const id = setInterval(async () => {
      if (!mounted || navigating) return;
      try {
        // Dev: also try sign-in silently from stored creds on each poll
        const [emailKv, passKv] = await AsyncStorage.multiGet([
          PENDING_LOGIN_EMAIL_KEY,
          PENDING_LOGIN_PASSWORD_KEY,
        ]);
        const savedEmail = emailKv?.[1] || '';
        const savedPass = passKv?.[1] || '';
        if (savedEmail && savedPass) {
          try {
            await signInWithEmail(savedEmail, savedPass);
          } catch {}
        }
        const session = await getSession();
        if (session) {
          setNavigating(true);
          await ensureProfileSeed();
          await AsyncStorage.multiRemove([PENDING_LOGIN_EMAIL_KEY, PENDING_LOGIN_PASSWORD_KEY]);
          router.replace('/(tabs)/home');
        }
      } catch {}
    }, 2000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [navigating]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Please verify your email</Text>
      <Text style={styles.subtitle}>
        We sent a verification link to {email || 'your email'}. Open your inbox and confirm, then
        return here.
      </Text>
      {msg ? <Text style={styles.msg}>{msg}</Text> : null}
      {err ? <Text style={styles.err}>{err}</Text> : null}
      <Pressable style={[styles.button, styles.primary]} onPress={onOpenMail}>
        <Text style={styles.buttonText}>Open mail app</Text>
      </Pressable>
      <Pressable style={[styles.button, styles.secondary]} onPress={onResend} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Sending…' : 'Resend verification'}</Text>
      </Pressable>
      <Pressable style={[styles.button, styles.primary]} onPress={onIConfirmed} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Checking…' : 'I’ve confirmed'}</Text>
      </Pressable>
      <Pressable
        style={[styles.button, styles.secondary]}
        onPress={tryDevBypass}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Bypassing…' : 'Skip verification (dev)'}</Text>
      </Pressable>
      <Text style={styles.hint}>We’re checking automatically every few seconds.</Text>
      <Pressable onPress={() => router.replace('/')}>
        <Text style={styles.link}>Back to Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 22,
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: { marginTop: theme.spacing.sm, color: theme.colors.mutedText, textAlign: 'center' },
  msg: { color: theme.colors.secondary, marginTop: theme.spacing.sm, textAlign: 'center' },
  err: { color: theme.colors.error, marginTop: theme.spacing.sm, textAlign: 'center' },
  button: {
    marginTop: theme.spacing.md,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  primary: { backgroundColor: theme.colors.primary },
  secondary: { backgroundColor: theme.colors.secondary },
  buttonText: { color: '#fff', fontFamily: theme.typography.semiBold },
  hint: { marginTop: theme.spacing.sm, color: theme.colors.mutedText, textAlign: 'center' },
  link: { marginTop: theme.spacing.md, color: theme.colors.secondary, textAlign: 'center' },
});
