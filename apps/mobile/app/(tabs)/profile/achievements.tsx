import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/modules/settings';
import { theme as baseTheme } from '@/theme';
import { Card } from '@/components/profile/Card';
import { Badge } from '@/components/profile/Badge';

export default function AchievementsScreen() {
  const { theme } = useAppTheme();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: baseTheme.spacing.lg }}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Achievements</Text>
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Badge text="7-day Streak" />
            <Badge text="100 XP" />
            <Badge text="Vocabulary Novice" />
          </View>
        </Card>

        <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>All Badges</Text>
        <Card>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['Daily Learner', 'Grammar Guru', 'Pronunciation Pro', 'Consistent', 'Storyteller', 'Flashcard Fan'].map((t) => (
              <Badge key={t} text={t} />
            ))}
          </View>
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
    marginBottom: baseTheme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 18,
    marginBottom: baseTheme.spacing.md,
  },
});
