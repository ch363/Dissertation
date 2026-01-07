import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/profile/Badge';
import { Card } from '@/components/profile/Card';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

export default function Achievements() {
  const { theme } = useAppTheme();
  return (
    <SafeAreaView style={[styles.safeArea]}>
      <ScrollView contentContainerStyle={{ padding: baseTheme.spacing.lg }}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Achievements</Text>
        <Card>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Badge text="Daily Learner" />
            <Badge text="Grammar Guru" />
            <Badge text="Pronunciation Pro" />
            <Badge text="Consistent" />
            <Badge text="7-day Streak" />
          </View>
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
});
