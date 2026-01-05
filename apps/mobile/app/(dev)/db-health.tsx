import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, useNavigation } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getSupabaseClient } from '@/lib/supabase';
import { getSession } from '@/modules/auth';
import { ensureProfileSeed, upsertMyProfile } from '@/modules/profile';
import { theme as baseTheme } from '@/theme';

export default function DbHealth() {
  const [profile, setProfile] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [schemaStatus, setSchemaStatus] = useState<
    'unknown' | 'ok' | 'missing_updated_at' | 'unauth' | 'error'
  >('unknown');
  const [schemaMsg, setSchemaMsg] = useState<string>('');
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
      const supabase = getSupabaseClient();
      const session = await getSession();
      const { data: u } = await supabase.auth.getUser();
      setSessionInfo({ user: u.user, hasSession: !!session });
      const userId = u.user?.id;
      if (!userId) {
        setError('Not signed in');
        return;
      }
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
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

  async function checkProfilesSchema() {
    try {
      const supabase = getSupabaseClient();
      setSchemaStatus('unknown');
      setSchemaMsg('');
      const { data: u } = await supabase.auth.getUser();
      const id = u.user?.id;
      if (!id) {
        setSchemaStatus('unauth');
        setSchemaMsg('Not signed in');
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('updated_at, name')
        .eq('id', id)
        .maybeSingle();
      if (error) {
        if ((error as any).code === '42703') {
          setSchemaStatus('missing_updated_at');
          setSchemaMsg('Column updated_at is missing on profiles');
          return;
        }
        setSchemaStatus('error');
        setSchemaMsg(error.message || 'Error checking schema');
        return;
      }
      // Optional: attempt a no-op update to exercise trigger
      if (data) {
        const { error: updErr } = await supabase
          .from('profiles')
          .update({ name: data.name })
          .eq('id', id)
          .select('updated_at')
          .maybeSingle();
        if (updErr && (updErr as any).code === '42703') {
          setSchemaStatus('missing_updated_at');
          setSchemaMsg('Trigger expects updated_at but column missing');
          return;
        }
      }
      setSchemaStatus('ok');
      setSchemaMsg('profiles.updated_at exists; trigger likely OK');
    } catch (e: any) {
      setSchemaStatus('error');
      setSchemaMsg(e?.message || 'Unknown error');
    }
  }

  async function testProfileUpsert() {
    try {
      setError(null);
      await ensureProfileSeed();
      await upsertMyProfile({ name: profile?.name || 'Test User' });
      await load();
      setSchemaMsg('Upsert succeeded');
    } catch (e: any) {
      setSchemaMsg(e?.message || 'Upsert failed');
    }
  }

  const SQL_FIX = `-- Ensure updated_at column exists on profiles
alter table public.profiles
  add column if not exists updated_at timestamptz default now();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();`;

  async function copySqlFix() {
    await Clipboard.setStringAsync(SQL_FIX);
    setSchemaMsg('SQL copied to clipboard');
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
      <View>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={goBack}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color={baseTheme.colors.mutedText} />
          </Pressable>
          <Text style={styles.title}>DB Health</Text>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: baseTheme.spacing.lg }}
      >
        <Text style={styles.section}>Profiles Schema Check</Text>
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            marginTop: baseTheme.spacing.sm,
            flexWrap: 'wrap',
          }}
        >
          <Pressable
            style={[styles.chip, { backgroundColor: baseTheme.colors.card }]}
            onPress={checkProfilesSchema}
          >
            <Text style={{ color: baseTheme.colors.text }}>Check profiles schema</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, { backgroundColor: baseTheme.colors.card }]}
            onPress={testProfileUpsert}
          >
            <Text style={{ color: baseTheme.colors.text }}>Test profile upsert</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, { backgroundColor: baseTheme.colors.card }]}
            onPress={copySqlFix}
          >
            <Text style={{ color: baseTheme.colors.text }}>Copy SQL fix</Text>
          </Pressable>
        </View>
        {schemaStatus !== 'unknown' ? (
          <Text style={[styles.code, { marginTop: baseTheme.spacing.xs }]}>
            {schemaStatus.toUpperCase()}: {schemaMsg}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 12, marginTop: baseTheme.spacing.sm }}>
          <Pressable
            style={[styles.chip, { backgroundColor: baseTheme.colors.card }]}
            onPress={load}
          >
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
              const supabase = getSupabaseClient();
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
  section: {
    marginTop: baseTheme.spacing.lg,
    fontFamily: baseTheme.typography.semiBold,
    color: baseTheme.colors.text,
  },
  error: { color: '#dc3545', marginTop: baseTheme.spacing.sm },
  code: {
    marginTop: baseTheme.spacing.sm,
    fontFamily: baseTheme.typography.regular,
    color: baseTheme.colors.mutedText,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: baseTheme.colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: baseTheme.colors.border,
    marginRight: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: baseTheme.spacing.md,
  },
});
