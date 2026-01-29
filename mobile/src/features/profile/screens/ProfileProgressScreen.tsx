import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScrollView } from '@/components/ui';
import { ScreenHeader } from '@/components/navigation';
import { Card } from '@/components/profile/Card';
import { ProgressBar } from '@/components/profile/ProgressBar';
import { StatPill } from '@/components/profile/StatPill';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

export default function ProfileProgress() {
  const { theme } = useAppTheme();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title="Progress"
        subtitle="Track your learning journey"
        icon="trending-up"
        label="Stats"
        accentColor="#10B981"
      />
      <ScrollView contentContainerStyle={{ padding: baseTheme.spacing.lg }}>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: baseTheme.spacing.lg }}>
          <StatPill label="Level" value="5" />
          <StatPill label="XP" value="320" />
          <StatPill label="Streak" value="120" />
        </View>

        <Card>
          <Text style={[styles.cardTitle, { color: theme.colors.text, marginBottom: 8 }]}>
            Level 6
          </Text>
          <ProgressBar progress={0.32} />
          <Text style={[styles.cardSubtitle, { color: theme.colors.mutedText, marginTop: 6 }]}>
            320 / 1000 XP
          </Text>
        </Card>

        <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>
          Suggested next
        </Text>
        <Card>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Flashcards</Text>
          <Text style={[styles.cardSubtitle, { color: theme.colors.mutedText }]}>
            Keep the streak alive!
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
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
