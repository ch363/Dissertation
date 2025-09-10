import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme as baseTheme } from '../../../src/theme';
import { useAppTheme } from '../../../src/providers/ThemeProvider';

export default function Progress() {
  const { theme } = useAppTheme();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Your Progress</Text>
      <View style={styles.circle} />
      <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>XP: 320 • Streak: 12🔥</Text>
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Suggested: Flashcards</Text>
        <Text style={[styles.cardSubtitle, { color: theme.colors.mutedText }]}>Keep the streak alive!</Text>
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
    alignItems: 'center',
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
    color: baseTheme.colors.text,
    marginBottom: baseTheme.spacing.lg,
  },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 10,
    borderColor: baseTheme.colors.primary,
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
});
