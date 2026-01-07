import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMyProfile } from '@/app/api/profile';
import { getProgressSummary, type ProgressSummary } from '@/app/api/progress';
import { refreshAvatarUrl } from '@/features/profile/api/avatar';
import { Badge } from '@/components/profile/Badge';
import { Card } from '@/components/profile/Card';
import { ProfileHeader } from '@/components/profile/Header';
import { ProgressBar } from '@/components/profile/ProgressBar';
import { StatPill } from '@/components/profile/StatPill';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ProfileHeader
          title={displayName || 'Your Profile'}
          subtitle={progress ? `XP ${progress.xp} • Streak ${progress.streak}🔥` : 'Loading…'}
          avatarUrl={avatarUrl}
          right={
            <Link href="/profile/edit" asChild>
              <Pressable style={styles.editButton} accessibilityRole="button">
                <Text style={{ color: theme.colors.text }}>Edit</Text>
              </Pressable>
            </Link>
          }
        />

        <View style={styles.quickStats}>
          <StatPill label="Level" value={progress ? String(progress.level ?? 1) : '-'} />
          <StatPill label="XP" value={progress ? String(progress.xp) : '-'} />
          <StatPill label="Streak" value={progress ? String(progress.streak) : '-'} />
        </View>

        <Card style={styles.cardSpacing}>
          <Text style={[styles.summaryTitle, { color: theme.colors.text, marginBottom: 8 }]}>
            Next Level
          </Text>
          <ProgressBar progress={progress ? ((progress.xp ?? 0) % 100) / 100 : 0} />
          <Link href="/profile/progress" asChild>
            <Pressable
              style={[styles.linkButton, styles.linkStart]}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                View full progress
              </Text>
            </Pressable>
          </Link>
        </Card>

        <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>
          Achievements
        </Text>
        <Card>
          <View style={styles.badges}>
            <Badge text="Daily Learner" />
            <Badge text="Grammar Guru" />
            <Badge text="Pronunciation Pro" />
            <Badge text="Consistent" />
          </View>
          <Link href="/profile/achievements" asChild>
            <Pressable
              style={[styles.linkButton, styles.linkStart]}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>See all</Text>
            </Pressable>
          </Link>
        </Card>

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
              <Text style={[styles.label, { color: theme.colors.text }]}>Progress</Text>
              <Text style={[styles.linkText, { color: theme.colors.mutedText }]}>›</Text>
            </Pressable>
          </Link>
          <Link href="/profile/achievements" asChild>
            <Pressable accessibilityRole="button" style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Achievements</Text>
              <Text style={[styles.linkText, { color: theme.colors.mutedText }]}>›</Text>
            </Pressable>
          </Link>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: baseTheme.colors.background,
  },
  content: {
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.lg,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSpacing: {
    paddingBottom: 0,
  },
  summaryTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
  sectionTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 18,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    rowGap: 8,
  },
  linkButton: {
    paddingVertical: baseTheme.spacing.sm,
    paddingHorizontal: baseTheme.spacing.md,
  },
  linkStart: {
    alignSelf: 'flex-start',
  },
  linkText: {
    fontFamily: baseTheme.typography.semiBold,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: baseTheme.spacing.md,
    borderBottomWidth: 1,
    borderColor: baseTheme.colors.border,
  },
  label: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 16,
  },
  editButton: {
    padding: baseTheme.spacing.sm,
  },
});
