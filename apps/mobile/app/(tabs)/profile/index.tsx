import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../../../src/lib/supabase';

import { getProgressSummary, type ProgressSummary } from '@/modules/progress';
import { useAppTheme } from '@/modules/settings';
import { theme as baseTheme } from '@/theme';

export default function Profile() {
  const { theme } = useAppTheme();
  const [displayName, setDisplayName] = useState<string>('');
  const [progress, setProgress] = useState<ProgressSummary | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const id = u.user?.id;
      if (!id) return;
      const { data: prof } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', id)
        .maybeSingle();
      const name = prof?.name || u.user?.user_metadata?.name || u.user?.email || 'Profile';
      setDisplayName(String(name));
      // Fetch compact progress summary
      try {
        const snapshot = await getProgressSummary(id);
        setProgress(snapshot);
      } catch {
        setProgress(null);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{displayName}</Text>

        {/* Progress summary */}
        <View
          style={[
            styles.summary,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>Your Progress</Text>
          <Text style={[styles.summaryText, { color: theme.colors.mutedText }]}>
            {progress ? `XP: ${progress.xp} • Streak: ${progress.streak}🔥` : 'Loading…'}
          </Text>
          <Link href="/(tabs)/profile/progress" asChild>
            <Pressable style={styles.linkButton} accessibilityRole="button" hitSlop={8}>
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>View details</Text>
            </Pressable>
          </Link>
        </View>

        {/* Profile actions */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>
          Account
        </Text>
        <Link href="/(tabs)/profile/edit" asChild>
          <Pressable
            accessibilityRole="button"
            style={[
              styles.row,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.label, { color: theme.colors.text }]}>Edit Profile</Text>
            <Text style={[styles.linkText, { color: theme.colors.mutedText }]}>›</Text>
          </Pressable>
        </Link>

        <Link href="/(tabs)/profile/achievements" asChild>
          <Pressable
            accessibilityRole="button"
            style={[
              styles.row,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.label, { color: theme.colors.text }]}>Achievements</Text>
            <Text style={[styles.linkText, { color: theme.colors.mutedText }]}>›</Text>
          </Pressable>
        </Link>

        <Link href="/(tabs)/profile/progress" asChild>
          <Pressable
            accessibilityRole="button"
            style={[
              styles.row,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.label, { color: theme.colors.text }]}>Progress Details</Text>
            <Text style={[styles.linkText, { color: theme.colors.mutedText }]}>›</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: baseTheme.colors.background },
  container: {
    flex: 1,
    backgroundColor: baseTheme.colors.background,
    padding: baseTheme.spacing.lg,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
    color: baseTheme.colors.text,
    marginBottom: baseTheme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 18,
    marginBottom: baseTheme.spacing.md,
  },
  summary: {
    width: '100%',
    borderRadius: baseTheme.radius.lg,
    padding: baseTheme.spacing.lg,
    borderWidth: 1,
    marginBottom: baseTheme.spacing.lg,
    borderColor: baseTheme.colors.border,
  },
  summaryTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
    marginBottom: baseTheme.spacing.xs,
  },
  summaryText: {
    fontFamily: baseTheme.typography.regular,
    marginBottom: baseTheme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: baseTheme.colors.card,
    borderRadius: baseTheme.radius.md,
    padding: baseTheme.spacing.md,
    marginBottom: baseTheme.spacing.md,
    borderWidth: 1,
    borderColor: baseTheme.colors.border,
  },
  label: {
    fontFamily: baseTheme.typography.regular,
    color: baseTheme.colors.text,
  },
  linkButton: {
    paddingHorizontal: baseTheme.spacing.md,
    paddingVertical: baseTheme.spacing.sm,
    borderRadius: baseTheme.radius.md,
  },
  linkText: {
    fontFamily: baseTheme.typography.semiBold,
  },
});
