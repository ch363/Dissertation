import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/modules/settings';
import { theme as baseTheme } from '@/theme';
import { Card } from '@/components/profile/Card';
import { ProgressBar } from '@/components/profile/ProgressBar';
import { StatPill } from '@/components/profile/StatPill';
import { Badge } from '@/components/profile/Badge';

export default function ProfileProgress() {
  const { theme } = useAppTheme();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: baseTheme.spacing.lg }}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Your Progress</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: baseTheme.spacing.lg }}>
          <StatPill label="Level" value={'5'} />
          <StatPill label="XP" value={'320'} />
          <StatPill label="Streak" value={'120'} />
        </View>

        <Card>
          <Text style={[styles.cardTitle, { color: theme.colors.text, marginBottom: 8 }]}>Level 6</Text>
          <ProgressBar progress={0.32} />
          <Text style={[styles.cardSubtitle, { color: theme.colors.mutedText, marginTop: 6 }]}>320 / 1000 XP</Text>
        </Card>

        <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>Milestones</Text>
        <Card>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Badge text="First Lesson" />
            <Badge text="7-day Streak" />
            <Badge text="100 XP" />
            <Badge text="Grammar Guru" />
          </View>
        </Card>

        <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>Suggested next</Text>
        <Card>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Flashcards</Text>
          <Text style={[styles.cardSubtitle, { color: theme.colors.mutedText }]}>Keep the streak alive!</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: baseTheme.colors.background },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
    color: baseTheme.colors.text,
    marginBottom: baseTheme.spacing.lg,
  },
  sectionTitle: { fontFamily: baseTheme.typography.semiBold, fontSize: 18, marginBottom: baseTheme.spacing.md },
  cardTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 18,
    color: baseTheme.colors.text,
  },
  cardSubtitle: {
    fontFamily: baseTheme.typography.regular,
    color: baseTheme.colors.mutedText,
  },
});
