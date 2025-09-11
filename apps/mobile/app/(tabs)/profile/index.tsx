import { View, Text, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme as baseTheme } from '../../../src/theme';
import { useAppTheme } from '../../../src/providers/ThemeProvider';
import { useEffect, useState } from 'react';
import { supabase } from '../../../src/lib/supabase';

export default function Profile() {
  const { theme } = useAppTheme();
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const id = u.user?.id;
      if (!id) return;
      const { data: prof } = await supabase.from('profiles').select('name').eq('id', id).maybeSingle();
      const name = prof?.name || u.user?.user_metadata?.name || u.user?.email || 'Profile';
      setDisplayName(String(name));
    })();
  }, []);
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{displayName}</Text>

        {/* Progress Section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Your Progress</Text>
        <View style={[styles.progressCircle, { borderColor: theme.colors.primary }]} />
        <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>XP: 320 • Streak: 12🔥</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Suggested: Flashcards</Text>
          <Text style={[styles.cardSubtitle, { color: theme.colors.mutedText }]}>Keep the streak alive!</Text>
        </View>

        {/* Settings Section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>Settings</Text>
        <View style={[styles.row, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Adaptivity</Text>
          <Switch value={true} onValueChange={() => {}} trackColor={{ true: theme.colors.primary }} />
        </View>
        <View style={[styles.row, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Notifications</Text>
          <Switch value={true} onValueChange={() => {}} trackColor={{ true: theme.colors.primary }} />
        </View>
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
  progressCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 10,
    marginBottom: baseTheme.spacing.md,
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    color: baseTheme.colors.mutedText,
    marginBottom: baseTheme.spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: baseTheme.colors.card,
    borderRadius: baseTheme.radius.lg,
    padding: baseTheme.spacing.lg,
    borderWidth: 1,
    borderColor: baseTheme.colors.border,
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
});
