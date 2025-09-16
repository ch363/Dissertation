import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme as baseTheme } from '@/theme';
import { supabase } from '../src/lib/supabase';
import { ensureProfileSeed } from '../src/lib/profile';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';

export default function DbHealth() {
  const [profile, setProfile] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const navigation = useNavigation();
  const goBack = useCallback(() => {
    try {
      // @ts-ignore - react-navigation type bridge
      if (navigation?.canGoBack?.()) {
        // @ts-ignore
        navigation.goBack();
        return;
      }
    } catch {}
    router.replace('/(tabs)/settings');
  }, [navigation]);

  async function load() {
    try {
      const { data: u } = await supabase.auth.getUser();
      const { data: s } = await supabase.auth.getSession();
      setSessionInfo({ user: u.user, hasSession: !!s.session });
      const userId = u.user?.id;
      if (!userId) {
        setError('Not signed in');
        return;
      }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      setProfile(prof);
      const { data: atts } = await supabase
        .from('lesson_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      setAttempts(atts ?? []);
    } catch (e: any) {
      setError(e?.message || 'Error fetching data');
    }
  }

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e: any) {
        setError(e?.message || 'Error fetching data');
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: baseTheme.spacing.lg }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={goBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={baseTheme.colors.mutedText} />
        </Pressable>
        <Text style={styles.title}>DB Health</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: baseTheme.spacing.sm }}>
        <Pressable style={[styles.chip, { backgroundColor: baseTheme.colors.card }]} onPress={load}>
          <Text style={{ color: baseTheme.colors.text }}>Refresh</Text>
        </Pressable>
        <Pressable
          style={[styles.chip, { backgroundColor: baseTheme.colors.card }]}
          onPress={async () => {
            await ensureProfileSeed();
            await load();
          }}
        >
          <Text style={{ color: baseTheme.colors.text }}>Seed profile</Text>
        </Pressable>
        <Pressable
          style={[styles.chip, { backgroundColor: baseTheme.colors.card }]}
          onPress={async () => {
            // Repair missing profile name if we can infer it
            const { data: u } = await supabase.auth.getUser();
            const metaName = (u.user?.user_metadata as any)?.name || u.user?.email || '';
            await ensureProfileSeed(metaName || undefined);
            await load();
          }}
        >
          <Text style={{ color: baseTheme.colors.text }}>Repair name</Text>
        </Pressable>
      </View>
  <Text style={styles.section}>Auth</Text>
  <Text style={styles.code}>{JSON.stringify(sessionInfo, null, 2)}</Text>
        <Text style={styles.section}>Profile</Text>
      <Text style={styles.code}>{JSON.stringify(profile, null, 2)}</Text>
        <Text style={styles.section}>Last Attempts (10)</Text>
        <Text style={styles.code}>{JSON.stringify(attempts, null, 2)}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: baseTheme.colors.background },
  container: { flex: 1, backgroundColor: baseTheme.colors.background },
  title: { fontFamily: baseTheme.typography.bold, fontSize: 22, color: baseTheme.colors.text },
  section: { marginTop: baseTheme.spacing.lg, fontFamily: baseTheme.typography.semiBold, color: baseTheme.colors.text },
  error: { color: '#dc3545', marginTop: baseTheme.spacing.sm },
  code: { marginTop: baseTheme.spacing.sm, fontFamily: baseTheme.typography.regular, color: baseTheme.colors.mutedText },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: baseTheme.colors.border,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    top: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
