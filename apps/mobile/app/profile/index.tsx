import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/profile/Badge';
import { Card } from '@/components/profile/Card';
import { ProfileHeader } from '@/components/profile/Header';
import { ProgressBar } from '@/components/profile/ProgressBar';
import { StatPill } from '@/components/profile/StatPill';
import { getMyProfile } from '@/lib/profile';
import { getProgressSummary, type ProgressSummary } from '@/modules/progress';
import { refreshAvatarUrl } from '@/modules/profile/avatar';
import { useAppTheme } from '@/modules/settings';
import { theme as baseTheme } from '@/theme';

export default function Profile() {
  const { theme } = useAppTheme();
  const [displayName, setDisplayName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);

  useEffect(() => {
    (async () => {
      const profile = await getMyProfile();
      const name =
        profile?.name ||
        profile?.id || // fallback on id if available
        'Profile';
      setDisplayName(String(name).trim());
      if (profile?.avatar_url) {
        try {
          const fresh = await refreshAvatarUrl(profile.avatar_url);
          setAvatarUrl(fresh);
        } catch {
          setAvatarUrl(profile.avatar_url);
        }
      }
      try {
        const snapshot = profile?.id ? await getProgressSummary(profile.id) : null;
        setProgress(snapshot);
      } catch {
        setProgress(null);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea]}>
      <ScrollView contentContainerStyle={{ padding: baseTheme.spacing.lg }}>
        {/* Hero header */}
        <ProfileHeader
          title={displayName || 'Your Profile'}
          subtitle={progress ? `XP ${progress.xp} • Streak ${progress.streak}🔥` : 'Loading…'}
          avatarUrl={avatarUrl}
          right={
            <Link href="/profile/edit" asChild>
              <Pressable
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: theme.colors.card,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
                accessibilityRole="button"
              >
                <Text style={{ color: theme.colors.text }}>Edit</Text>
              </Pressable>
            </Link>
          }
        />

        {/* Quick stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: baseTheme.spacing.lg }}>
          <StatPill label="Level" value={progress ? String(progress.level ?? 1) : '-'} />
          <StatPill label="XP" value={progress ? String(progress.xp) : '-'} />
          <StatPill label="Streak" value={progress ? String(progress.streak) : '-'} />
        </View>

        {/* Progress card */}
        <Card style={{ marginTop: baseTheme.spacing.lg }}>
          <Text style={[styles.summaryTitle, { color: theme.colors.text, marginBottom: 8 }]}>
            Next Level
          </Text>
          <ProgressBar progress={progress ? ((progress.xp ?? 0) % 100) / 100 : 0} />
          <Link href="/profile/progress" asChild>
            <Pressable
              style={[styles.linkButton, { alignSelf: 'flex-start' }]}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                View full progress
              </Text>
            </Pressable>
          </Link>
        </Card>

        {/* Achievements preview */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>
          Achievements
        </Text>
        <Card>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Badge text="Daily Learner" />
            <Badge text="Grammar Guru" />
            <Badge text="Pronunciation Pro" />
            <Badge text="Consistent" />
          </View>
          <Link href="/profile/achievements" asChild>
            <Pressable
              style={[styles.linkButton, { alignSelf: 'flex-start' }]}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>See all</Text>
            </Pressable>
          </Link>
        </Card>

        {/* Account */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>
          Account
        </Text>
        <Card>
          <Link href="/profile/edit" asChild>
            <Pressable accessibilityRole="button" style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Edit Profile</Text>
              <Text style={[styles.linkText, { color: theme.colors.mutedText }]}>›</Text>
            </Pressable>
          </Link>
          <Link href="/profile/progress" asChild>
            <Pressable accessibilityRole="button" style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Progress Details</Text>
              <Text style={[styles.linkText, { color: theme.colors.mutedText }]}>›</Text>
            </Pressable>
          </Link>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  sectionTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 18,
    marginBottom: baseTheme.spacing.md,
  },
  summaryTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
    marginBottom: baseTheme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: baseTheme.spacing.md,
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

