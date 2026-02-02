import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LoadingRow } from '@/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ScrollView } from '@/components/ui';
import { ScreenHeader } from '@/components/navigation';
import { Card } from '@/components/profile/Card';
import { getAllMastery, type SkillMastery } from '@/services/api/mastery';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import { useAsyncData } from '@/hooks/useAsyncData';

function formatSkillName(tag: string): string {
  return tag
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function ProfileSkillsScreen() {
  const { theme } = useAppTheme();
  const { data: mastery, loading, error } = useAsyncData<SkillMastery[]>(
    'ProfileSkillsScreen',
    async () => await getAllMastery(),
    []
  );

  const lowest = useMemo(() => {
    return [...(mastery || [])]
      .sort((a, b) => a.masteryProbability - b.masteryProbability)
      .slice(0, 5);
  }, [mastery]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title="Skills"
        subtitle="Master your weakest areas"
        icon="fitness"
        label="Mastery"
        accentColor="#F59E0B"
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {loading ? (
          <LoadingRow label="Loading…" />
        ) : error ? (
          <Card>
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={20} color={theme.colors.error} />
              <Text style={[styles.errorText, { color: theme.colors.text }]}>{error}</Text>
            </View>
          </Card>
        ) : lowest.length === 0 ? (
          <Card>
            <Text style={[styles.emptyText, { color: theme.colors.mutedText }]}>
              No mastery data yet. Complete some sessions to start tracking skills.
            </Text>
          </Card>
        ) : (
          <View style={styles.list}>
            {lowest.map((s) => {
              const pct = Math.round(s.masteryProbability * 100);
              return (
                <Card key={s.skillTag} style={styles.itemCard}>
                  <View style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
                        {formatSkillName(s.skillTag)}
                      </Text>
                      <Text style={[styles.itemMeta, { color: theme.colors.mutedText }]}>
                        Probability: {pct}%
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                      <Text style={[styles.badgeText, { color: theme.colors.text }]}>{pct}%</Text>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.md,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    marginTop: -baseTheme.spacing.sm,
  },
  list: {
    gap: baseTheme.spacing.md,
  },
  itemCard: {
    padding: baseTheme.spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.md,
  },
  itemTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
  itemMeta: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
    marginTop: 2,
  },
  badge: {
    minWidth: 56,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: baseTheme.spacing.md,
  },
  badgeText: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 14,
  },
  emptyText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: baseTheme.spacing.md,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
  },
  errorText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    flex: 1,
  },
});

