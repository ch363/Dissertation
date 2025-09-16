import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '@/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { ensureProfileSeed } from '@/modules/profile';
import { getSession, exchangeCodeForSession } from '@/modules/auth';

export default function AuthCallback() {
  const [msg, setMsg] = useState<string>('Completing sign in…');
  const [err, setErr] = useState<string | null>(null);
  const params = useLocalSearchParams();

  useEffect(() => {
    (async () => {
      try {
        // Supabase JS handles implicit flow automatically if configured, but ensure session is present
        const session = await getSession();
        if (!session && params && typeof params['code'] === 'string' && params['code'].length > 0) {
          // PKCE flow
          await exchangeCodeForSession(String(params['code']));
        }
        await ensureProfileSeed();
        router.replace('/(tabs)/home');
      } catch (e: any) {
        setErr(e?.message || 'Failed to complete sign in');
        setMsg('');
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      {msg ? (
        <>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.msg}>{msg}</Text>
        </>
      ) : null}
      {err ? <Text style={styles.err}>{err}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  msg: { marginTop: 12, color: theme.colors.text },
  err: { marginTop: 12, color: theme.colors.error },
});
